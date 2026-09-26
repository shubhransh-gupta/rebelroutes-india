import math
import asyncio
from datetime import datetime, timezone, timedelta
from typing import List, Tuple, Dict, Any, Optional
from app.services.routing import haversine_distance_meters, fetch_osrm_route
from app.services.choke_detector import detect_choke_point_bypasses
from app.schemas.routes import (
    OptimalRouteRequest, OptimalRouteResponse, RouteGeometry,
    OptimalCandidate, Coordinate
)

def get_current_traffic_profile(scenario: str = "live") -> Dict[str, Any]:
    """
    Derives real traffic multiplier and delay factors based on Indian Standard Time (IST).
    Supports live time as well as peak simulation scenarios.
    """
    tz_ist = timezone(timedelta(hours=5, minutes=30))
    now_ist = datetime.now(tz_ist)

    if scenario == "peak_morning":
        hour, minute = 9, 15
        time_str = "09:15 AM (Morning Rush Simulation)"
    elif scenario == "peak_evening":
        hour, minute = 18, 45
        time_str = "06:45 PM (Evening Rush Simulation)"
    else:
        hour = now_ist.hour
        minute = now_ist.minute
        time_str = now_ist.strftime("%I:%M %p IST")

    # 1. Late night / early morning (10:30 PM - 06:30 AM):
    # Roads are wide open; no signal bottlenecks or gate congestion
    if (hour >= 23) or (hour < 6) or (hour == 22 and minute >= 30) or (hour == 6 and minute < 30):
        return {
            "traffic_multiplier": 0.85,
            "gate_delay_seconds": 60.0,   # quick 1-min gate exit
            "choke_delay_factor": 0.0,    # 0 bottlenecks at night
            "condition": "light",
            "time_str": time_str,
            "is_night": True,
            "description": "Late night / early dawn — roads are clear and flowing freely."
        }

    # 2. Morning rush peak (08:30 AM - 11:30 AM):
    # Severe bottleneck congestion entering office hubs & tech parks
    elif (hour == 8 and minute >= 30) or (9 <= hour < 11) or (hour == 11 and minute < 30):
        return {
            "traffic_multiplier": 1.90,
            "gate_delay_seconds": 480.0,  # ~8 mins gate crawl / cab queue
            "choke_delay_factor": 1.0,
            "condition": "heavy",
            "time_str": time_str,
            "is_night": False,
            "description": "Morning rush hour — heavy signal and corridor congestion."
        }

    # 3. Evening rush peak (05:30 PM - 09:00 PM):
    # Maximum standstill bottlenecks across arterial corridors
    elif (hour == 17 and minute >= 30) or (18 <= hour < 21):
        return {
            "traffic_multiplier": 2.15,
            "gate_delay_seconds": 540.0,  # ~9 mins campus exit queue
            "choke_delay_factor": 1.15,
            "condition": "gridlock",
            "time_str": time_str,
            "is_night": False,
            "description": "Evening rush hour — severe bottleneck gridlock."
        }

    # 4. Moderate daytime / transition hours:
    else:
        return {
            "traffic_multiplier": 1.15,
            "gate_delay_seconds": 180.0,  # ~3 mins
            "choke_delay_factor": 0.35,
            "condition": "moderate",
            "time_str": time_str,
            "is_night": False,
            "description": "Moderate daytime traffic — steady movement with occasional signal queues."
        }

def generate_radial_candidates(center_lat: float, center_lng: float, radius_meters: float, num_angles: int = 8) -> List[Tuple[float, float, float]]:
    """Generate candidate coordinates around a center point (lat, lng, distance_meters)."""
    candidates = []
    R = 6371000.0
    radii = [radius_meters * 0.5, radius_meters * 0.85]
    
    for r in radii:
        for i in range(num_angles):
            bearing = (2 * math.pi * i) / num_angles
            lat_rad = math.radians(center_lat)
            lng_rad = math.radians(center_lng)

            new_lat_rad = math.asin(
                math.sin(lat_rad) * math.cos(r / R) +
                math.cos(lat_rad) * math.sin(r / R) * math.cos(bearing)
            )
            new_lng_rad = lng_rad + math.atan2(
                math.sin(bearing) * math.sin(r / R) * math.cos(lat_rad),
                math.cos(r / R) - math.sin(lat_rad) * math.sin(new_lat_rad)
            )
            candidates.append((math.degrees(new_lat_rad), math.degrees(new_lng_rad), r))
    return candidates

async def compute_rebel_optimal_route(req: OptimalRouteRequest) -> OptimalRouteResponse:
    p_lat = req.pickup.lat
    p_lng = req.pickup.lng
    d_lat = req.destination.lat
    d_lng = req.destination.lng

    # 1. Derive real traffic profile from time of day / scenario
    scenario = getattr(req, "traffic_scenario", "live") or "live"
    profile = get_current_traffic_profile(scenario)

    # 2. Fetch direct baseline route via OSRM
    direct_route_raw = await fetch_osrm_route(p_lat, p_lng, d_lat, d_lng, mode="driving")
    direct_coords = direct_route_raw["coordinates"]
    direct_dist = direct_route_raw["distance_meters"]
    direct_dur_base = direct_route_raw["duration_seconds"]

    # Scale drive duration by current time-of-day traffic multiplier
    direct_dur_scaled = direct_dur_base * profile["traffic_multiplier"]
    baseline_total_seconds = direct_dur_scaled + profile["gate_delay_seconds"]

    best_pickup_cand = None
    best_drop_cand = None
    best_rebel_dur = baseline_total_seconds
    best_route_coords = direct_coords
    best_distance = direct_dist

    # 3. Only evaluate shifted pickups if traffic conditions warrant it
    if not profile["is_night"] and req.optimization_mode in ["pickup", "both"] and profile["gate_delay_seconds"] > 120:
        candidates = generate_radial_candidates(p_lat, p_lng, float(req.pickup_radius_meters), num_angles=6)
        
        scored_candidates = []
        for c_lat, c_lng, dist in candidates:
            dist_to_dest = haversine_distance_meters(c_lat, c_lng, d_lat, d_lng)
            scored_candidates.append((dist_to_dest, c_lat, c_lng, dist))
        
        scored_candidates.sort(key=lambda x: x[0])
        top_candidates = scored_candidates[:3]

        for idx, (_, c_lat, c_lng, r_dist) in enumerate(top_candidates):
            walk_time = r_dist / 1.33 # ~4.8 km/h walking pace
            drive_res = await fetch_osrm_route(c_lat, c_lng, d_lat, d_lng, mode="driving")
            drive_time = drive_res["duration_seconds"] * profile["traffic_multiplier"]
            
            rebel_total = walk_time + drive_time
            time_saved = baseline_total_seconds - rebel_total

            # Only suggest if saving at least 2 minutes
            if time_saved >= 120 and (best_pickup_cand is None or time_saved > best_pickup_cand.time_saved_seconds):
                walk_mins = max(1, round(walk_time / 60))
                saved_cand_mins = round(time_saved / 60, 1)
                best_pickup_cand = OptimalCandidate(
                    index=idx,
                    label="Smart Walk-to-Road Pickup",
                    location=Coordinate(lat=c_lat, lng=c_lng),
                    walk_distance_meters=round(r_dist, 0),
                    walk_duration_seconds=round(walk_time, 0),
                    driving_duration_seconds=round(drive_time, 0),
                    total_journey_seconds=round(rebel_total, 0),
                    time_saved_seconds=round(time_saved, 0),
                    reason=f"Walk ~{walk_mins} mins ({int(r_dist)}m) outside to the main road. You avoid the campus gate queue and cabs can pick you up immediately."
                )
                best_rebel_dur = rebel_total
                best_route_coords = drive_res["coordinates"]
                best_distance = drive_res["distance_meters"]

    # 4. Check choke point bypasses along the polyline
    choke_bypasses = await detect_choke_point_bypasses(
        req.city_id or "bengaluru",
        direct_coords,
        choke_delay_factor=profile["choke_delay_factor"]
    )
    
    choke_time_saved = sum(c.net_time_saved_seconds for c in choke_bypasses)
    rebel_duration_final = max(180.0, best_rebel_dur - (choke_time_saved * 0.75))
    total_saved = max(0.0, baseline_total_seconds - rebel_duration_final)
    saved_mins = round(total_saved / 60.0, 1)

    direct_mins = round(baseline_total_seconds / 60.0, 1)
    rebel_mins = round(rebel_duration_final / 60.0, 1)

    # 5. Build simple, plain English verdict and actionable steps for non-technical users
    action_steps: List[str] = []

    if profile["is_night"] or saved_mins <= 1.5:
        # Clear roads: Tell user directly and honestly to take the direct route
        verdict = f"🟢 Clear roads right now ({profile['time_str']})! Traffic is flowing smoothly. Take the direct route straight to your destination — no walking or bypasses needed."
        action_steps = [
            "🚗 Take a direct cab or auto straight from your door to your destination.",
            f"⏱️ Roads are clear at this hour — estimated travel time is just ~{direct_mins} mins.",
            "🌙 No traffic bottlenecks detected on your corridor right now."
        ]
        rebel_duration_final = baseline_total_seconds
        rebel_mins = direct_mins
        saved_mins = 0.0
        best_pickup_cand = None
        choke_bypasses = []
    else:
        # Congested roads: Provide step-by-step guidance in simple English
        verdict = f"⚡ Save ~{saved_mins} mins! Skip the {profile['condition']} rush hour congestion ({profile['time_str']})."
        
        step_num = 1
        if best_pickup_cand:
            action_steps.append(
                f"Step {step_num}: Walk {int(best_pickup_cand.walk_distance_meters)}m outside to the main road (~{max(1, round(best_pickup_cand.walk_duration_seconds/60))} min walk) to skip the gate line."
            )
            step_num += 1

        for bp in choke_bypasses:
            action_steps.append(
                f"Step {step_num}: At {bp.choke_name}, ask the driver to drop you before the signal. Walk {int(bp.walk_distance_meters)}m past the jam and re-hail your ride on the clear road ahead."
            )
            step_num += 1

        action_steps.append(
            f"🎯 Result: You arrive in ~{rebel_mins} mins instead of sitting in traffic for {direct_mins} mins."
        )

    return OptimalRouteResponse(
        city_id=req.city_id or "bengaluru",
        direct_route=RouteGeometry(
            coordinates=direct_coords,
            distance_meters=round(direct_dist, 1),
            duration_seconds=round(baseline_total_seconds, 1)
        ),
        rebel_route=RouteGeometry(
            coordinates=best_route_coords,
            distance_meters=round(best_distance, 1),
            duration_seconds=round(rebel_duration_final, 1)
        ),
        direct_duration_minutes=direct_mins,
        rebel_duration_minutes=rebel_mins,
        total_time_saved_minutes=saved_mins,
        pickup_arbitrage=best_pickup_cand,
        drop_arbitrage=best_drop_cand,
        choke_bypasses=choke_bypasses,
        verdict=verdict,
        traffic_condition=profile["condition"],
        time_of_day_note=profile["time_str"],
        simple_action_steps=action_steps
    )

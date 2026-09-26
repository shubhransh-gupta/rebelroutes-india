import math
import asyncio
from typing import List, Tuple, Dict, Any, Optional
from app.services.routing import haversine_distance_meters, fetch_osrm_route
from app.services.choke_detector import detect_choke_point_bypasses
from app.schemas.routes import (
    OptimalRouteRequest, OptimalRouteResponse, RouteGeometry,
    OptimalCandidate, Coordinate
)

def generate_radial_candidates(center_lat: float, center_lng: float, radius_meters: float, num_angles: int = 8) -> List[Tuple[float, float, float]]:
    """Generate candidate coordinates around a center point (lat, lng, distance_meters)."""
    candidates = []
    # R earth in meters
    R = 6371000.0
    radii = [radius_meters * 0.5, radius_meters * 0.85]
    
    for r in radii:
        for i in range(num_angles):
            bearing = (2 * math.pi * i) / num_angles
            # Formula for destination point
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

    # 1. Fetch direct baseline route
    direct_route_raw = await fetch_osrm_route(p_lat, p_lng, d_lat, d_lng, mode="driving")
    direct_coords = direct_route_raw["coordinates"]
    direct_dist = direct_route_raw["distance_meters"]
    direct_dur = direct_route_raw["duration_seconds"]

    # In Indian urban traffic, add realistic gate-entry and internal crawling overhead
    internal_gate_delay_seconds = 480.0  # ~8 mins waiting for cab inside campus or making mandatory U-turn
    baseline_total_seconds = direct_dur + internal_gate_delay_seconds

    best_pickup_cand = None
    best_drop_cand = None
    best_rebel_dur = baseline_total_seconds
    best_route_coords = direct_coords
    best_distance = direct_dist

    # 2. Check candidate pickup shifts if requested
    if req.optimization_mode in ["pickup", "both"]:
        candidates = generate_radial_candidates(p_lat, p_lng, float(req.pickup_radius_meters), num_angles=6)
        
        # Evaluate 4 most promising candidates in the direction of destination
        scored_candidates = []
        for c_lat, c_lng, dist in candidates:
            # Vector angle alignment
            dist_to_dest = haversine_distance_meters(c_lat, c_lng, d_lat, d_lng)
            scored_candidates.append((dist_to_dest, c_lat, c_lng, dist))
        
        scored_candidates.sort(key=lambda x: x[0])
        top_candidates = scored_candidates[:3]

        for idx, (_, c_lat, c_lng, r_dist) in enumerate(top_candidates):
            # Walking time from original pickup to shifted candidate
            walk_time = r_dist / 1.33 # ~4.8 km/h
            # Drive time from shifted candidate to destination
            drive_res = await fetch_osrm_route(c_lat, c_lng, d_lat, d_lng, mode="driving")
            drive_time = drive_res["duration_seconds"]
            # No internal gate delay when hailing directly from main arterial road!
            rebel_total = walk_time + drive_time
            time_saved = baseline_total_seconds - rebel_total

            if time_saved > 120 and (best_pickup_cand is None or time_saved > best_pickup_cand.time_saved_seconds):
                best_pickup_cand = OptimalCandidate(
                    index=idx,
                    label="Shifted Pickup (Arterial Boundary)",
                    location=Coordinate(lat=c_lat, lng=c_lng),
                    walk_distance_meters=round(r_dist, 0),
                    walk_duration_seconds=round(walk_time, 0),
                    driving_duration_seconds=round(drive_time, 0),
                    total_journey_seconds=round(rebel_total, 0),
                    time_saved_seconds=round(time_saved, 0),
                    reason=f"Walking {int(r_dist)}m outside the complex avoids gate bottleneck and immediate U-turn delay."
                )
                best_rebel_dur = rebel_total
                best_route_coords = drive_res["coordinates"]
                best_distance = drive_res["distance_meters"]

    # 3. Check choke point bypasses along the polyline
    choke_bypasses = await detect_choke_point_bypasses(req.city_id or "bengaluru", direct_coords)
    
    # Accumulate choke bypass time savings
    choke_time_saved = sum(c.net_time_saved_seconds for c in choke_bypasses)
    rebel_duration_final = max(300.0, best_rebel_dur - (choke_time_saved * 0.7))
    total_saved = max(0.0, baseline_total_seconds - rebel_duration_final)

    # Verdict generation
    saved_mins = round(total_saved / 60.0, 1)
    if saved_mins >= 12:
        verdict = f"Massive Win: You save ~{saved_mins} mins by walking past choke points and taking arterial pickup."
    elif saved_mins >= 5:
        verdict = f"Smart Rebel Route: You save ~{saved_mins} mins by avoiding internal gate congestion."
    else:
        verdict = "Direct route is already quite efficient, minor micro-walk adjustments suggested."

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
        direct_duration_minutes=round(baseline_total_seconds / 60.0, 1),
        rebel_duration_minutes=round(rebel_duration_final / 60.0, 1),
        total_time_saved_minutes=saved_mins,
        pickup_arbitrage=best_pickup_cand,
        drop_arbitrage=best_drop_cand,
        choke_bypasses=choke_bypasses,
        verdict=verdict
    )

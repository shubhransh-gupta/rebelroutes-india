import json
import os
import math
from typing import List, Optional, Dict, Any
from app.services.routing import haversine_distance_meters, fetch_osrm_route
from app.schemas.routes import ChokeBypassOption, Coordinate

DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "cities.json")

def load_cities_data() -> Dict[str, Any]:
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def get_city_by_id(city_id: str) -> Optional[Dict[str, Any]]:
    data = load_cities_data()
    for city in data.get("cities", []):
        if city["id"].lower() == city_id.lower():
            return city
    return data["cities"][0] if data.get("cities") else None

async def detect_choke_point_bypasses(
    city_id: str,
    polyline_coords: List[List[float]],
    threshold_distance_meters: float = 280.0,
    choke_delay_factor: float = 1.0
) -> List[ChokeBypassOption]:
    city = get_city_by_id(city_id)
    if not city or "choke_points" not in city:
        return []

    # If traffic is completely light/off-peak, choke points are clear — no bypass needed
    if choke_delay_factor <= 0.15:
        return []

    bypasses = []
    choke_points = city["choke_points"]
    n_pts = len(polyline_coords)
    if n_pts < 10:
        return []

    for choke in choke_points:
        choke_lat = choke["coords"]["lat"]
        choke_lng = choke["coords"]["lng"]
        
        # Check closest distance along polyline
        min_dist = float("inf")
        closest_idx = -1
        for idx, pt in enumerate(polyline_coords):
            d = haversine_distance_meters(pt[0], pt[1], choke_lat, choke_lng)
            if d < min_dist:
                min_dist = d
                closest_idx = idx

        # Route must pass right through or immediately next to the choke intersection
        if min_dist <= threshold_distance_meters and closest_idx != -1:
            # Walk backwards along polyline ~160m to 200m before the junction to find the safe drop point
            exit_idx = closest_idx
            dist_back = 0.0
            for i in range(closest_idx - 1, -1, -1):
                dist_back += haversine_distance_meters(
                    polyline_coords[i][0], polyline_coords[i][1],
                    polyline_coords[i+1][0], polyline_coords[i+1][1]
                )
                exit_idx = i
                if dist_back >= 170.0:
                    break

            # Walk forward along polyline ~160m to 200m past the junction to find the clear re-hail point
            rebook_idx = closest_idx
            dist_fwd = 0.0
            for i in range(closest_idx + 1, n_pts):
                dist_fwd += haversine_distance_meters(
                    polyline_coords[i-1][0], polyline_coords[i-1][1],
                    polyline_coords[i][0], polyline_coords[i][1]
                )
                rebook_idx = i
                if dist_fwd >= 170.0:
                    break

            # If the user origin or destination is too close to the choke point (<90m), bypass is meaningless
            if dist_back < 90.0 or dist_fwd < 90.0:
                continue

            exit_pt = polyline_coords[exit_idx]
            rebook_pt = polyline_coords[rebook_idx]

            # Direct straight / footpath distance between drop and re-hail points
            direct_walk_dist = haversine_distance_meters(exit_pt[0], exit_pt[1], rebook_pt[0], rebook_pt[1])
            # Urban walking path factor
            walk_distance = direct_walk_dist * 1.15

            # Commuter safety check: Nobody walks more than 420 meters to bypass a junction
            if walk_distance > 420.0 or walk_distance < 120.0:
                continue

            # Walking pace: ~4.5 km/h = 1.25 m/s
            walk_duration = walk_distance / 1.25
            
            # Re-hailing buffer on the other side (auto hail / driver approach): ~2.5 mins
            rehail_buffer_seconds = 150.0

            # Driving crawl delay through this bottleneck stretch:
            # Crawl speed in peak traffic: ~4-7 km/h (1.1 - 1.9 m/s)
            crawl_speed_mps = max(0.9, (choke.get("avg_crawl_speed_kmh", 5.0) * 1000.0) / 3600.0) / max(0.7, choke_delay_factor)
            driving_crawl_time = (walk_distance * 1.2) / crawl_speed_mps
            # Signal queue overhead: 2-3 signal cycles in peak Indian traffic
            signal_queue_overhead = 270.0 * choke_delay_factor
            total_crawl_seconds = driving_crawl_time + signal_queue_overhead

            # Net realistic time saved by walking through the choke point
            net_time_saved = max(0.0, total_crawl_seconds - (walk_duration + rehail_buffer_seconds))

            # Only recommend if actually saving at least 2.5 minutes
            if net_time_saved >= 150.0:
                # Sub-segment geometry for map rendering
                walk_geom = polyline_coords[exit_idx:rebook_idx+1]
                bypasses.append(
                    ChokeBypassOption(
                        choke_name=choke["name"],
                        severity=choke.get("severity", "high"),
                        exit_point=Coordinate(lat=exit_pt[0], lng=exit_pt[1]),
                        rebook_point=Coordinate(lat=rebook_pt[0], lng=rebook_pt[1]),
                        walking_path=walk_geom,
                        walk_distance_meters=round(walk_distance, 0),
                        walk_duration_seconds=round(walk_duration, 0),
                        driving_crawl_duration_seconds=round(total_crawl_seconds, 0),
                        net_time_saved_seconds=round(net_time_saved, 0),
                        bypass_advice=choke.get("bypass_tip", "Walk past the choke point and hail a ride on the clear arterial road.")
                    )
                )

        # Cap at at most 1 choke bypass per commute so the route remains practical and not exhausting
        if len(bypasses) >= 1:
            break

    return bypasses

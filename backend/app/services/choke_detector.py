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
    threshold_distance_meters: float = 650.0
) -> List[ChokeBypassOption]:
    city = get_city_by_id(city_id)
    if not city or "choke_points" not in city:
        return []

    bypasses = []
    choke_points = city["choke_points"]

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

        if min_dist <= threshold_distance_meters and closest_idx != -1:
            # Route passes through this notorious choke point!
            # Sample upstream exit point and downstream rebook point
            n_pts = len(polyline_coords)
            exit_idx = max(0, closest_idx - max(2, int(n_pts * 0.12)))
            rebook_idx = min(n_pts - 1, closest_idx + max(2, int(n_pts * 0.12)))
            
            exit_pt = polyline_coords[exit_idx]
            rebook_pt = polyline_coords[rebook_idx]

            # Calculate walking shortcut
            walk_route = await fetch_osrm_route(exit_pt[0], exit_pt[1], rebook_pt[0], rebook_pt[1], mode="walking")
            walk_distance = walk_route["distance_meters"]
            walk_duration = walk_route["duration_seconds"]

            # Driving crawl delay at this choke point
            crawl_speed_mps = (choke.get("avg_crawl_speed_kmh", 3.5) * 1000) / 3600.0
            crawl_duration = (walk_distance * 1.3) / max(0.5, crawl_speed_mps) # plus intersection signal delay
            signal_overhead = 420.0 # ~7 minutes signal wait / bottle-neck crawling
            total_crawl_seconds = crawl_duration + signal_overhead

            time_saved = max(0.0, total_crawl_seconds - walk_duration)

            if time_saved > 90:  # Only recommend if saving > 1.5 mins
                bypasses.append(
                    ChokeBypassOption(
                        choke_name=choke["name"],
                        severity=choke.get("severity", "high"),
                        exit_point=Coordinate(lat=exit_pt[0], lng=exit_pt[1]),
                        rebook_point=Coordinate(lat=rebook_pt[0], lng=rebook_pt[1]),
                        walking_path=walk_route["coordinates"],
                        walk_distance_meters=round(walk_distance, 0),
                        walk_duration_seconds=round(walk_duration, 0),
                        driving_crawl_duration_seconds=round(total_crawl_seconds, 0),
                        net_time_saved_seconds=round(time_saved, 0),
                        bypass_advice=choke.get("bypass_tip", "Walk past the choke point and hail a ride on the clear arterial road.")
                    )
                )

    return bypasses

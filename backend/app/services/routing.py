import math
import httpx
from typing import List, Tuple, Dict, Any, Optional

def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371000  # radius of Earth in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def generate_interpolated_path(lat1: float, lon1: float, lat2: float, lon2: float, steps: int = 15) -> List[List[float]]:
    """Fallback road-like curved geometry when external routing service is slow."""
    coords = []
    # Add slight realistic road curvature
    mid_lat = (lat1 + lat2) / 2
    mid_lng = (lon1 + lon2) / 2
    offset = 0.0015
    for i in range(steps + 1):
        t = i / float(steps)
        # quadratic bezier with subtle displacement
        bezier_lat = (1 - t)**2 * lat1 + 2 * (1 - t) * t * (mid_lat + offset) + t**2 * lat2
        bezier_lng = (1 - t)**2 * lon1 + 2 * (1 - t) * t * (mid_lng - offset) + t**2 * lon2
        coords.append([round(bezier_lat, 6), round(bezier_lng, 6)])
    return coords

async def fetch_osrm_route(
    start_lat: float, start_lng: float,
    end_lat: float, end_lng: float,
    mode: str = "driving",
    timeout: float = 4.0
) -> Dict[str, Any]:
    """
    Fetch free routing from public OSRM.
    Mode: 'driving' or 'walking'.
    Fallback safely to realistic geometric calculation if public demo is busy.
    """
    profile = "driving" if mode == "driving" else "foot"
    url = f"https://router.project-osrm.org/route/v1/{profile}/{start_lng},{start_lat};{end_lng},{end_lat}?overview=full&geometries=geojson"
    
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            headers = {"User-Agent": "FantasticIndianTraffic-RebelRoutes/1.0"}
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("routes") and len(data["routes"]) > 0:
                    primary = data["routes"][0]
                    # GeoJSON coordinates are [lng, lat], convert to [lat, lng]
                    raw_coords = primary["geometry"]["coordinates"]
                    coords = [[c[1], c[0]] for c in raw_coords]
                    distance = primary["distance"]
                    duration = primary["duration"]
                    return {
                        "coordinates": coords,
                        "distance_meters": distance,
                        "duration_seconds": duration,
                        "source": "osrm"
                    }
    except Exception:
        pass

    # Fallback to local high-precision calculation
    dist = haversine_distance_meters(start_lat, start_lng, end_lat, end_lng) * 1.25  # Urban winding factor
    # Speed: walking ~4.8 km/h (1.33 m/s), driving ~18 km/h in Indian peak traffic (5.0 m/s)
    speed = 5.0 if mode == "driving" else 1.33
    duration = dist / speed
    coords = generate_interpolated_path(start_lat, start_lng, end_lat, end_lng)
    return {
        "coordinates": coords,
        "distance_meters": round(dist, 1),
        "duration_seconds": round(duration, 1),
        "source": "fallback_model"
    }

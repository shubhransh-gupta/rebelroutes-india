import httpx
from typing import List, Dict, Any

async def search_places(query: str, city_name: str = "", limit: int = 6) -> List[Dict[str, Any]]:
    """Free geocoding search for Indian locations using Photon OSM."""
    if not query or len(query.strip()) < 2:
        return []

    search_text = f"{query.strip()} {city_name}".strip()
    url = f"https://photon.komoot.io/api/?q={httpx.URL(search_text).raw_path.decode('utf-8').split('?q=')[-1]}&limit={limit}"
    
    try:
        async with httpx.AsyncClient(timeout=3.5) as client:
            resp = await client.get(
                "https://photon.komoot.io/api/",
                params={"q": search_text, "limit": limit, "bbox": "68.1,6.7,97.4,35.5"}, # India bounding box
                headers={"User-Agent": "FantasticIndianTraffic/1.0"}
            )
            if resp.status_code == 200:
                data = resp.json()
                results = []
                for feat in data.get("features", []):
                    props = feat.get("properties", {})
                    coords = feat.get("geometry", {}).get("coordinates", [0, 0])
                    name = props.get("name", "")
                    city = props.get("city", props.get("state", ""))
                    label = f"{name}, {city}".strip(", ")
                    if name:
                        results.append({
                            "name": name,
                            "display_name": label,
                            "lat": coords[1],
                            "lng": coords[0],
                            "type": props.get("type", "landmark")
                        })
                if results:
                    return results
    except Exception:
        pass

    return []

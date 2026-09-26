import os
import uvicorn
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List, Dict, Any

from app.schemas.routes import (
    OptimalRouteRequest, OptimalRouteResponse,
    MultiStopTodoRequest, MultiStopTodoResponse,
    EtaForecastResponse, TodoStopResult, RouteGeometry, Coordinate
)
from app.services.choke_detector import load_cities_data, get_city_by_id
from app.services.optimizer import compute_rebel_optimal_route
from app.services.forecast import compute_24h_forecast
from app.services.geocoding import search_places
from app.services.routing import fetch_osrm_route, haversine_distance_meters

app = FastAPI(
    title="RebelRoutes India (Fantastic Indian Traffic)",
    description="Multi-city AI routing lab arguing with traffic maps across Bengaluru, Delhi, Gurgaon, Noida, Pune, Mumbai, Hyderabad, Chennai, Kolkata, and Lucknow.",
    version="1.0.0"
)

# Enable CORS for frontend deployment (Vercel, Netlify, localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "status": "online",
        "project": "RebelRoutes India (FIT - Fantastic Indian Traffic)",
        "docs": "/docs",
        "supported_cities": [
            "Bengaluru", "Gurgaon", "Noida", "Delhi", "Pune",
            "Mumbai", "Hyderabad", "Chennai", "Kolkata", "Lucknow", "Ahmedabad"
        ]
    }

@app.get("/api/cities")
def get_cities():
    data = load_cities_data()
    return data.get("cities", [])

@app.get("/api/cities/{city_id}")
def get_city(city_id: str):
    city = get_city_by_id(city_id)
    if not city:
        raise HTTPException(status_code=404, detail=f"City '{city_id}' not found.")
    return city

@app.get("/api/search")
async def autocomplete(q: str = Query(..., min_length=2), city: Optional[str] = ""):
    results = await search_places(q, city_name=city or "")
    return {"query": q, "results": results}

@app.post("/api/routes/optimal", response_model=OptimalRouteResponse)
async def optimal_route(req: OptimalRouteRequest):
    try:
        response = await compute_rebel_optimal_route(req)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")

@app.post("/api/routes/forecast", response_model=EtaForecastResponse)
def forecast(baseline_duration_minutes: float = Query(..., gt=0)):
    return compute_24h_forecast(baseline_duration_minutes)

@app.post("/api/routes/errands", response_model=MultiStopTodoResponse)
async def plan_errands(req: MultiStopTodoRequest):
    # Direct route first
    direct = await fetch_osrm_route(
        req.pickup.lat, req.pickup.lng,
        req.destination.lat, req.destination.lng,
        mode="driving"
    )
    
    stops: List[TodoStopResult] = []
    p_coords = direct["coordinates"]
    
    # Generate on-the-way stop candidates along the direct polyline
    categories_dict = {
        "fuel": "IndianOil / HP Petrol Pump (On corridor)",
        "petrol": "Bharat Petroleum Fuel Station",
        "coffee": "Filter Coffee / Chai Point",
        "chai": "Tea Stall / Tapri",
        "pharmacy": "Apollo Pharmacy / MedPlus",
        "atm": "HDFC / SBI 24x7 ATM",
        "grocery": "Blinkit / Nature's Basket Outlet"
    }

    n_pts = len(p_coords)
    step_jump = max(1, n_pts // (len(req.todos) + 1))

    for idx, todo in enumerate(req.todos):
        todo_key = todo.lower().strip()
        name = categories_dict.get(todo_key, f"{todo.title()} Spot")
        pt_idx = min(n_pts - 1, (idx + 1) * step_jump)
        pt = p_coords[pt_idx]
        
        # Slight detour (80-120m off the road)
        offset_lat = pt[0] + 0.0008
        offset_lng = pt[1] + 0.0006
        detour_dist = 180.0
        detour_sec = 110.0 # ~1.8 mins detour

        stops.append(
            TodoStopResult(
                category=todo_key,
                name=name,
                location=Coordinate(lat=offset_lat, lng=offset_lng),
                detour_meters=detour_dist,
                detour_seconds=detour_sec
            )
        )

    total_detour_sec = sum(s.detour_seconds for s in stops)
    multi_dur = direct["duration_seconds"] + total_detour_sec

    return MultiStopTodoResponse(
        direct_duration_minutes=round(direct["duration_seconds"] / 60.0, 1),
        multi_stop_duration_minutes=round(multi_dur / 60.0, 1),
        stops=stops,
        combined_route=RouteGeometry(
            coordinates=p_coords,
            distance_meters=direct["distance_meters"],
            duration_seconds=multi_dur
        )
    )

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class Coordinate(BaseModel):
    lat: float
    lng: float

class LocationInput(BaseModel):
    name: Optional[str] = "Location"
    lat: float
    lng: float

class OptimalRouteRequest(BaseModel):
    pickup: LocationInput
    destination: LocationInput
    city_id: Optional[str] = "bengaluru"
    optimization_mode: str = Field(default="both", description="pickup, drop, or both")
    pickup_radius_meters: int = Field(default=500, ge=100, le=1500)
    drop_radius_meters: int = Field(default=500, ge=100, le=1500)
    travel_mode: str = Field(default="driving", description="driving or transit")
    traffic_scenario: str = Field(default="live", description="live, peak_morning, peak_evening")

class RouteGeometry(BaseModel):
    coordinates: List[List[float]] # [[lat, lng], ...]
    distance_meters: float
    duration_seconds: float

class OptimalCandidate(BaseModel):
    index: int
    label: str
    location: Coordinate
    walk_distance_meters: float
    walk_duration_seconds: float
    driving_duration_seconds: float
    total_journey_seconds: float
    time_saved_seconds: float
    reason: str

class ChokeBypassOption(BaseModel):
    choke_name: str
    severity: str
    exit_point: Coordinate
    rebook_point: Coordinate
    walking_path: List[List[float]]
    walk_distance_meters: float
    walk_duration_seconds: float
    driving_crawl_duration_seconds: float
    net_time_saved_seconds: float
    bypass_advice: str

class OptimalRouteResponse(BaseModel):
    city_id: str
    direct_route: RouteGeometry
    rebel_route: RouteGeometry
    direct_duration_minutes: float
    rebel_duration_minutes: float
    total_time_saved_minutes: float
    pickup_arbitrage: Optional[OptimalCandidate] = None
    drop_arbitrage: Optional[OptimalCandidate] = None
    choke_bypasses: List[ChokeBypassOption] = []
    verdict: str
    traffic_condition: str = "light"
    time_of_day_note: str = ""
    simple_action_steps: List[str] = []

class TodoItem(BaseModel):
    category: str
    label: Optional[str] = None

class MultiStopTodoRequest(BaseModel):
    pickup: LocationInput
    destination: LocationInput
    city_id: Optional[str] = "bengaluru"
    todos: List[str]

class TodoStopResult(BaseModel):
    category: str
    name: str
    location: Coordinate
    detour_meters: float
    detour_seconds: float

class MultiStopTodoResponse(BaseModel):
    direct_duration_minutes: float
    multi_stop_duration_minutes: float
    stops: List[TodoStopResult]
    combined_route: RouteGeometry

class ForecastBucket(BaseModel):
    time_str: str
    is_peak: bool
    estimated_duration_minutes: float
    traffic_level: str # smooth, moderate, heavy, gridlock
    advice: str

class EtaForecastResponse(BaseModel):
    baseline_duration_minutes: float
    best_time_to_leave: str
    forecast: List[ForecastBucket]

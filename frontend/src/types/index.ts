export interface Coordinate {
  lat: float;
  lng: float;
}

export type float = number;

export interface ChokePoint {
  name: string;
  coords: Coordinate;
  severity: 'extreme' | 'high' | 'moderate';
  bypass_tip: string;
  avg_crawl_speed_kmh: number;
}

export interface PopularRoute {
  title: string;
  pickup: { name: string; lat: number; lng: number };
  destination: { name: string; lat: number; lng: number };
}

export interface City {
  id: string;
  name: string;
  state: string;
  center: Coordinate;
  zoom: number;
  tagline: string;
  choke_points: ChokePoint[];
  popular_routes: PopularRoute[];
}

export interface RouteGeometry {
  coordinates: [number, number][]; // [lat, lng]
  distance_meters: number;
  duration_seconds: number;
}

export interface OptimalCandidate {
  index: number;
  label: string;
  location: Coordinate;
  walk_distance_meters: number;
  walk_duration_seconds: number;
  driving_duration_seconds: number;
  total_journey_seconds: number;
  time_saved_seconds: number;
  reason: string;
}

export interface ChokeBypassOption {
  choke_name: string;
  severity: string;
  exit_point: Coordinate;
  rebook_point: Coordinate;
  walking_path: [number, number][];
  walk_distance_meters: number;
  walk_duration_seconds: number;
  driving_crawl_duration_seconds: number;
  net_time_saved_seconds: number;
  bypass_advice: string;
}

export interface OptimalRouteResponse {
  city_id: string;
  direct_route: RouteGeometry;
  rebel_route: RouteGeometry;
  direct_duration_minutes: number;
  rebel_duration_minutes: number;
  total_time_saved_minutes: number;
  pickup_arbitrage?: OptimalCandidate;
  drop_arbitrage?: OptimalCandidate;
  choke_bypasses: ChokeBypassOption[];
  verdict: string;
  traffic_condition?: 'light' | 'moderate' | 'heavy' | 'gridlock';
  time_of_day_note?: string;
  simple_action_steps?: string[];
}

export interface ForecastBucket {
  time_str: string;
  is_peak: boolean;
  estimated_duration_minutes: number;
  traffic_level: 'smooth' | 'moderate' | 'heavy' | 'gridlock';
  advice: string;
}

export interface EtaForecastResponse {
  baseline_duration_minutes: number;
  best_time_to_leave: string;
  forecast: ForecastBucket[];
}

export interface TodoStopResult {
  category: string;
  name: string;
  location: Coordinate;
  detour_meters: number;
  detour_seconds: number;
}

export interface MultiStopTodoResponse {
  direct_duration_minutes: number;
  multi_stop_duration_minutes: number;
  stops: TodoStopResult[];
  combined_route: RouteGeometry;
}

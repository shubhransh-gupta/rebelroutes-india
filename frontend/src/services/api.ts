import {
  City,
  OptimalRouteResponse,
  EtaForecastResponse,
  MultiStopTodoResponse
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export async function fetchCities(): Promise<City[]> {
  const res = await fetch(`${API_BASE_URL}/api/cities`);
  if (!res.ok) throw new Error('Failed to load cities data');
  return res.json();
}

export async function searchLocations(query: string, city: string = '') {
  const res = await fetch(
    `${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}&city=${encodeURIComponent(city)}`
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.results || [];
}

export async function calculateOptimalRoute(params: {
  city_id: string;
  pickup: { name: string; lat: number; lng: number };
  destination: { name: string; lat: number; lng: number };
  optimization_mode: string;
  pickup_radius_meters: number;
  traffic_scenario?: string;
}): Promise<OptimalRouteResponse> {
  const res = await fetch(`${API_BASE_URL}/api/routes/optimal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to calculate optimal route');
  }
  return res.json();
}

export async function fetchForecast(baselineMinutes: number): Promise<EtaForecastResponse> {
  const res = await fetch(
    `${API_BASE_URL}/api/routes/forecast?baseline_duration_minutes=${baselineMinutes}`,
    { method: 'POST' }
  );
  if (!res.ok) throw new Error('Failed to fetch forecast');
  return res.json();
}

export async function planMultiStopErrands(params: {
  city_id: string;
  pickup: { name: string; lat: number; lng: number };
  destination: { name: string; lat: number; lng: number };
  todos: string[];
}): Promise<MultiStopTodoResponse> {
  const res = await fetch(`${API_BASE_URL}/api/routes/errands`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Failed to plan multi-stop route');
  return res.json();
}

from typing import List
from app.schemas.routes import ForecastBucket, EtaForecastResponse

def compute_24h_forecast(baseline_minutes: float) -> EtaForecastResponse:
    buckets: List[ForecastBucket] = []

    hours = [
        ("06:00 AM", 0.85, False, "smooth", "Early morning breeze, roads are clear."),
        ("07:00 AM", 0.95, False, "smooth", "Traffic begins picking up."),
        ("08:00 AM", 1.35, True, "moderate", "Commuter traffic swelling across arterial roads."),
        ("09:00 AM", 1.85, True, "gridlock", "Peak morning rush! Choke points at full crawl."),
        ("10:00 AM", 1.95, True, "gridlock", "Extreme bottleneck congestion in business tech corridors."),
        ("11:00 AM", 1.45, True, "heavy", "Morning peak subsiding slowly."),
        ("12:00 PM", 1.15, False, "moderate", "Mid-day lull, steady vehicle movement."),
        ("01:00 PM", 1.05, False, "moderate", "Good window for cross-city travel."),
        ("02:00 PM", 1.00, False, "smooth", "Fastest daytime travel window."),
        ("03:00 PM", 1.10, False, "smooth", "Traffic begins building near school zones."),
        ("04:00 PM", 1.30, False, "moderate", "Early evening traffic merging."),
        ("05:00 PM", 1.70, True, "heavy", "Evening commute commences."),
        ("06:00 PM", 2.10, True, "gridlock", "Severe evening gridlock! Flyovers and signals overwhelmed."),
        ("07:00 PM", 2.25, True, "gridlock", "Worst time to be on the road; take rebel shortcuts."),
        ("08:00 PM", 1.80, True, "heavy", "High volume, crawling at main junctions."),
        ("09:00 PM", 1.35, False, "moderate", "Traffic dispersing into residential zones."),
        ("10:00 PM", 0.95, False, "smooth", "Roads opening up."),
        ("11:00 PM", 0.80, False, "smooth", "Late night clear corridor.")
    ]

    best_bucket = min(hours, key=lambda h: h[1])
    best_time = f"{best_bucket[0]} (Est: {round(baseline_minutes * best_bucket[1])} mins)"

    for time_label, mult, is_peak, level, advice in hours:
        buckets.append(
            ForecastBucket(
                time_str=time_label,
                is_peak=is_peak,
                estimated_duration_minutes=round(baseline_minutes * mult, 1),
                traffic_level=level,
                advice=advice
            )
        )

    return EtaForecastResponse(
        baseline_duration_minutes=round(baseline_minutes, 1),
        best_time_to_leave=best_time,
        forecast=buckets
    )

from datetime import date, timedelta
from typing import List, Dict
import random
import math
from ..models import PurchaseOrder, Item
from ..schemas import ShipmentCreate

def get_next_dispatch_dates(current_date: date) -> List[date]:
    """Returns the next Tuesday and Friday."""
    dates = []
    for i in range(1, 8):
        future_date = current_date + timedelta(days=i)
        if future_date.weekday() in [1, 4]:  # 1 is Tuesday, 4 is Friday
            dates.append(future_date)
            if len(dates) == 2:
                break
    return sorted(dates)

def calculate_totals(pos: List[PurchaseOrder]) -> Dict[str, float]:
    total_weight = 0.0
    total_cbm = 0.0
    for po in pos:
        for item in po.items:
            # Fallback: If weight or cbm is 0, use a reasonable default for logistics planning
            w = item.weight_per_unit if item.weight_per_unit > 0 else 2.0  # Default 2kg
            c = item.cbm_per_unit if item.cbm_per_unit > 0 else 0.01     # Default 0.01 CBM
            
            total_weight += w * item.quantity
            total_cbm += c * item.quantity
    return {"weight": total_weight, "cbm": total_cbm}

def suggest_vehicle(weight: float) -> str:
    if weight <= 750:
        return "Tata Ace"
    elif weight <= 1500:
        return "Pickup"
    else:
        return "Truck"

def optimize_shipments(pending_pos: List[PurchaseOrder]) -> List[Dict]:
    if not pending_pos:
        return []

    # Group POs by location (State/City)
    grouped_pos = {}
    for po in pending_pos:
        loc = po.location or "Unknown Region"
        if loc not in grouped_pos:
            grouped_pos[loc] = []
        grouped_pos[loc].append(po)

    all_plans = []
    today = date.today()
    dispatch_dates = get_next_dispatch_dates(today)
    primary_date = dispatch_dates[0] if dispatch_dates else today

    for loc, pos in grouped_pos.items():
        totals = calculate_totals(pos)
        total_weight = totals["weight"]
        total_cbm = totals["cbm"]
        
        days_to_dispatch = (primary_date - today).days
        vehicle = suggest_vehicle(total_weight)
        
        recommendation = f"Optimized for {loc} logistics lane."
        if total_weight < 500 and days_to_dispatch > 1:
            recommendation = f"Low load for {loc}. Consolidating more orders to reduce freight cost per unit."
        elif total_weight > 5000:
            recommendation = f"Strategic volume for {loc}. Priority transit recommended."
        
        # Suggest route based on location
        if loc.upper() == "BIHAR":
            route = "LOCAL BIHAR → BIHAR FACTORY"
        else:
            route = f"{loc.upper()} → BIHAR FACTORY"
        
        # Calculate Distance and ETA (Assuming 600km/day)
        is_local = loc.upper() in ["BIHAR", "PATNA", "MUZAFFARPUR"]
        
        # Standardize distances to common supply hubs for consistent data
        distance_map = {
            "MUMBAI": 1850,
            "DELHI": 1050,
            "PUNE": 1780,
            "AHMEDABAD": 1500,
            "CHENNAI": 2300,
            "BANGALORE": 2100,
            "KOLKATA": 550,
            "SURAT": 1450,
        }
        
        # Determine distance
        if is_local:
            distance_km = random.randint(50, 250)
        else:
            # Try to match the location name to our map, or generate a realistic far distance
            loc_upper = loc.upper()
            found_dist = next((v for k, v in distance_map.items() if k in loc_upper), None)
            distance_km = found_dist if found_dist else random.randint(800, 2500)
            
        days_on_road = max(1, math.ceil(distance_km / 600.0))
        expected_arrival = primary_date + timedelta(days=days_on_road)
        
        plan = {
            "dispatch_date": primary_date,
            "expected_arrival_date": expected_arrival,
            "distance_km": distance_km,
            "vehicle_type": vehicle,
            "total_weight": total_weight,
            "total_cbm": total_cbm,
            "recommendation": recommendation,
            "location": loc,
            "route": route,
            "po_ids": [po.id for po in pos],
            "status": "Proposed"
        }
        all_plans.append(plan)

    return all_plans

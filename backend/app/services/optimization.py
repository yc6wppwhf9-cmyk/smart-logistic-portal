from datetime import date, timedelta
from typing import List, Dict
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

    totals = calculate_totals(pending_pos)
    total_weight = totals["weight"]
    total_cbm = totals["cbm"]

    today = date.today()
    dispatch_dates = get_next_dispatch_dates(today)
    
    # Simple logic: group all Mumbai -> Bihar together for now
    # In a real world, we might split if > Truck capacity, but here we assume 1 or more vehicles
    
    primary_date = dispatch_dates[0]
    days_to_dispatch = (primary_date - today).days
    
    vehicle = suggest_vehicle(total_weight)
    
    recommendation = "Dispatch now"
    if total_weight < 500 and days_to_dispatch > 1:
        recommendation = "Wait to consolidate more POs to optimize cost"
    elif days_to_dispatch > 2:
        recommendation = "Wait for next cycle (Tuesday/Friday)"

    # Basic grouping: all pending into one suggested shipment for this MVP
    # This can be enhanced for overflow later.
    
    suggested_shipment = {
        "dispatch_date": primary_date,
        "vehicle_type": vehicle,
        "total_weight": total_weight,
        "total_cbm": total_cbm,
        "recommendation": recommendation,
        "po_ids": [po.id for po in pending_pos],
        "status": "Proposed"
    }

    return [suggested_shipment]

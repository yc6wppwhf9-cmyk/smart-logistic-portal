from sqlalchemy.orm import Session
from .. import models
from typing import Dict

def get_supplier_performance(db: Session) -> Dict[str, Dict]:
    # Fetch all POs to aggregate performance
    pos = db.query(models.PurchaseOrder).all()
    
    stats = {} # { "Supplier Name": { "score": 0, "pos": 0, "changes": 0, "cancelled": 0 } }
    
    for po in pos:
        name = po.supplier_name
        if name not in stats:
            stats[name] = {"score": 100, "total_pos": 0, "changes": 0, "cancelled": 0}
        
        stats[name]["total_pos"] += 1
        stats[name]["changes"] += po.date_change_count
        
        # Penalize for changes and cancellations
        penalty = (po.date_change_count * 10)
        if po.status == "Cancelled":
            penalty += 50
        
        stats[name]["score"] -= penalty

    # Assign Grades
    grades = {}
    for name, data in stats.items():
        score = data["score"]
        if score >= 80:
            grade = "A"
            color = "emerald"
        elif score >= 50:
            grade = "B"
            color = "amber"
        else:
            grade = "C"
            color = "red"
        
        grades[name] = {
            "supplier_name": name,
            "grade": grade,
            "color": color,
            "score": max(0, score),
            "reliability": f"{max(0, score)}%"
        }
        
    return grades

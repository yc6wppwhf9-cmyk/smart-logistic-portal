import requests
import json

BASE_URL = "http://localhost:8000/api"

def populate():
    sample_pos = [
        {
            "po_number": "PO-1001",
            "order_date": "2026-02-18",
            "supplier_name": "Shantilal Enterprises",
            "location": "Mumbai",
            "items": [
                {
                    "item_code": "INV0016", 
                    "item_name": "Tag Pin", 
                    "hsn_code": "392330", 
                    "uom": "Pcs", 
                    "quantity": 670, 
                    "rate": 0.11,
                    "weight_per_unit": 0.5, 
                    "cbm_per_unit": 0.02
                }
            ]
        }
    ]

    for po in sample_pos:
        try:
            response = requests.post(f"{BASE_URL}/purchase-orders", json=po)
            if response.status_code == 200:
                print(f"Created {po['po_number']}")
            else:
                print(f"Failed to create {po['po_number']}: {response.text}")
        except Exception as e:
            print(f"Error connecting to server: {e}")

if __name__ == "__main__":
    populate()

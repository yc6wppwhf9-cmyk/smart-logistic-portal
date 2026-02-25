import requests
import os
from sqlalchemy.orm import Session
from .. import models
import json

class ERPNextService:
    def __init__(self):
        self.url = os.getenv("ERPNEXT_URL")
        self.api_key = os.getenv("ERPNEXT_API_KEY")
        self.api_secret = os.getenv("ERPNEXT_API_SECRET")
        self.headers = {
            "Authorization": f"token {self.api_key}:{self.api_secret}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

    def fetch_purchase_orders(self, db: Session):
        if not self.url or not self.api_key or not self.api_secret:
            return {"error": "ERPNext credentials not configured"}

        # Fetch "Approved" Purchase Orders from ERPNext
        # Filter for Status = drafted or submitted depending on your flow
        endpoint = f"{self.url}/api/resource/Purchase Order"
        params = {
            "fields": '["name", "transaction_date", "supplier", "status"]',
            "filters": '[["status", "!=", "Closed"], ["status", "!=", "Cancelled"]]',
            "limit_page_length": 50
        }

        try:
            response = requests.get(endpoint, headers=self.headers, params=params)
            response.raise_for_status()
            pos_data = response.json().get("data", [])

            synced_count = 0
            for po in pos_data:
                # Check if PO already exists in our database
                existing_po = db.query(models.PurchaseOrder).filter(models.PurchaseOrder.po_number == po['name']).first()
                if existing_po:
                    continue

                # Fetch detailed items for this PO
                items_endpoint = f"{self.url}/api/resource/Purchase Order/{po['name']}"
                item_res = requests.get(items_endpoint, headers=self.headers)
                item_res.raise_for_status()
                po_detail = item_res.json().get("data", {})

                # Create our local PO
                db_po = models.PurchaseOrder(
                    po_number=po_detail.get('name'),
                    order_date=po_detail.get('transaction_date'),
                    supplier_name=po_detail.get('supplier'),
                    location="Mumbai"  # Defaulting or extracting from address
                )
                db.add(db_po)
                db.commit()
                db.refresh(db_po)

                # Add Items
                for item in po_detail.get('items', []):
                    db_item = models.Item(
                        item_code=item.get('item_code'),
                        item_name=item.get('item_name'),
                        hsn_code=item.get('gst_hsn_code'),
                        uom=item.get('uom'),
                        quantity=item.get('qty'),
                        rate=item.get('rate'),
                        weight_per_unit=item.get('weight_per_unit', 0), # Custom field check
                        cbm_per_unit=item.get('cbm_per_unit', 0),       # Custom field check
                        po_id=db_po.id
                    )
                    db.add(db_item)
                
                db.commit()
                synced_count += 1

            return {"message": f"Successfully synced {synced_count} new Purchase Orders from ERPNext"}

        except Exception as e:
            return {"error": str(e)}

erpnext_service = ERPNextService()

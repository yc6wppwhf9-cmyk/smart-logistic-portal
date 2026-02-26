import requests
import os
from sqlalchemy.orm import Session
from .. import models
import json

class ERPNextService:
    def __init__(self):
        # Clean credentials by stripping any accidental whitespace or newlines
        self.url = (os.getenv("ERPNEXT_URL") or "").strip()
        self.api_key = (os.getenv("ERPNEXT_API_KEY") or "").strip()
        self.api_secret = (os.getenv("ERPNEXT_API_SECRET") or "").strip()
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
            response = requests.get(endpoint, headers=self.headers, params=params, timeout=10)
            response.raise_for_status()
            pos_data = response.json().get("data", [])

            synced_count = 0
            for po in pos_data:
                # Fetch detailed items for this PO
                items_endpoint = f"{self.url}/api/resource/Purchase Order/{po['name']}"
                item_res = requests.get(items_endpoint, headers=self.headers, timeout=10)
                item_res.raise_for_status()
                po_detail = item_res.json().get("data", {})

                # Check if PO already exists in our database
                db_po = db.query(models.PurchaseOrder).filter(models.PurchaseOrder.po_number == po['name']).first()
                
                if db_po:
                    # Update existing PO header
                    db_po.order_date = po_detail.get('transaction_date')
                    db_po.supplier_name = po_detail.get('supplier')
                    db_po.drop_location = po_detail.get('shipping_address_name', '').split('-')[-1].strip() or po_detail.get('ship_to_name', '').split('-')[-1].strip() or po_detail.get('custom_region') or "Bihar Factory"
                    db_po.location = po_detail.get('supplier_address_name', '').split('-')[-1].strip() or po_detail.get('supplier_address', '').split('-')[0].strip() or po_detail.get('place_of_supply', '').split('-')[-1].strip() or "Mumbai Region"
                    # Clear existing items to re-sync fresh ones
                    db.query(models.Item).filter(models.Item.po_id == db_po.id).delete()
                else:
                    db_po = models.PurchaseOrder(
                        po_number=po_detail.get('name') or po_detail.get('document_no'),
                        order_date=po_detail.get('transaction_date'),
                        supplier_name=po_detail.get('supplier'),
                        drop_location=(
                            po_detail.get('shipping_address_name', '').split('-')[-1].strip() or 
                            po_detail.get('ship_to_name', '').split('-')[-1].strip() or
                            po_detail.get('custom_region') or
                            "Bihar Factory"
                        ),
                        location=(
                            po_detail.get('supplier_address_name', '').split('-')[-1].strip() or 
                            po_detail.get('supplier_address', '').split('-')[0].strip() or
                            po_detail.get('place_of_supply', '').split('-')[-1].strip() or
                            "Mumbai Region"
                        )
                    )
                    db.add(db_po)
                
                db.flush()

                # Add Items
                for item in po_detail.get('items', []):
                    # Use Pending Qty if available (typical for Genesis), otherwise fallback to Qty
                    item_qty = item.get('pending_qty') or item.get('qty') or 0
                    
                    # Skip if nothing is pending
                    if item_qty <= 0:
                        continue

                    db_item = models.Item(
                        item_code=item.get('item_code'),
                        item_name=item.get('item_name'),
                        hsn_code=item.get('gst_hsn_code'),
                        uom=item.get('uom'),
                        quantity=item_qty,
                        rate=item.get('rate'),
                        weight_per_unit=item.get('weight_per_unit', 0),
                        cbm_per_unit=item.get('cbm_per_unit', 0),
                        po_id=db_po.id
                    )
                    db.add(db_item)
                
                db.commit()
                synced_count += 1

            return {"message": f"Successfully synced {synced_count} new Purchase Orders"}

        except Exception as e:
            return {"error": str(e)}

    def update_purchase_order_status(self, po_number: str, status: str):
        if not self.url or not self.api_key or not self.api_secret:
            return {"error": "ERPNext credentials not configured"}
            
        endpoint = f"{self.url}/api/resource/Purchase Order/{po_number}"
        
        try:
            # 1. Update the custom field using set_value (works better for submitted docs)
            set_val_endpoint = f"{self.url}/api/method/frappe.client.set_value"
            
            # The ERPNext screenshot shows the field name is prepended with 'custom_' twice
            # because the user likely named it custom_portal_supply_status in the UI
            fields_to_try = ["custom_custom_portal_supply_status", "custom_portal_supply_status"]
            
            for fieldname in fields_to_try:
                payload = {
                    "doctype": "Purchase Order",
                    "name": po_number,
                    "fieldname": fieldname,
                    "value": status
                }
                response = requests.post(set_val_endpoint, headers=self.headers, json=payload, timeout=5)
                if response.status_code == 200:
                    break  # Success, stop trying other field names
            else:
                 print(f"ERPNext Field Update Note: {response.text}")
            
            # 2. Add a Tag to the PO (Very visible in List View)
            tag_endpoint = f"{self.url}/api/method/frappe.desk.tags.add_tag"
            tag_payload = {
                "dt": "Purchase Order",
                "dn": po_number,
                "tag": f"Portal-{status.replace(' ', '-')}"
            }
            requests.post(tag_endpoint, headers=self.headers, json=tag_payload, timeout=5)

            # 3. Add a comment for the history timeline
            comment_endpoint = f"{self.url}/api/method/frappe.desk.form.utils.add_comment"
            comment_payload = {
                "reference_doctype": "Purchase Order",
                "reference_name": po_number,
                "content": f"<b>Sync Trace:</b> Supply status changed to <b>{status}</b>",
                "comment_email": "sync-service@hscvpl.com",
                "comment_by": "HSCVPL Sync"
            }
            requests.post(comment_endpoint, headers=self.headers, json=comment_payload, timeout=5)
            
            return {"message": f"Successfully updated ERPNext for {po_number}"}
        except Exception as e:
            print(f"ERPNext Sync Error: {e}")
            return {"error": str(e)}

erpnext_service = ERPNextService()

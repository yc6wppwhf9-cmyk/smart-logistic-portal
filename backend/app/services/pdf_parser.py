import pdfplumber
import re
from datetime import datetime
from typing import Dict, List, Any

def extract_po_from_pdf(file_path_or_stream) -> List[Dict[str, Any]]:
    """
    Extracts PO data from the specific High Spirit PO format.
    """
    pos = []
    with pdfplumber.open(file_path_or_stream) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if not text:
                continue

            # Extract Header Info
            po_number_match = re.search(r'Order No\.\s*:\s*([\w/]+)', text)
            order_date_match = re.search(r'Order Date\s*:\s*(\d{2}-\d{2}-\d{4})', text)
            vendor_match = re.search(r'Vendor Name\s*:\s*(.*)', text)
            
            # Simple fallback for vendor
            vendor_name = vendor_match.group(1).strip() if vendor_match else "Unknown Vendor"
            po_number = po_number_match.group(1).strip() if po_number_match else f"PO-{datetime.now().strftime('%Y%m%d%H%M')}"
            
            order_date_str = order_date_match.group(1).strip() if order_date_match else None
            order_date = None
            if order_date_str:
                try:
                    order_date = datetime.strptime(order_date_str, '%d-%m-%Y').date()
                except:
                    pass

            # Extract Table Items
            # We look for lines between "Item Barcode Item Name" and "Total"
            table = page.extract_table()
            items = []
            
            if table:
                # Based on the screenshot: Item Barcode, Item Name, HSN Code, QTY, UOM, Rate, Basic Amount
                # Sometimes extract_table works well, sometimes it needs row filtering
                header_found = False
                for row in table:
                    # Clean the row
                    row = [str(cell).strip() if cell else "" for cell in row]
                    
                    if "Item Barcode" in row or "HSN Code" in row:
                        header_found = True
                        continue
                    
                    if header_found and any(row):
                        # Filter out empty or "Total" rows
                        if "Total" in row[0] or not row[0]:
                            if not any(row[1:]): continue # skip empty
                            if "Total" in str(row): break
                            
                        # Try to map columns:
                        # Row: [Barcode, Name, HSN, Qty, UOM, Rate, Amount]
                        try:
                            item = {
                                "item_code": row[0] if len(row) > 0 else "N/A",
                                "item_name": row[1] if len(row) > 1 else "N/A",
                                "hsn_code": row[2] if len(row) > 2 else "N/A",
                                "quantity": int(float(row[3].replace(',', ''))) if len(row) > 3 and row[3] else 0,
                                "uom": row[4] if len(row) > 4 else "Pcs",
                                "rate": float(row[5].replace(',', '')) if len(row) > 5 and row[5] else 0.0,
                                "weight_per_unit": 0.0, # PDF doesn't usually have these
                                "cbm_per_unit": 0.0
                            }
                            if item["item_name"] != "N/A" and item["quantity"] > 0:
                                items.append(item)
                        except:
                            continue

            # Fallback if table extraction fails (Regex based line parsing)
            if not items:
                # Item lines usually have a pattern: [ID] [Name] [HSN] [Qty] [UOM] [Rate] [Total]
                # Regex for a line like: "INV0016 Tag Pin 392330 670000 Pcs 0.110 73700.00"
                item_lines = re.findall(r'(\w+)\s+(.*?)\s+(\d{4,})\s+(\d+)\s+(\w+)\s+([\d.]+)\s+[\d.]+', text)
                for match in item_lines:
                    items.append({
                        "item_code": match[0],
                        "item_name": match[1],
                        "hsn_code": match[2],
                        "quantity": int(match[3]),
                        "uom": match[4],
                        "rate": float(match[5]),
                        "weight_per_unit": 0.0,
                        "cbm_per_unit": 0.0
                    })

            pos.append({
                "po_number": po_number,
                "order_date": order_date,
                "supplier_name": vendor_name,
                "location": "Mumbai", # Based on your requirement
                "items": items
            })
            
    return pos

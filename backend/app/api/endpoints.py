from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import pandas as pd
import io
import json
from ..database import get_db
from .. import models, schemas
from ..services.optimization import optimize_shipments
from ..services.pdf_parser import extract_po_from_pdf
from ..services.erpnext import erpnext_service
from ..services.performance import get_supplier_performance

router = APIRouter()

@router.get("/suppliers/performance")
def read_performance(db: Session = Depends(get_db)):
    return get_supplier_performance(db)

@router.post("/erpnext/sync")
def sync_erpnext(db: Session = Depends(get_db)):
    return erpnext_service.fetch_purchase_orders(db)

@router.get("/purchase-orders", response_model=List[schemas.PurchaseOrder])
def read_pos(db: Session = Depends(get_db)):
    return db.query(models.PurchaseOrder).all()

@router.delete("/purchase-orders")
def delete_all_pos(db: Session = Depends(get_db)):
    db.query(models.Item).delete()
    db.query(models.PurchaseOrder).delete()
    db.commit()
    return {"message": "All Purchase Orders and items deleted successfully"}

@router.patch("/purchase-orders/{po_id}/delivery-date")
def update_delivery_date(po_id: int, payload: dict, db: Session = Depends(get_db)):
    new_date = payload.get("expected_delivery_date")
    db_po = db.query(models.PurchaseOrder).filter(models.PurchaseOrder.id == po_id).first()
    
    if not db_po:
        raise HTTPException(status_code=404, detail="PO not found")
    
    # Check change count (Limit is 3)
    if db_po.date_change_count >= 3:
        db_po.status = "Cancelled"
        db_po.date_change_count += 1
        db.commit()
        return {"message": "Change limit exceeded. PO has been automatically CANCELLED.", "status": "Cancelled"}
    
    db_po.expected_delivery_date = new_date
    db_po.date_change_count += 1
    db.commit()
    return {"message": f"Date updated. Change count: {db_po.date_change_count}/3", "new_count": db_po.date_change_count}

@router.post("/purchase-orders", response_model=schemas.PurchaseOrder)
def create_po(po: schemas.PurchaseOrderCreate, db: Session = Depends(get_db)):
    db_po = models.PurchaseOrder(
        po_number=po.po_number,
        order_date=po.order_date,
        supplier_name=po.supplier_name,
        location=po.location
    )
    db.add(db_po)
    db.commit()
    db.refresh(db_po)
    
    for item in po.items:
        db_item = models.Item(
            item_code=item.item_code,
            item_name=item.item_name,
            hsn_code=item.hsn_code,
            uom=item.uom,
            quantity=item.quantity,
            rate=float(item.rate or 0),
            weight_per_unit=float(item.weight_per_unit or 0),
            cbm_per_unit=float(item.cbm_per_unit or 0),
            po_id=db_po.id
        )
        db.add(db_item)
    
    db.commit()
    db.refresh(db_po)
    return db_po

@router.post("/purchase-orders/upload")
async def upload_purchase_orders(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        content = await file.read()
        if file.filename.endswith('.json'):
            data = json.loads(content)
        elif file.filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(io.BytesIO(content))
            data = df.to_dict(orient='records')
        elif file.filename.endswith('.pdf'):
            data = extract_po_from_pdf(io.BytesIO(content))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")

        if not isinstance(data, list):
            data = [data]

        created_pos = {} # Map PO Number to PO object to handle flat files
        
        for po_item_data in data:
            # Smart mapping for Genesis ERP headers
            po_no = (po_item_data.get('po_number') or 
                     po_item_data.get('Document No.') or 
                     po_item_data.get('Document No') or
                     po_item_data.get('name'))
            
            if not po_no:
                continue

            if po_no not in created_pos:
                # Check if PO already exists in DB
                db_po = db.query(models.PurchaseOrder).filter(models.PurchaseOrder.po_number == str(po_no)).first()
                if not db_po:
                    db_po = models.PurchaseOrder(
                        po_number=str(po_no),
                        order_date=po_item_data.get('order_date') or po_item_data.get('Date') or po_item_data.get('transaction_date'),
                        supplier_name=po_item_data.get('supplier_name') or po_item_data.get('Supplier') or po_item_data.get('supplier'),
                        location=po_item_data.get('location') or po_item_data.get('Ship To Name') or po_item_data.get('Location') or "Bihar"
                    )
                    db.add(db_po)
                    db.commit()
                    db.refresh(db_po)
                created_pos[po_no] = db_po

            db_po = created_pos[po_no]

            # Add Item (handling both nested "items" list or flat rows)
            items_to_process = po_item_data.get('items', [po_item_data])
            if not isinstance(items_to_process, list):
                items_to_process = [items_to_process]

            for item_data in items_to_process:
                # Skip if it's the main PO row but doesn't have item info
                item_code = item_data.get('item_code') or item_data.get('Item Code')
                if not item_code:
                    continue

                db_item = models.Item(
                    item_code=str(item_code),
                    item_name=item_data.get('item_name') or item_data.get('Item Name'),
                    hsn_code=item_data.get('hsn_code') or item_data.get('HSN/SAC') or item_data.get('gst_hsn_code'),
                    uom=item_data.get('uom') or item_data.get('UOM'),
                    quantity=int(item_data.get('pending_qty') or item_data.get('Pending Qty') or item_data.get('quantity') or item_data.get('qty') or 0),
                    rate=float(item_data.get('rate') or item_data.get('Rate') or 0),
                    weight_per_unit=float(item_data.get('weight_per_unit') or item_data.get('Weight/Unit') or 0),
                    cbm_per_unit=float(item_data.get('cbm_per_unit') or item_data.get('CBM/Unit') or 0),
                    po_id=db_po.id
                )
                db.add(db_item)
        
        db.commit()
        return {"message": f"Successfully processed Excel data for {len(created_pos)} Purchase Orders"}
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/optimize", response_model=List[schemas.ShipmentBase])
def get_optimization(db: Session = Depends(get_db)):
    pending_pos = db.query(models.PurchaseOrder).filter(models.PurchaseOrder.status == "Pending").all()
    if not pending_pos:
        return []
    
    plans = optimize_shipments(pending_pos)
    return plans

@router.get("/shipments", response_model=List[schemas.Shipment])
def read_shipments(db: Session = Depends(get_db)):
    return db.query(models.Shipment).all()

@router.post("/shipments", response_model=schemas.Shipment)
def create_shipment(shipment: schemas.ShipmentCreate, db: Session = Depends(get_db)):
    db_shipment = models.Shipment(
        dispatch_date=shipment.dispatch_date,
        vehicle_type=shipment.vehicle_type,
        total_weight=shipment.total_weight,
        total_cbm=shipment.total_cbm,
        recommendation=shipment.recommendation,
        status=shipment.status
    )
    db.add(db_shipment)
    db.commit()
    db.refresh(db_shipment)
    
    # Update PO status to Consolidated
    for po_id in shipment.po_ids:
        po = db.query(models.PurchaseOrder).filter(models.PurchaseOrder.id == po_id).first()
        if po:
            po.status = "Consolidated"
            # Add to association table
            db_shipment.purchase_orders.append(po)
            
    db.commit()
    db.refresh(db_shipment)
    return db_shipment

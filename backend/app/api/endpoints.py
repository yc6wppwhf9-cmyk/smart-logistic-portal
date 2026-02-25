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

router = APIRouter()

@router.get("/purchase-orders", response_model=List[schemas.PurchaseOrder])
def read_pos(db: Session = Depends(get_db)):
    return db.query(models.PurchaseOrder).all()

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

        created_pos = []
        for po_data in data:
            db_po = models.PurchaseOrder(
                po_number=po_data.get('po_number'),
                order_date=po_data.get('order_date'),
                supplier_name=po_data.get('supplier_name'),
                location=po_data.get('location', 'Mumbai')
            )
            db.add(db_po)
            db.commit()
            db.refresh(db_po)

            items_data = po_data.get('items', [])
            for item_data in items_data:
                db_item = models.Item(
                    item_code=item_data.get('item_code'),
                    item_name=item_data.get('item_name'),
                    hsn_code=item_data.get('hsn_code'),
                    uom=item_data.get('uom'),
                    quantity=int(item_data.get('quantity', 0)),
                    rate=float(item_data.get('rate', 0)),
                    weight_per_unit=float(item_data.get('weight_per_unit', 0)),
                    cbm_per_unit=float(item_data.get('cbm_per_unit', 0)),
                    po_id=db_po.id
                )
                db.add(db_item)
            
            db.commit()
            db.refresh(db_po)
            created_pos.append(db_po)

        return {"message": f"Successfully uploaded {len(created_pos)} POs"}
    except Exception as e:
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

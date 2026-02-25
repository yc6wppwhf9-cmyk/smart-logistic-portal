from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date

class ItemBase(BaseModel):
    item_code: Optional[str] = None
    item_name: Optional[str] = None
    hsn_code: Optional[str] = None
    uom: Optional[str] = None
    quantity: int
    rate: Optional[float] = 0.0
    weight_per_unit: Optional[float] = 0.0
    cbm_per_unit: Optional[float] = 0.0

class ItemCreate(ItemBase):
    pass

class Item(ItemBase):
    id: int
    po_id: int

    class Config:
        from_attributes = True

class PurchaseOrderBase(BaseModel):
    po_number: Optional[str] = "Unknown"
    order_date: Optional[date] = None
    supplier_name: Optional[str] = "Unknown"
    location: Optional[str] = "Unknown"

class PurchaseOrderCreate(PurchaseOrderBase):
    items: List[ItemCreate]

class PurchaseOrder(PurchaseOrderBase):
    id: int
    status: str
    created_at: datetime
    items: List[Item]

    class Config:
        from_attributes = True

class ShipmentBase(BaseModel):
    dispatch_date: date
    vehicle_type: str
    total_weight: float
    total_cbm: float
    recommendation: str
    status: str

class ShipmentCreate(ShipmentBase):
    po_ids: List[int]

class Shipment(ShipmentBase):
    id: int
    purchase_orders: List[PurchaseOrder]
    created_at: datetime

    class Config:
        from_attributes = True

class OptimizationResult(BaseModel):
    suggested_groupings: List[ShipmentCreate]
    total_pending_weight: float
    total_pending_cbm: float

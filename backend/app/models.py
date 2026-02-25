from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Table, Date
from sqlalchemy.orm import relationship
from .database import Base
import datetime

# Association table for Many-to-Many relationship between Shipments and POs
shipment_po_association = Table(
    'shipment_po_association',
    Base.metadata,
    Column('shipment_id', Integer, ForeignKey('shipments.id')),
    Column('po_id', Integer, ForeignKey('purchase_orders.id'))
)

class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    item_code = Column(String(100))
    item_name = Column(String(255))
    hsn_code = Column(String(50))
    uom = Column(String(50))
    quantity = Column(Integer)
    rate = Column(Float)
    weight_per_unit = Column(Float, default=0.0)  # Single unit weight
    cbm_per_unit = Column(Float, default=0.0)    # Single unit CBM
    po_id = Column(Integer, ForeignKey("purchase_orders.id"))

    purchase_order = relationship("PurchaseOrder", back_populates="items")

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(Integer, primary_key=True, index=True)
    po_number = Column(String(100), unique=True, index=True)
    order_date = Column(Date)
    supplier_name = Column(String(255))
    location = Column(String(100))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String(50), default="Pending") # Pending, Consolidated, Shipped
    
    items = relationship("Item", back_populates="purchase_order", cascade="all, delete-orphan")
    shipments = relationship("Shipment", secondary=shipment_po_association, back_populates="purchase_orders")

class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, index=True)
    dispatch_date = Column(Date)
    vehicle_type = Column(String(100))
    total_weight = Column(Float)
    total_cbm = Column(Float)
    recommendation = Column(String(255))
    status = Column(String(50), default="Proposed") # Proposed, Dispatched
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    purchase_orders = relationship("PurchaseOrder", secondary=shipment_po_association, back_populates="shipments")

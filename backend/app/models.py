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
    item_group = Column(String(100), nullable=True)
    hsn_code = Column(String(50))
    uom = Column(String(50))
    quantity = Column(Integer)
    rate = Column(Float)
    weight_per_unit = Column(Float, default=0.0)  # Single unit weight
    cbm_per_unit = Column(Float, default=0.0)    # Single unit CBM
    po_id = Column(Integer, ForeignKey("purchase_orders.id"))

    purchase_order = relationship("PurchaseOrder", back_populates="items")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    role = Column(String(20)) # 'admin' or 'supplier'
    supplier_name = Column(String(255), nullable=True) # If role is 'supplier'

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(Integer, primary_key=True, index=True)
    po_number = Column(String(100), unique=True, index=True)
    order_date = Column(Date)
    expected_delivery_date = Column(Date, nullable=True)
    date_change_count = Column(Integer, default=0)
    supplier_name = Column(String(255))
    supplier_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    location = Column(String(100))
    drop_location = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String(50), default="Open") # Open, Confirmed, In Production, Completed, Dispatch, Cancelled
    
    items = relationship("Item", back_populates="purchase_order", cascade="all, delete-orphan")
    shipments = relationship("Shipment", secondary=shipment_po_association, back_populates="purchase_orders")

class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, index=True)
    dispatch_date = Column(Date)
    vehicle_type = Column(String(100))
    total_weight = Column(Float)
    total_cbm = Column(Float)
    location = Column(String(100), nullable=True)
    drop_location = Column(String(100), nullable=True)
    route = Column(String(255), nullable=True)
    recommendation = Column(String(500), nullable=True)
    status = Column(String(50), default="Proposed") # Proposed, Dispatched
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    purchase_orders = relationship("PurchaseOrder", secondary=shipment_po_association, back_populates="shipments")

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

# Adapt to the actual path
DB_PATH = r"c:\Users\himanshu.thakur\Downloads\Smart Logistic\backend\logistics.db"
engine = create_engine(f"sqlite:///{DB_PATH}")
Session = sessionmaker(bind=engine)
session = Session()

from sqlalchemy import text
results = session.execute(text("SELECT po_number, location, supplier_name FROM purchase_orders")).fetchall()

for row in results:
    print(f"PO: {row[0]} | Location: {row[1]} | Supplier: {row[2]}")

session.close()

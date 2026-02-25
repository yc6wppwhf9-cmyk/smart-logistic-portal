from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .api.endpoints import router
from . import models
from .services.erpnext import erpnext_service
from .database import SessionLocal
from apscheduler.schedulers.background import BackgroundScheduler

# Create tables
Base.metadata.create_all(bind=engine)

def fix_database_schema():
    from sqlalchemy import text
    with engine.connect() as conn:
        # Add missing columns to purchase_orders if they don't exist
        for col_def in [
            "expected_delivery_date DATE",
            "date_change_count INTEGER DEFAULT 0",
            "supplier_user_id INTEGER"
        ]:
            col_name = col_def.split()[0]
            try:
                # Use sub-query to check column existence for general compatibility
                conn.execute(text(f"ALTER TABLE purchase_orders ADD COLUMN {col_def}"))
                conn.commit()
                print(f"Added missing column: {col_name}")
            except Exception:
                # Column likely already exists
                pass
        
        # Add missing columns to shipments if they don't exist
        for col_def in [
            "location VARCHAR(100)",
            "route VARCHAR(255)",
            "recommendation TEXT"
        ]:
            col_name = col_def.split()[0]
            try:
                conn.execute(text(f"ALTER TABLE shipments ADD COLUMN {col_def}"))
                conn.commit()
                print(f"Verified column in shipments: {col_name}")
            except Exception:
                pass

# Run schema fixing
fix_database_schema()

def auto_sync_job():
    db = SessionLocal()
    try:
        print("Starting Background Auto-Sync...")
        erpnext_service.fetch_purchase_orders(db)
        print("Background Auto-Sync Completed.")
    except Exception as e:
        print(f"Background Sync Error: {e}")
    finally:
        db.close()

# Start background scheduler
scheduler = BackgroundScheduler()
scheduler.add_job(auto_sync_job, 'interval', minutes=10)
scheduler.start()

app = FastAPI(title="Logistics AI Portal API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to Logistics AI Portal API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

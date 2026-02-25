from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Database Configuration
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # SQL Alchemy requires mysql+pymysql for MySQL URLs
    if DATABASE_URL.startswith("mysql://"):
        DATABASE_URL = DATABASE_URL.replace("mysql://", "mysql+pymysql://", 1)
    SQLALCHEMY_DATABASE_URL = DATABASE_URL
    # Added pool_pre_ping and pool_recycle to handle cloud database connection timeouts
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, 
        pool_pre_ping=True, 
        pool_recycle=300,
        pool_size=10,
        max_overflow=20
    )
elif os.getenv("DB_TYPE") == "mysql":
    USER = os.getenv("MYSQL_USER", "root")
    PASSWORD = os.getenv("MYSQL_PASSWORD", "")
    HOST = os.getenv("MYSQL_HOST", "localhost")
    PORT = os.getenv("MYSQL_PORT", "3306")
    DB_NAME = os.getenv("MYSQL_DB", "logistics_db")
    
    SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{USER}:{PASSWORD}@{HOST}:{PORT}/{DB_NAME}"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, 
        pool_pre_ping=True, 
        pool_recycle=300,
        pool_size=10,
        max_overflow=20
    )
else:
    SQLALCHEMY_DATABASE_URL = "sqlite:///./logistics.db"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, 
        connect_args={"check_same_thread": False},
        pool_pre_ping=True
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

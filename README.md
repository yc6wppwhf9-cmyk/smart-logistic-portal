# Logistics AI Portal

A production-ready AI-powered logistics optimization system for consolidating purchase orders from Mumbai to Bihar.

## 🚀 Features
- **Intelligent Consolidation**: Automatically groups pending POs into optimized shipments.
- **Smart Vehicle Selection**: Recommended vehicles based on total load (Tata Ace, Pickup, Truck).
- **Dispatch Scheduling**: Optimized scheduling for Tuesdays and Fridays.
- **AI Recommendations**: Suggestions on whether to "Dispatch Now" or "Wait for more POs" to save costs.
- **Clean UI**: Modern glassmorphism dashboard with real-time feedback.

---

## 🛠️ Tech Stack
- **Backend**: FastAPI (Python), SQLite, SQLAlchemy
- **Frontend**: React, Vite, Lucide Icons
- **Design**: Premium Vanilla CSS (Glassmorphism)

---

## 🏗️ Getting Started

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
python -m app.main
```
The API will be available at `http://localhost:8000`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The dashboard will be available at `http://localhost:5173`.

### 3. Populate Sample Data
While the backend is running:
```bash
cd backend
python populate_data.py
```

---

## 📂 Project Structure
- `backend/app/`: Core FastAPI application
  - `models.py`: Database schema
  - `schemas.py`: Pydantic validation
  - `services/optimization.py`: Core AI logic
  - `api/endpoints.py`: REST API routes
- `frontend/src/`: React dashboard
  - `App.jsx`: Main UI logic
  - `index.css`: Premium design system

---

## 🚀 Deployment Guide

### 1. Backend (Render)
1. Create a new **Web Service** on Render.
2. Connect your GitHub repository.
3. Set **Root Directory** to `backend`.
4. Environment: `Python 3`.
5. Build Command: `pip install -r requirements.txt`
6. Start Command: `gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:$PORT`
7. Add Environment Variables:
   - `DATABASE_URL`: (Your PostgreSQL URL)

### 2. Frontend (Vercel)
1. Create a new project in Vercel.
2. Connect your GitHub repository.
3. Set **Root Directory** to `frontend`.
4. Framework Preset: **Vite**.
5. Add Environment Variables:
   - `VITE_API_URL`: (The URL of your Render backend, e.g., `https://my-backend.onrender.com`)
6. Deploy!

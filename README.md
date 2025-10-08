# 🩺 Leucocytes Tracking App

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react)![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-009688?logo=fastapi)![Python](https://img.shields.io/badge/Python-3.9+-3776AB?logo=python)![License](https://img.shields.io/badge/license-MIT-green.svg)

Web application to track and visualize white blood cell counts over 25 years (1997-2022).

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 16+
- pnpm

### Installation

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
pnpm install
```

### Configuration

Create `backend/.env`:
```env
APP_NAME="API Suivi des Leucocytes"
APP_VERSION="1.0.0"
DEBUG=True
DATABASE_URL="leucocytes.db"
CORS_ORIGINS=["http://localhost:3000", "http://localhost:5173"]
API_PREFIX="/api"
```

### Run

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8081
```

**Terminal 2 - Frontend:**
```bash
cd frontend
pnpm dev --host
```

### Access

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8081/docs
- **Network:** http://YOUR_LOCAL_IP:3000

## 🛠️ Tech Stack

**Backend:**
- FastAPI (Python)
- SQLite
- Pydantic

**Frontend:**
- React 18
- Vite
- Recharts
- Tailwind CSS

## 📁 Project Structure

```
leucocytes-project/
├── backend/
│   ├── app/
│   │   ├── database/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── main.py
│   ├── requirements.txt
│   └── .env
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   └── main.jsx
    ├── package.json
    └── vite.config.js
```

## 📊 Features

- 📈 3 interactive chart views
- ➕ Add measurements (year, leukocytes, neutrophils, eosinophils, lymphocytes)
- 🗑️ Delete measurements
- 🔄 Real-time data updates
- 📱 Responsive design
- 🌐 Network accessible

## 🧪 API Endpoints

```
GET    /api/mesures           # List all measurements
POST   /api/mesures           # Create measurement
GET    /api/mesures/{year}    # Get by year
PUT    /api/mesures/{year}    # Update measurement
DELETE /api/mesures/{year}    # Delete measurement
GET    /api/mesures/stats/summary  # Statistics
```

## 📝 License

MIT
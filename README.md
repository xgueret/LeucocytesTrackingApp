# 🩺 Leucocytes Tracking App

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react)![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript)![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express)

Application web pour suivre et visualiser l'évolution des leucocytes et de la formule leucocytaire avec un suivi mensuel.





## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose (recommended)
- OR: Node.js 18+ with npm/pnpm (for local development)

### Option 1: Docker (Recommended)

**Run the entire stack:**
```bash
docker compose up -d
```

**Rebuild after changes:**
```bash
docker compose down
docker compose build
docker compose up -d
```

**View logs:**
```bash
docker compose logs -f
```

**Stop the stack:**
```bash
docker compose down
```

### Option 2: Local Development

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
pnpm install
```

**Configuration** - Create `backend/.env`:
```env
PORT=8081
DATABASE_URL="leucocytes.db"
CORS_ORIGINS="http://localhost:3000,http://localhost:5173"
NODE_ENV=development
```

**Run Backend (Terminal 1):**
```bash
cd backend
npm run dev
```

**Run Frontend (Terminal 2):**
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
- Node.js 18+ with TypeScript
- Express.js
- SQLite (better-sqlite3)
- Zod (validation)
- Swagger UI

**Frontend:**
- React 18
- Vite
- Recharts
- Tailwind CSS
- jsPDF & html2canvas (export PDF)

**Infrastructure:**
- Docker & Docker Compose
- Nginx (production frontend serving)

## 📁 Project Structure

```
leucocytes-project/
├── backend/
│   ├── src/
│   │   ├── database/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── index.ts
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── .env (local dev only)
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── vite.config.js
├── python-backup/ (archived Python code)
└── docker-compose.yml
```

## 📊 Features

- 📈 3 vues graphiques interactives (globules blancs, courbes, empilée)
- ➕ Saisie mensuelle des mesures (toutes les valeurs en /mm³)
- 🗑️ Suppression de mesures
- 📥 Export multi-format (CSV, Excel, PDF)
- 🔄 Mise à jour en temps réel
- 📱 Design responsive
- 🌐 Accessible en réseau local

## 🧪 API Endpoints

```
GET    /api/mesures              # Liste toutes les mesures (filtres: ?annee=2024&mois=1)
POST   /api/mesures              # Créer une mesure
GET    /api/mesures/{id}         # Récupérer par ID
PUT    /api/mesures/{id}         # Mettre à jour une mesure
DELETE /api/mesures/{id}         # Supprimer une mesure
GET    /api/mesures/stats/summary # Statistiques
```

Documentation Swagger disponible sur `/docs`



## 🤖 Développement assisté

Ce projet a été développé avec l'assistance de [Claude Code](https://claude.com/claude-code), l'assistant IA d'Anthropic pour le développement logiciel.

## 📝 License


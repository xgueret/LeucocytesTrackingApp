# 🩺 Suivi des Leucocytes - Application Full Stack

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react)![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-009688?logo=fastapi)![Python](https://img.shields.io/badge/Python-3.9+-3776AB?logo=python)![License](https://img.shields.io/badge/license-MIT-green.svg)

**Application web moderne pour le suivi et la visualisation des données de leucocytes sur 25 ans (1997-2022)**



[TOC]





## 🎯 À propos du projet

### Description

Cette application permet aux professionnels de santé de **suivre l'évolution des leucocytes et de la formule leucocytaire** d'un patient sur une période de 25 ans. Elle offre :

* 📊 **Visualisation interactive** : 3 types de graphiques pour analyser les tendances
* 💾 **Stockage persistant** : Base de données SQLite avec historique complet
* 🔄 **API REST** : Backend Python moderne et performant
* 🎨 **Interface intuitive** : Frontend React responsive et ergonomique
* 📈 **Analyse des données** : Statistiques automatiques et zones de référence médicales

### Contexte médical

Les leucocytes (globules blancs) sont essentiels au système immunitaire. Le suivi de leur évolution permet de :

* Détecter des anomalies précocement
* Suivre l'efficacité des traitements
* Identifier des tendances sur le long terme
* Comparer avec les valeurs normales (4000-11000 /mm³)

### Types de cellules suivies

| Type                        | Valeur normale   | Rôle                                 |
| --------------------------- | ---------------- | ------------------------------------- |
| **Leucocytes totaux** | 4000-11000 /mm³ | Défense immunitaire globale          |
| **Neutrophiles**      | 1500-7500 /mm³  | Lutte contre infections bactériennes |
| **Éosinophiles**     | 0-500 /mm³      | Réactions allergiques et parasites   |
| **Lymphocytes**       | 1000-4000 /mm³  | Immunité adaptative                  |

---

## ✨ Fonctionnalités

### 🎨 Frontend (Interface utilisateur)

* ✅ **3 vues de graphiques interactifs** :
  * 🔵 **Vue Globules Blancs** : Focus sur les leucocytes totaux avec zones de référence colorées
  * 📈 **Vue Courbes** : Comparaison de tous les types cellulaires sur un même graphique
  * 📊 **Vue Empilée** : Visualisation de la composition des leucocytes
* ✅ **Gestion des données** :
  * Ajout de nouvelles mesures via formulaire
  * Suppression de mesures existantes
  * Actualisation en temps réel
  * Validation automatique des données
* ✅ **Expérience utilisateur** :
  * Interface responsive (mobile, tablette, desktop)
  * Animations fluides et transitions
  * Tooltips détaillés au survol
  * Messages de confirmation/erreur clairs
  * Gestion des états de chargement

### ⚡ Backend (API)

* ✅ **API REST complète** :
  * CRUD complet (Create, Read, Update, Delete)
  * Endpoints RESTful standards
  * Validation automatique des données (Pydantic)
  * Gestion d'erreurs robuste
* ✅ **Base de données** :
  * SQLite intégré (pas de serveur DB requis)
  * Création automatique de la base
  * Transactions sécurisées
  * Migrations automatiques
* ✅ **Architecture professionnelle** :
  * Séparation en couches (Routes/Services/Database)
  * Configuration via variables d'environnement
  * Documentation auto-générée (Swagger UI)
  * CORS configuré pour le développement
* ✅ **Statistiques** :
  * Calcul automatique de moyennes
  * Détection de valeurs min/max
  * Comptage total des mesures
  * Période de suivi

---

## 🛠️ Technologies utilisées

### Frontend

| Technologie            | Version | Utilisation              |
| ---------------------- | ------- | ------------------------ |
| **React**        | 18.2.0  | Framework UI             |
| **Vite**         | 5.0.8   | Build tool moderne       |
| **Recharts**     | 2.10.3  | Graphiques interactifs   |
| **Tailwind CSS** | 3.3.6   | Framework CSS utilitaire |
| **Lucide React** | 0.294.0 | Icônes modernes         |

### Backend

| Technologie        | Version | Utilisation             |
| ------------------ | ------- | ----------------------- |
| **Python**   | 3.9+    | Langage backend         |
| **FastAPI**  | 0.104.1 | Framework web moderne   |
| **Uvicorn**  | 0.24.0  | Serveur ASGI            |
| **Pydantic** | 2.5.0   | Validation des données |
| **SQLite**   | 3       | Base de données        |

### DevOps & Outils

* **Git** : Contrôle de version
* **npm** : Gestionnaire de paquets JS
* **pip** : Gestionnaire de paquets Python
* **VSCode** : Éditeur recommandé

---

## 🏗️ Architecture

### Architecture globale

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                  │
│                                                       │
│  ┌─────────────────────────────────────────────┐   │
│  │         React Application (Port 3000)        │   │
│  │  • Components  • State  • Recharts           │   │
│  └─────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────┘
                        │ HTTP/REST
                        │ (fetch API)
                        ▼
┌─────────────────────────────────────────────────────┐
│              FastAPI Server (Port 8000)              │
│                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │   Routes     │→│   Services   │→│  Database │ │
│  │ (endpoints)  │  │  (business)  │  │  (SQLite) │ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
                 ┌──────────────┐
                 │ leucocytes.db│
                 │   (SQLite)   │
                 └──────────────┘
```

### Architecture Backend (Couches)

```
┌────────────────────────────────────────┐
│           Routes Layer                  │
│  • Endpoints HTTP                       │
│  • Validation requêtes                  │
│  • Gestion réponses                     │
└───────────────┬────────────────────────┘
                │
                ▼
┌────────────────────────────────────────┐
│          Services Layer                 │
│  • Logique métier                       │
│  • Règles business                      │
│  • Transformations données              │
└───────────────┬────────────────────────┘
                │
                ▼
┌────────────────────────────────────────┐
│         Database Layer                  │
│  • Requêtes SQL                         │
│  • Gestion connexions                   │
│  • Transactions                         │
└───────────────┬────────────────────────┘
                │
                ▼
           [SQLite DB]
```

### Flux de données

**Ajout d'une mesure :**

```
1. User remplit formulaire → React State
2. Click "Ajouter" → fetch POST /api/mesures
3. Routes valident données → Pydantic
4. Services appliquent logique → Conversion K/mm³
5. Database insère en base → SQLite
6. Réponse retourne → JSON
7. Frontend met à jour → Re-render graphiques
```

---

## 📁 Structure du projet

### Arborescence complète

```
leucocytes-project/
│
├── 📂 backend/                          # Backend Python FastAPI
│   ├── 📂 app/
│   │   ├── 📄 __init__.py              # Package principal
│   │   ├── 📄 main.py                  # Point d'entrée FastAPI ⭐
│   │   ├── 📄 config.py                # Configuration app & env
│   │   │
│   │   ├── 📂 database/                # Couche d'accès aux données
│   │   │   ├── 📄 __init__.py
│   │   │   └── 📄 database.py          # Gestion SQLite + requêtes
│   │   │
│   │   ├── 📂 models/                  # Modèles Pydantic
│   │   │   ├── 📄 __init__.py
│   │   │   └── 📄 mesure.py            # Schémas de validation
│   │   │
│   │   ├── 📂 routes/                  # Endpoints API
│   │   │   ├── 📄 __init__.py
│   │   │   └── 📄 mesures.py           # Routes /api/mesures/*
│   │   │
│   │   └── 📂 services/                # Logique métier
│   │       ├── 📄 __init__.py
│   │       └── 📄 mesure_service.py    # Business logic
│   │
│   ├── 📄 requirements.txt             # Dépendances Python
│   ├── 📄 .env                         # Variables d'environnement
│   ├── 📄 .gitignore                   # Fichiers à ignorer
│   └── 💾 leucocytes.db                # Base SQLite (auto-créé)
│
├── 📂 frontend/                         # Frontend React
│   ├── 📂 public/                      # Assets statiques
│   │   └── 🖼️ vite.svg
│   │
│   ├── 📂 src/
│   │   ├── 📄 App.jsx                  # Composant principal ⭐
│   │   ├── 📄 main.jsx                 # Point d'entrée React
│   │   └── 📄 index.css                # Styles Tailwind
│   │
│   ├── 📄 index.html                   # Template HTML
│   ├── 📄 package.json                 # Dépendances npm
│   ├── 📄 vite.config.js               # Config Vite + proxy
│   ├── 📄 tailwind.config.js           # Config Tailwind CSS
│   ├── 📄 postcss.config.js            # Config PostCSS
│   └── 📄 .gitignore                   # Fichiers à ignorer
│
├── 📄 README.md                         # Ce fichier ⭐
└── 📄 .gitignore                        # Gitignore global

```

### Description des fichiers clés

#### Backend

| Fichier                                  | Description                                                       |
| ---------------------------------------- | ----------------------------------------------------------------- |
| **app/main.py**                    | Point d'entrée FastAPI, configuration CORS, inclusion des routes |
| **app/config.py**                  | Gestion de la configuration via variables d'environnement         |
| **app/database/database.py**       | Connexion SQLite, requêtes SQL, gestion transactions             |
| **app/models/mesure.py**           | Modèles Pydantic pour validation (Create, Update, Response)      |
| **app/routes/mesures.py**          | Définition des endpoints REST (GET, POST, PUT, DELETE)           |
| **app/services/mesure_service.py** | Logique métier (conversions, validations business)               |
| **requirements.txt**               | Liste des dépendances Python à installer                        |
| **.env**                           | Variables d'environnement (DATABASE_URL, CORS_ORIGINS, etc.)      |

#### Frontend

| Fichier                      | Description                                              |
| ---------------------------- | -------------------------------------------------------- |
| **src/App.jsx**        | Composant React principal avec graphiques et formulaires |
| **src/main.jsx**       | Point d'entrée React, montage de l'application          |
| **src/index.css**      | Styles Tailwind et CSS global                            |
| **vite.config.js**     | Configuration Vite (proxy API, port, etc.)               |
| **tailwind.config.js** | Configuration Tailwind CSS                               |
| **package.json**       | Dépendances npm et scripts                              |

---

## 🚀 Installation

### Prérequis

Avant de commencer, assurez-vous d'avoir installé :

* **Python** 3.9 ou supérieur ([Télécharger](https://www.python.org/downloads/))
* **Node.js** 16+ et npm ([Télécharger](https://nodejs.org/))
* **Git** ([Télécharger](https://git-scm.com/))

Vérifier les versions :

```bash
python --version    # Python 3.9.0 ou plus
node --version      # v16.0.0 ou plus
npm --version       # 8.0.0 ou plus
git --version       # 2.30.0 ou plus
```

### Installation complète

#### 1️⃣ Cloner le projet

```bash
# Cloner le repository
git clone https://github.com/votre-username/leucocytes-project.git
cd leucocytes-project
```

#### 2️⃣ Installation du Backend

```bash
# Aller dans le dossier backend
cd backend

# Créer un environnement virtuel (recommandé)
python -m venv venv

# Activer l'environnement virtuel
# Sur Windows :
venv\Scripts\activate
# Sur macOS/Linux :
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Vérifier l'installation
pip list
```

#### 3️⃣ Installation du Frontend

```bash
# Aller dans le dossier frontend (depuis la racine)
cd ../frontend

# Installer les dépendances
npm install

# Vérifier l'installation
npm list --depth=0
```

#### 4️⃣ Configuration

Créer le fichier `.env` dans le dossier `backend/` :

```bash
cd ../backend
nano .env  # ou utilisez votre éditeur préféré
```

Contenu du fichier `.env` :

```env
# Application
APP_NAME="API Suivi des Leucocytes"
APP_VERSION="1.0.0"
DEBUG=True

# Base de données
DATABASE_URL="leucocytes.db"

# CORS (ajouter vos domaines en production)
CORS_ORIGINS=["http://localhost:3000", "http://localhost:5173"]

# API
API_PREFIX="/api"
```

---

## ⚙️ Configuration

### Variables d'environnement Backend

| Variable         | Valeur par défaut         | Description                |
| ---------------- | -------------------------- | -------------------------- |
| `APP_NAME`     | "API Suivi des Leucocytes" | Nom de l'application       |
| `APP_VERSION`  | "1.0.0"                    | Version de l'API           |
| `DEBUG`        | `True`                   | Mode debug (auto-reload)   |
| `DATABASE_URL` | "leucocytes.db"            | Chemin vers la base SQLite |
| `CORS_ORIGINS` | ["http://localhost:3000"]  | Origines autorisées CORS  |
| `API_PREFIX`   | "/api"                     | Préfixe des routes API    |

### Configuration Frontend

#### Modifier le port (optionnel)

Dans `frontend/vite.config.js` :

```javascript
export default defineConfig({
  server: {
    port: 3000,  // Changer ici
  }
})
```

#### Modifier l'URL de l'API (production)

Dans `frontend/src/App.jsx` :

```javascript
const API_BASE_URL = 'http://localhost:8000/api';
// En production, remplacer par :
// const API_BASE_URL = 'https://votre-api.com/api';
```

---

## 🎮 Utilisation

### Démarrage du projet

Vous avez besoin de **2 terminaux** :

#### Terminal 1 : Backend

```bash
cd backend

# Activer l'environnement virtuel si ce n'est pas déjà fait
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Lancer le serveur
python -m app.main
# OU
uvicorn app.main:app --reload

# ✅ Backend démarré sur http://localhost:8000
```

Vous devriez voir :

```
🚀 Démarrage du serveur API...
📚 Documentation disponible sur: http://localhost:8000/docs
🔧 API disponible sur: http://localhost:8000/api
INFO:     Uvicorn running on http://0.0.0.0:8000
```

#### Terminal 2 : Frontend

```bash
cd frontend

# Lancer le serveur de développement
npm run dev

# ✅ Frontend démarré sur http://localhost:3000
```

Vous devriez voir :

```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

### Accéder à l'application

1. **Application web** : http://localhost:3000
2. **Documentation API** : http://localhost:8000/docs
3. **API alternative** : http://localhost:8000/redoc

### Utilisation de l'interface

#### 1. Vue Globules Blancs

* Affiche uniquement les leucocytes totaux
* Zone verte = valeurs normales (4000-11000)
* Lignes rouges = limites haute/basse

#### 2. Vue Courbes

* Compare tous les types cellulaires
* Chaque type a sa couleur distinctive
* Idéal pour repérer les anomalies

#### 3. Vue Empilée

* Montre la composition des leucocytes
* Aires empilées par type cellulaire
* La courbe bleue = total des leucocytes

#### Ajouter une mesure

1. Cliquer sur "Afficher le tableau de saisie"
2. Remplir le formulaire :
   * **Année** : Entre 1997 et 2022
   * **Leucocytes** : En K/mm³ (ex: 7.5)
   * **Neutrophiles** : En /mm³ (ex: 4200)
   * **Éosinophiles** : En /mm³ (ex: 180)
   * **Lymphocytes** : En /mm³ (ex: 2100)
3. Cliquer sur "Ajouter"
4. Le graphique se met à jour automatiquement

#### Supprimer une mesure

1. Dans le tableau, trouver la ligne à supprimer
2. Cliquer sur l'icône 🗑️
3. Confirmer la suppression

---

## 📚 Documentation de l'API

### Base URL

```
http://localhost:8000/api
```

### Endpoints disponibles

#### 1. Récupérer toutes les mesures

```http
GET /api/mesures
```

**Réponse (200 OK) :**

```json
[
  {
    "annee": 1997,
    "leucocytes": 7500,
    "neutrophiles": 4200,
    "eosinophiles": 180,
    "lymphocytes": 2100
  },
  {
    "annee": 1998,
    "leucocytes": 7200,
    "neutrophiles": 4000,
    "eosinophiles": 160,
    "lymphocytes": 2050
  }
]
```

#### 2. Récupérer une mesure par année

```http
GET /api/mesures/{annee}
```

**Exemple :**

```bash
curl http://localhost:8000/api/mesures/2020
```

**Réponse (200 OK) :**

```json
{
  "annee": 2020,
  "leucocytes": 7300,
  "neutrophiles": 4100,
  "eosinophiles": 170,
  "lymphocytes": 2200
}
```

**Erreur (404 Not Found) :**

```json
{
  "detail": "Aucune mesure trouvée pour l'année 2020"
}
```

#### 3. Créer une nouvelle mesure

```http
POST /api/mesures
Content-Type: application/json
```

**Body :**

```json
{
  "annee": 2022,
  "leucocytes": 7.5,
  "neutrophiles": 4200,
  "eosinophiles": 180,
  "lymphocytes": 2100
}
```

**Réponse (201 Created) :**

```json
{
  "annee": 2022,
  "leucocytes": 7500,
  "neutrophiles": 4200,
  "eosinophiles": 180,
  "lymphocytes": 2100
}
```

**Erreur (400 Bad Request) :**

```json
{
  "detail": "Une mesure existe déjà pour l'année 2022"
}
```

#### 4. Mettre à jour une mesure

```http
PUT /api/mesures/{annee}
Content-Type: application/json
```

**Body (tous les champs sont optionnels) :**

```json
{
  "leucocytes": 7.8,
  "neutrophiles": 4300
}
```

**Réponse (200 OK) :**

```json
{
  "annee": 2022,
  "leucocytes": 7800,
  "neutrophiles": 4300,
  "eosinophiles": 180,
  "lymphocytes": 2100
}
```

#### 5. Supprimer une mesure

```http
DELETE /api/mesures/{annee}
```

**Réponse (204 No Content)**

#### 6. Obtenir des statistiques

```http
GET /api/mesures/stats/summary
```

**Réponse (200 OK) :**

```json
{
  "total_mesures": 25,
  "annee_debut": 1997,
  "annee_fin": 2022,
  "leucocytes": {
    "moyenne": 7250.5,
    "min": 6500,
    "max": 8200
  }
}
```

### Codes de statut HTTP

| Code | Description                           |
| ---- | ------------------------------------- |
| 200  | Succès                               |
| 201  | Créé avec succès                   |
| 204  | Suppression réussie (pas de contenu) |
| 400  | Requête invalide                     |
| 404  | Ressource non trouvée                |
| 422  | Erreur de validation                  |
| 500  | Erreur serveur                        |

### Explorer l'API interactivement

Ouvrez http://localhost:8000/docs dans votre navigateur pour accéder à **Swagger UI** et tester tous les endpoints directement !

---

## 💻 Développement

### Structure de développement recommandée

```bash
# Terminal 1 : Backend avec auto-reload
cd backend
uvicorn app.main:app --reload

# Terminal 2 : Frontend avec hot-reload
cd frontend
npm run dev

# Terminal 3 : Pour les commandes Git, tests, etc.
```

### Ajouter une nouvelle fonctionnalité

#### Backend

1. **Créer le modèle** dans `app/models/`
2. **Ajouter les méthodes database** dans `app/database/`
3. **Créer le service** dans `app/services/`
4. **Définir les routes** dans `app/routes/`
5. **Inclure les routes** dans `app/main.py`

#### Frontend

1. **Créer le composant** dans `src/components/`
2. **Ajouter au state** dans `App.jsx`
3. **Créer les fonctions API** pour fetch
4. **Mettre à jour l'UI**

### Commandes utiles

#### Backend

```bash
# Lancer le serveur en mode debug
python -m app.main

# Lancer avec uvicorn (auto-reload)
uvicorn app.main:app --reload --log-level debug

# Vérifier les dépendances
pip list

# Mettre à jour les dépendances
pip install --upgrade -r requirements.txt

# Créer un nouveau fichier de requirements
pip freeze > requirements.txt
```

#### Frontend

```bash
# Lancer en mode développement
npm run dev

# Build pour production
npm run build

# Prévisualiser le build
npm run preview

# Linter (si configuré)
npm run lint

# Formater le code (si prettier installé)
npm run format
```

### Debugger

#### Backend (Python)

Avec  **VSCode** , créer `.vscode/launch.json` :

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: FastAPI",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": [
        "app.main:app",
        "--reload"
      ],
      "jinja": true,
      "cwd": "${workspaceFolder}/backend"
    }
  ]
}
```

#### Frontend (React)

Utiliser **React Developer Tools** :

* Chrome : [Extension](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
* Firefox : [Extension](https://addons.mozilla.org/fr/firefox/addon/react-devtools/)

---

## 🧪 Tests

### Backend

```bash
cd backend

# Installer pytest
pip install pytest pytest-asyncio httpx

# Créer tests/test_api.py
# Lancer les tests
pytest

# Avec couverture
pytest --cov=app tests/
```

### Frontend

```bash
cd frontend

# Installer Jest et React Testing Library
npm install --save-dev @testing-library/react @testing-library/jest-dom

# Lancer les tests
npm test

# Avec couverture
npm test -- --coverage
```

---

## 🚢 Déploiement

### Backend (FastAPI)

#### Option 1 : Railway

1. Créer un compte sur [Railway](https://railway.app/)
2. Connecter votre repo GitHub
3. Déployer automatiquement

#### Option 2 : Render

1. Créer un compte sur [Render](https://render.com/)
2. Créer un nouveau Web Service
3. Configurer :
   * Build Command : `pip install -r requirements.txt`
   * Start Command : `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

#### Option 3 : Docker

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
# Build
docker build -t leucocytes-api .

# Run
docker run -p 8000:8000 leucocytes-api
```

### Frontend (React)

#### Option 1 : Vercel

```bash
# Installer Vercel CLI
npm install -g vercel

# Deploy
cd frontend
vercel
```

#### Option 2 : Netlify

```bash
# Build
npm run build

# Le dossier dist/ est prêt pour Netlify
```

#### Option 3 : GitHub Pages

```bash
# Ajouter dans package.json
"homepage": "https://username.github.io/leucocytes-project"

# Installer gh-pages
npm install --save-dev gh-pages

# Ajouter scripts
"predeploy": "npm run build",
"deploy": "gh-pages -d dist"

# Déployer
npm run deploy
```

---

## 👥 Contribution

Les contributions sont les bienvenues ! Voici comment contribuer :

1. **Fork** le projet
2. **Créer une branche** : `git checkout -b feature/AmazingFeature`
3. **Commit** : `git commit -m 'Add some AmazingFeature'`
4. **Push** : `git push origin feature/AmazingFeature`
5. **Ouvrir une Pull Request**

### Guidelines

* Suivre les conventions de code existantes
* Ajouter des tests pour les nouvelles fonctionnalités
* Mettre à jour la documentation
* Créer des commits clairs et descriptifs

---

## 📄 Licence

Ce projet est sous licence  **MIT** . Voir le fichier [LICENSE](https://claude.ai/chat/LICENSE) pour plus de détails.

```
MIT License

Copyright (c) 2024 Leucocytes Project

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software...
```

---

## 🙏 Remerciements

* [FastAPI](https://fastapi.tiangolo.com/) - Framework backend moderne
* [React](https://react.dev/) - Bibliothèque UI
* [Recharts](https://recharts.org/) - Graphiques interactifs
* [Tailwind CSS](https://tailwindcss.com/) - Framework CSS

---

## 📞 Contact & Support

* **Issues** : [GitHub Issues](https://github.com/votre-username/leucocytes-project/issues)
* **Discussions** : [GitHub Discussions](https://github.com/votre-username/leucocytes-project/discussions)
* **Email** : votre-email@example.com

---

## 📊 Statistiques du projet

![GitHub stars](https://img.shields.io/github/stars/votre-username/leucocytes-project?style=social)
![GitHub forks](https://img.shields.io/github/forks/votre-username/leucocytes-project?style=social)
![GitHub issues](https://img.shields.io/github/issues/votre-username/leucocytes-project)

---

<div align="center">
**Fait avec ❤️ par votre équipe**

[⬆ Retour en haut](https://claude.ai/chat/e95c7d73-e6ec-4044-a3e3-766b9a592135#-suivi-des-leucocytes---application-full-stack)

</div>

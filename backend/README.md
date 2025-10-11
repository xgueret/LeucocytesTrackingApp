# Backend Node.js - API Suivi des Leucocytes

API REST pour le suivi et la visualisation des leucocytes, construite avec **Node.js**, **Express**, **TypeScript**, et **SQLite**.

## Technologies

- **Runtime** : Node.js 18+
- **Framework** : Express.js
- **Langage** : TypeScript
- **Base de données** : SQLite avec better-sqlite3
- **Validation** : Zod
- **Documentation** : Swagger/OpenAPI 3.0
- **Hot reload** : tsx watch

## Installation

### Prérequis

- Node.js 18 ou supérieur
- npm ou yarn

### Étapes

1. **Cloner le dépôt** (si ce n'est pas déjà fait)
   ```bash
   git clone https://github.com/xgueret/LeucocytesTrackingApp.git
   cd LeucocytesTrackingApp/backend
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement**
   ```bash
   cp .env.example .env
   ```

   Modifier `.env` si nécessaire (les valeurs par défaut fonctionnent pour le développement local).

4. **Démarrer le serveur en mode développement**
   ```bash
   npm run dev
   ```

Le serveur démarre sur `http://localhost:8081`.

## Scripts npm

- `npm run dev` - Lance le serveur en mode développement avec hot reload
- `npm run build` - Compile le TypeScript en JavaScript (sortie dans `dist/`)
- `npm start` - Lance le serveur en mode production (nécessite `npm run build` d'abord)
- `npm run lint` - Vérifie le code avec ESLint
- `npm run format` - Formate le code avec Prettier

## Docker

### Build de l'image Docker

```bash
docker build -t leucocytes-backend .
```

L'image utilise un **build multi-stage** pour optimiser la taille (~ 209 MB) :
- Stage 1 : Build du TypeScript avec toutes les dépendances
- Stage 2 : Image de production légère avec uniquement les dépendances nécessaires

### Lancer le conteneur

```bash
docker run -d \
  --name leucocytes-api \
  -p 8081:8081 \
  -v $(pwd)/data:/app/data \
  -e NODE_ENV=production \
  leucocytes-backend
```

**Options** :
- `-d` : Mode détaché (en arrière-plan)
- `-p 8081:8081` : Expose le port 8081
- `-v $(pwd)/data:/app/data` : Monte le volume pour persister la base de données
- `-e NODE_ENV=production` : Définit l'environnement en production

### Vérifier les logs

```bash
docker logs leucocytes-api
```

### Arrêter le conteneur

```bash
docker stop leucocytes-api
docker rm leucocytes-api
```

### Health check

Le conteneur inclut un health check automatique toutes les 30 secondes :

```bash
docker inspect --format='{{.State.Health.Status}}' leucocytes-api
```

## Architecture

```
backend/
├── src/
│   ├── server.ts       # Serveur Express principal
│   └── swagger.ts      # Configuration Swagger/OpenAPI
├── app/
│   └── data/
│       └── leucocytes.db  # Base de données SQLite (héritée du backend Python)
├── dist/               # Code compilé (généré par tsc)
├── package.json
├── tsconfig.json
└── .env
```

## Schéma de la base de données

### Table `mesures`

| Colonne        | Type      | Description                       | Contraintes       |
|---------------|-----------|-----------------------------------|-------------------|
| id            | INTEGER   | Identifiant unique                | PRIMARY KEY, AUTO |
| annee         | INTEGER   | Année de la mesure                | NOT NULL          |
| mois          | INTEGER   | Mois de la mesure (1-12)          | NOT NULL          |
| leucocytes    | REAL      | Leucocytes en /mm³                | NOT NULL          |
| neutrophiles  | REAL      | Neutrophiles en /mm³              | NOT NULL          |
| eosinophiles  | REAL      | Éosinophiles en /mm³              | NOT NULL          |
| lymphocytes   | REAL      | Lymphocytes en /mm³               | NOT NULL          |
| date_saisie   | TIMESTAMP | Date de création (ISO 8601)       | DEFAULT NOW       |

**Contrainte** : `UNIQUE(annee, mois)` - Une seule mesure par mois/année.

## Endpoints API

### Documentation interactive

Accédez à la documentation Swagger interactive sur :
- **http://localhost:8081/docs**

### Liste des endpoints

#### Health check

**GET** `/api/health`

Vérifie que l'API fonctionne.

**Réponse 200** :
```json
{
  "status": "healthy",
  "timestamp": "2024-10-11T14:30:00.000Z"
}
```

---

#### Liste toutes les mesures

**GET** `/api/mesures`

Récupère toutes les mesures avec filtres optionnels.

**Query params** :
- `annee` (optional) : Filtrer par année (ex: `2024`)
- `mois` (optional) : Filtrer par mois 1-12 (ex: `3`)

**Exemples** :
```bash
# Toutes les mesures
curl http://localhost:8081/api/mesures

# Mesures de 2024
curl http://localhost:8081/api/mesures?annee=2024

# Mesure de mars 2024
curl http://localhost:8081/api/mesures?annee=2024&mois=3
```

**Réponse 200** :
```json
[
  {
    "id": 1,
    "annee": 2024,
    "mois": 10,
    "leucocytes": 7.5,
    "neutrophiles": 4.2,
    "eosinophiles": 0.3,
    "lymphocytes": 2.8,
    "date_saisie": "2024-10-11T14:30:00.000Z"
  }
]
```

---

#### Crée une nouvelle mesure

**POST** `/api/mesures`

Ajoute une nouvelle mesure de leucocytes.

**Body** :
```json
{
  "annee": 2024,
  "mois": 10,
  "leucocytes": 7.5,
  "neutrophiles": 4.2,
  "eosinophiles": 0.3,
  "lymphocytes": 2.8
}
```

**Validation** :
- `annee` : entier entre 1997 et 2100
- `mois` : entier entre 1 et 12
- `leucocytes` : nombre positif
- `neutrophiles`, `eosinophiles`, `lymphocytes` : nombres >= 0

**Exemple** :
```bash
curl -X POST http://localhost:8081/api/mesures \
  -H "Content-Type: application/json" \
  -d '{
    "annee": 2024,
    "mois": 10,
    "leucocytes": 7.5,
    "neutrophiles": 4.2,
    "eosinophiles": 0.3,
    "lymphocytes": 2.8
  }'
```

**Réponse 201** : Mesure créée avec succès (même structure que GET)

**Réponse 400** : Erreur de validation ou mesure déjà existante
```json
{
  "error": "Mesure déjà existante",
  "detail": "Une mesure existe déjà pour 2024/10"
}
```

---

#### Récupère une mesure par ID

**GET** `/api/mesures/:id`

Retourne une mesure spécifique.

**Exemple** :
```bash
curl http://localhost:8081/api/mesures/1
```

**Réponse 200** : Mesure trouvée (même structure que GET /api/mesures)

**Réponse 404** :
```json
{
  "error": "Mesure non trouvée",
  "detail": "Aucune mesure trouvée avec l'ID 123"
}
```

---

#### Met à jour une mesure

**PUT** `/api/mesures/:id`

Modifie une mesure existante (mise à jour partielle possible).

**Body** (tous les champs sont optionnels) :
```json
{
  "leucocytes": 8.2,
  "neutrophiles": 4.5
}
```

**Exemple** :
```bash
curl -X PUT http://localhost:8081/api/mesures/1 \
  -H "Content-Type: application/json" \
  -d '{
    "leucocytes": 8.2
  }'
```

**Réponse 200** : Mesure mise à jour

**Réponse 404** : Mesure non trouvée

---

#### Supprime une mesure

**DELETE** `/api/mesures/:id`

Supprime définitivement une mesure.

**Exemple** :
```bash
curl -X DELETE http://localhost:8081/api/mesures/1
```

**Réponse 204** : Mesure supprimée avec succès (pas de body)

**Réponse 404** : Mesure non trouvée

---

#### Statistiques

**GET** `/api/mesures/stats/summary`

Calcule des statistiques globales sur les mesures.

**Exemple** :
```bash
curl http://localhost:8081/api/mesures/stats/summary
```

**Réponse 200** :
```json
{
  "total_mesures": 150,
  "annee_debut": 1997,
  "annee_fin": 2022,
  "leucocytes": {
    "moyenne": 7.2,
    "min": 4.5,
    "max": 10.8
  }
}
```

## Migration depuis Python

Si vous migrez depuis le backend Python/FastAPI :

1. **Copier la base de données**
   ```bash
   # La base SQLite est déjà partagée entre les deux backends
   # Pas besoin de copier si elle est déjà dans backend/app/data/
   ```

2. **Vérifier la compatibilité des données**

   Le schéma SQLite est identique entre Python et Node.js, aucune migration nécessaire.

3. **Changer le port du backend Python**

   Si vous voulez tester les deux backends en parallèle, changez le port du backend Python dans `backend/app/main.py` (ligne 64).

4. **Tester la compatibilité avec le frontend**

   Le frontend React est 100% compatible, il suffit de vérifier que `frontend/vite.config.js` pointe bien vers le port 8081.

## Développement

### Hot reload

Le serveur redémarre automatiquement lors de modifications du code TypeScript grâce à `tsx watch` :

```bash
npm run dev
```

### Build pour production

```bash
npm run build
npm start
```

### Débogage

Pour afficher plus de logs :

```bash
NODE_ENV=development npm run dev
```

## Variables d'environnement

| Variable       | Description                          | Défaut                      |
|---------------|--------------------------------------|----------------------------|
| PORT          | Port du serveur                      | 8081                       |
| DATABASE_URL  | Chemin vers la DB SQLite             | ./app/data/leucocytes.db   |
| CORS_ORIGINS  | Origines CORS autorisées (CSV)       | http://localhost:3000,...  |
| NODE_ENV      | Environnement (development/prod)     | development                |

## Tests

### Tests manuels avec cURL

Voir les exemples cURL dans la section "Endpoints API" ci-dessus.

### Tests avec Swagger UI

1. Accédez à http://localhost:8081/docs
2. Testez chaque endpoint directement depuis l'interface

## Performance

- **better-sqlite3** est un driver synchrone ultra-rapide (écrit en C++)
- Temps de réponse typique : < 10ms pour GET, < 30ms pour POST
- Mode WAL activé pour optimiser les performances SQLite
- Pas de pool de connexions nécessaire (SQLite = 1 connexion)

## Sécurité

- ✅ Validation stricte avec Zod (toutes les entrées utilisateur)
- ✅ Requêtes préparées (prévention des injections SQL)
- ✅ CORS configuré avec origines spécifiques
- ✅ Pas de stack traces en production (masquées si NODE_ENV=production)
- ✅ Fermeture propre de la DB sur SIGINT/SIGTERM

## Dépannage

### Erreur "EADDRINUSE"

Le port 8081 est déjà utilisé. Vérifiez si le backend Python tourne encore :

```bash
lsof -i :8081
# Ou changez le port dans .env
```

### Erreur "unable to open database file"

Le chemin vers la base de données est incorrect. Vérifiez :

```bash
ls -la app/data/leucocytes.db
# Ou mettez à jour DATABASE_URL dans .env
```

### Erreur CORS

Vérifiez que `CORS_ORIGINS` dans `.env` inclut l'origine du frontend (ex: http://localhost:3000).

## Licence

MIT

## Support

Pour signaler un bug ou demander une fonctionnalité :
- GitHub Issues : https://github.com/xgueret/LeucocytesTrackingApp/issues

## Auteur

Migré de Python/FastAPI vers Node.js/Express/TypeScript par Claude Code 🤖

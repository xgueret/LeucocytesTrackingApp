# 👤 Gestion des Utilisateurs

La gestion des utilisateurs de l'application LeucocytesTrackingApp utilise une **base de données SQLite** avec authentification sécurisée par **JWT** et **bcrypt**.

## 📊 Structure de la Base de Données

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  hashed_password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔐 Utilisateur par Défaut

Au premier démarrage, un utilisateur admin est créé automatiquement :

- **Username:** `admin`
- **Password:** `admin123`

⚠️ **Recommandation:** Changez ce mot de passe en production !

## 🛠️ Gestion via Ligne de Commande

### Créer un nouvel utilisateur

```bash
cd backend
npm run user:create <username> <password>
```

**Exemple:**
```bash
npm run user:create medecin securePassword123
# ✅ Utilisateur "medecin" créé avec succès
```

### Lister tous les utilisateurs

```bash
npm run user:list
```

**Sortie:**
```
📋 Liste des utilisateurs:

  • medecin (ID: 2, créé le: 2025-10-17 02:29:30)
  • admin (ID: 1, créé le: 2025-10-17 02:29:02)
```

### Supprimer un utilisateur

```bash
npm run user:delete <username>
```

**Exemple:**
```bash
npm run user:delete medecin
# ✅ Utilisateur "medecin" supprimé avec succès
```

**Note:** L'utilisateur `admin` ne peut pas être supprimé.

### Vérifier si un utilisateur existe

```bash
npm run user:exists <username>
```

## 🌐 Gestion via API REST

Toutes les routes d'administration requièrent une **authentification JWT**.

### 1. Obtenir un token JWT

```bash
POST /api/token
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Réponse:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "username": "admin"
}
```

### 2. Lister tous les utilisateurs

```bash
GET /api/admin/users
Authorization: Bearer <token>
```

**Réponse:**
```json
[
  {
    "id": 1,
    "username": "admin",
    "created_at": "2025-10-17 02:29:02"
  },
  {
    "id": 2,
    "username": "medecin",
    "created_at": "2025-10-17 02:29:30"
  }
]
```

### 3. Créer un nouvel utilisateur

```bash
POST /api/admin/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "infirmier",
  "password": "secure123"
}
```

**Contraintes:**
- Le mot de passe doit contenir au moins **6 caractères**
- Le username doit être **unique**

**Réponse (201):**
```json
{
  "id": 3,
  "username": "infirmier",
  "created_at": "2025-10-17 02:57:31"
}
```

### 4. Supprimer un utilisateur

```bash
DELETE /api/admin/users/:username
Authorization: Bearer <token>
```

**Exemple:**
```bash
curl -X DELETE http://localhost:8081/api/admin/users/infirmier \
  -H "Authorization: Bearer <token>"
```

**Réponse:** `204 No Content`

**Restrictions:**
- ❌ Impossible de supprimer l'utilisateur `admin`

## 📝 Exemples Complets avec curl

### Créer un utilisateur et se connecter

```bash
# 1. Se connecter en tant qu'admin
TOKEN=$(curl -s -X POST http://localhost:8081/api/token \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.access_token')

# 2. Créer un nouvel utilisateur
curl -X POST http://localhost:8081/api/admin/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"username":"docteur","password":"motdepasse123"}'

# 3. Se connecter avec le nouvel utilisateur
curl -X POST http://localhost:8081/api/token \
  -H "Content-Type: application/json" \
  -d '{"username":"docteur","password":"motdepasse123"}'
```

## 🔒 Sécurité

### Hachage des mots de passe

- **Algorithme:** bcrypt avec 10 rounds de sel
- Les mots de passe ne sont **jamais stockés en clair**
- Chaque mot de passe a un sel unique

### Tokens JWT

- **Expiration:** 30 minutes
- **Algorithme:** HS256 (HMAC avec SHA-256)
- **Secret:** Défini dans `.env` (`SECRET_KEY`)

### Protection des routes

Toutes les routes `/api/mesures/*` et `/api/admin/*` sont protégées par le middleware `requireAuth`.

## 🧪 Tests

### Test de l'authentification

```bash
# ❌ Sans token → 401
curl http://localhost:8081/api/mesures
# {"error":"Non authentifié","detail":"Token manquant..."}

# ✅ Avec token → 200
TOKEN=$(curl -s -X POST http://localhost:8081/api/token \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.access_token')

curl -H "Authorization: Bearer $TOKEN" http://localhost:8081/api/mesures
# [{"id":3,"annee":2024,"mois":11,...}]
```

## 📂 Fichiers Modifiés

- `backend/src/auth.ts` - Module d'authentification avec gestion DB
- `backend/src/server.ts` - Initialisation et routes d'administration
- `backend/src/manage-users.ts` - Script CLI de gestion des utilisateurs
- `backend/package.json` - Scripts npm ajoutés
- `backend/.env` - SECRET_KEY pour JWT

## 🚀 Migration depuis l'ancien système

Si vous migrez depuis l'ancien système (utilisateurs en mémoire), supprimez simplement l'ancienne base de données :

```bash
rm backend/data/leucocytes.db
npm run dev
```

L'utilisateur admin sera recréé automatiquement au démarrage.

## 💡 Bonnes Pratiques

1. **Changez le mot de passe admin** après le premier démarrage
2. **Utilisez des mots de passe forts** (min. 12 caractères)
3. **Ne partagez jamais** votre SECRET_KEY
4. **Sauvegardez régulièrement** la base de données `leucocytes.db`
5. **Limitez les utilisateurs** aux personnes de confiance

## 🆘 Dépannage

### J'ai oublié mon mot de passe

Supprimez l'utilisateur et recréez-le :

```bash
npm run user:delete username
npm run user:create username nouveauMotDePasse
```

### La base de données est corrompue

Supprimez-la et redémarrez :

```bash
rm backend/data/leucocytes.db
npm run dev
```

⚠️ **Attention:** Cela supprimera toutes les données !

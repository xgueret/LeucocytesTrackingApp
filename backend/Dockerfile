# Backend Node.js Dockerfile
# Build multi-stage pour optimiser la taille de l'image

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY tsconfig.json ./

# Installer les dépendances (incluant devDependencies pour le build)
RUN npm ci

# Copier le code source
COPY src ./src

# Compiler TypeScript
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Installer curl et su-exec pour le health check et la gestion des permissions
RUN apk add --no-cache curl su-exec

# Copier uniquement les fichiers nécessaires pour la production
COPY package*.json ./

# Installer uniquement les dépendances de production
RUN npm ci --only=production

# Copier le code compilé depuis le stage builder
COPY --from=builder /app/dist ./dist

# Copier le script d'entrypoint
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Créer le répertoire pour la base de données et donner les permissions
RUN mkdir -p /app/data && \
    chown -R nodejs:nodejs /app

# Exposer le port
EXPOSE 8081

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8081/api/health || exit 1

# Variables d'environnement par défaut
ENV NODE_ENV=production \
    PORT=8081 \
    DATABASE_URL=/app/data/leucocytes.db

# Utiliser le script d'entrypoint pour fixer les permissions
ENTRYPOINT ["docker-entrypoint.sh"]

# Démarrer l'application
CMD ["node", "dist/server.js"]

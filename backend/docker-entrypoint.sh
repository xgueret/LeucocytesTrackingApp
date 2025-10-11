#!/bin/sh
set -e

# Créer le répertoire data s'il n'existe pas
mkdir -p /app/data

# Fixer les permissions pour l'utilisateur nodejs
chown -R nodejs:nodejs /app/data

# Exécuter la commande en tant qu'utilisateur nodejs
exec su-exec nodejs "$@"

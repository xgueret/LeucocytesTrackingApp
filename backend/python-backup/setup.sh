#!/bin/bash
echo "🚀 Configuration du projet..."

# Créer le venv
if [ ! -d "venv" ]; then
    echo "📦 Création de l'environnement virtuel..."
    python3 -m venv venv
fi

# Activer
echo "🔧 Activation..."
source venv/bin/activate

# Installer
echo "⬇️ Installation des dépendances..."
pip install --upgrade pip
pip install -r requirements.txt

echo "✅ Projet prêt !"
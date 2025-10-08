"""
Module de gestion de la base de données SQLite
"""

from .database import Database, db

# Exports publics
__all__ = [
    "Database",
    "db"
]

# Optionnel : Documentation du module
__doc__ = """
Ce module fournit :
- Database : Classe pour gérer les connexions et requêtes SQLite
- db : Instance globale de la base de données

Exemple d'utilisation :
    from app.database import db
    
    mesures = db.get_all_mesures()
"""

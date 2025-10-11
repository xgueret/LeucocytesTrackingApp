"""
Routes de l'API REST
"""

from . import mesures

# Exports publics
__all__ = [
    "mesures"
]

# Documentation
__doc__ = """
Routes disponibles :
- mesures : Routes pour gérer les mesures de leucocytes
  - GET /api/mesures : Liste toutes les mesures
  - GET /api/mesures/{annee} : Récupère une mesure
  - POST /api/mesures : Crée une mesure
  - PUT /api/mesures/{annee} : Met à jour une mesure
  - DELETE /api/mesures/{annee} : Supprime une mesure
  - GET /api/mesures/stats/summary : Obtient des statistiques

Exemple d'ajout dans main.py :
    from app.routes import mesures
    
    app.include_router(mesures.router, prefix="/api")
"""

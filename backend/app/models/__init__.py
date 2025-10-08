"""
Modèles Pydantic pour la validation des données
"""

from .mesures import (
    MesureBase,
    MesureCreate,
    MesureUpdate,
    MesureResponse,
    MesureInDB,
    StatsResponse
)

# Exports publics
__all__ = [
    "MesureBase",
    "MesureCreate",
    "MesureUpdate",
    "MesureResponse",
    "MesureInDB",
    "StatsResponse"
]

# Documentation
__doc__ = """
Modèles disponibles :
- MesureBase : Modèle de base avec tous les champs
- MesureCreate : Pour créer une nouvelle mesure (POST)
- MesureUpdate : Pour mettre à jour une mesure (PUT) - champs optionnels
- MesureResponse : Modèle de réponse API (sans date_saisie)
- MesureInDB : Modèle complet en base avec ID et timestamp
- StatsResponse : Modèle pour les statistiques

Exemple :
    from app.models import MesureCreate
    
    nouvelle_mesure = MesureCreate(
        annee=2022,
        leucocytes=7.5,
        neutrophiles=4200,
        eosinophiles=180,
        lymphocytes=2100
    )
"""
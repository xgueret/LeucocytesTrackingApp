"""
Services métier de l'application
"""

from .services.mesure_service import MesureService, mesure_service

# Exports publics
__all__ = [
    "MesureService",
    "mesure_service"
]

# Documentation
__doc__ = """
Services disponibles :
- MesureService : Classe pour la logique métier des mesures
- mesure_service : Instance globale du service

Le service contient toute la logique métier :
- Validation des données
- Conversions (K/mm³ vers /mm³)
- Gestion des erreurs métier
- Calculs de statistiques

Exemple :
    from app.services import mesure_service
    
    # Récupérer toutes les mesures
    mesures = mesure_service.get_all_mesures()
    
    # Créer une nouvelle mesure
    nouvelle = mesure_service.create_mesure(mesure_data)
    
    # Obtenir des statistiques
    stats = mesure_service.get_stats()
"""
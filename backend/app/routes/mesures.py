"""
Routes API pour les mesures de leucocytes
"""
from fastapi import APIRouter, status
from typing import List

from app.models.mesures import (
    MesureCreate, MesureUpdate, MesureResponse, StatsResponse
)
from app.services.mesure_service import mesure_service

router = APIRouter(
    prefix="/mesures",
    tags=["Mesures"]
)


@router.get("", response_model=List[MesureResponse])
async def get_mesures(annee: int = None, mois: int = None):
    """
    Récupère toutes les mesures de leucocytes avec filtres optionnels

    Args:
        annee: Filtrer par année (optionnel)
        mois: Filtrer par mois 1-12 (optionnel)

    Returns:
        Liste de toutes les mesures triées par année et mois
    """
    return mesure_service.get_all_mesures(annee=annee, mois=mois)


@router.get("/{mesure_id}", response_model=MesureResponse)
async def get_mesure(mesure_id: int):
    """
    Récupère une mesure par ID

    Args:
        mesure_id: ID de la mesure

    Returns:
        Mesure correspondante

    Raises:
        404: Mesure non trouvée
    """
    return mesure_service.get_mesure_by_id(mesure_id)


@router.post("", response_model=MesureResponse, status_code=status.HTTP_201_CREATED)
async def create_mesure(mesure: MesureCreate):
    """
    Crée une nouvelle mesure
    
    Args:
        mesure: Données de la mesure à créer
        
    Returns:
        Mesure créée
        
    Raises:
        400: Mesure déjà existante pour cette année
    """
    return mesure_service.create_mesure(mesure)


@router.put("/{mesure_id}", response_model=MesureResponse)
async def update_mesure(mesure_id: int, mesure: MesureUpdate):
    """
    Met à jour une mesure existante

    Args:
        mesure_id: ID de la mesure à modifier
        mesure: Nouvelles données (seuls les champs fournis seront mis à jour)

    Returns:
        Mesure mise à jour

    Raises:
        404: Mesure non trouvée
    """
    return mesure_service.update_mesure(mesure_id, mesure)


@router.delete("/{mesure_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_mesure(mesure_id: int):
    """
    Supprime une mesure

    Args:
        mesure_id: ID de la mesure à supprimer

    Raises:
        404: Mesure non trouvée
    """
    mesure_service.delete_mesure(mesure_id)
    return None


@router.get("/stats/summary", response_model=StatsResponse)
async def get_stats():
    """
    Calcule des statistiques sur les mesures
    
    Returns:
        Statistiques diverses (moyenne, min, max, etc.)
    """
    return mesure_service.get_stats()
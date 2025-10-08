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
async def get_mesures():
    """
    Récupère toutes les mesures de leucocytes
    
    Returns:
        Liste de toutes les mesures triées par année
    """
    return mesure_service.get_all_mesures()


@router.get("/{annee}", response_model=MesureResponse)
async def get_mesure(annee: int):
    """
    Récupère une mesure par année
    
    Args:
        annee: Année de la mesure (1997-2022)
    
    Returns:
        Mesure correspondante
    
    Raises:
        404: Mesure non trouvée
    """
    return mesure_service.get_mesure_by_annee(annee)


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


@router.put("/{annee}", response_model=MesureResponse)
async def update_mesure(annee: int, mesure: MesureUpdate):
    """
    Met à jour une mesure existante
    
    Args:
        annee: Année de la mesure à modifier
        mesure: Nouvelles données (seuls les champs fournis seront mis à jour)
        
    Returns:
        Mesure mise à jour
        
    Raises:
        404: Mesure non trouvée
    """
    return mesure_service.update_mesure(annee, mesure)


@router.delete("/{annee}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_mesure(annee: int):
    """
    Supprime une mesure
    
    Args:
        annee: Année de la mesure à supprimer
        
    Raises:
        404: Mesure non trouvée
    """
    mesure_service.delete_mesure(annee)
    return None


@router.get("/stats/summary", response_model=StatsResponse)
async def get_stats():
    """
    Calcule des statistiques sur les mesures
    
    Returns:
        Statistiques diverses (moyenne, min, max, etc.)
    """
    return mesure_service.get_stats()
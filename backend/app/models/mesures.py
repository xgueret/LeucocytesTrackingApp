"""
Modèles Pydantic pour les mesures de leucocytes
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class MesureBase(BaseModel):
    """Modèle de base pour une mesure"""
    annee: int = Field(..., ge=1997, le=2022, description="Année de la mesure")
    leucocytes: float = Field(..., gt=0, description="Leucocytes en K/mm³")
    neutrophiles: float = Field(..., ge=0, description="Neutrophiles en /mm³")
    eosinophiles: float = Field(..., ge=0, description="Éosinophiles en /mm³")
    lymphocytes: float = Field(..., ge=0, description="Lymphocytes en /mm³")


class MesureCreate(MesureBase):
    """Modèle pour créer une mesure"""
    pass


class MesureUpdate(BaseModel):
    """Modèle pour mettre à jour une mesure"""
    leucocytes: Optional[float] = Field(None, gt=0)
    neutrophiles: Optional[float] = Field(None, ge=0)
    eosinophiles: Optional[float] = Field(None, ge=0)
    lymphocytes: Optional[float] = Field(None, ge=0)


class MesureResponse(BaseModel):
    """Modèle de réponse pour une mesure"""
    annee: int
    leucocytes: float  # En /mm³ pour le frontend
    neutrophiles: float
    eosinophiles: float
    lymphocytes: float

    class Config:
        from_attributes = True


class MesureInDB(MesureResponse):
    """Modèle complet en base de données"""
    id: int
    date_saisie: datetime

    class Config:
        from_attributes = True


class StatsResponse(BaseModel):
    """Modèle pour les statistiques"""
    total_mesures: int
    annee_debut: Optional[int] = None
    annee_fin: Optional[int] = None
    leucocytes: Optional[dict] = None

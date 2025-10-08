"""
Service pour la logique métier des mesures
"""
from typing import List, Optional
from fastapi import HTTPException, status
import sqlite3

from app.database.database import db
from app.models.mesures import (
    MesureCreate, MesureUpdate, MesureResponse, StatsResponse
)


class MesureService:
    """Service pour gérer les mesures de leucocytes"""

    @staticmethod
    def get_all_mesures() -> List[MesureResponse]:
        """Récupère toutes les mesures"""
        mesures = db.get_all_mesures()

        return [
            MesureResponse(
                annee=m["annee"],
                leucocytes=m["leucocytes"],
                neutrophiles=m["neutrophiles"],
                eosinophiles=m["eosinophiles"],
                lymphocytes=m["lymphocytes"]
            )
            for m in mesures
        ]

    @staticmethod
    def get_mesure_by_annee(annee: int) -> MesureResponse:
        """Récupère une mesure par année"""
        mesure = db.get_mesure_by_annee(annee)

        if not mesure:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Aucune mesure trouvée pour l'année {annee}"
            )

        return MesureResponse(
            annee=mesure["annee"],
            leucocytes=mesure["leucocytes"],
            neutrophiles=mesure["neutrophiles"],
            eosinophiles=mesure["eosinophiles"],
            lymphocytes=mesure["lymphocytes"]
        )

    @staticmethod
    def create_mesure(mesure_data: MesureCreate) -> MesureResponse:
        """Crée une nouvelle mesure"""
        # Convertir leucocytes de K/mm³ en /mm³
        leucocytes_converti = mesure_data.leucocytes * 1000

        try:
            mesure = db.create_mesure(
                annee=mesure_data.annee,
                leucocytes=leucocytes_converti,
                neutrophiles=mesure_data.neutrophiles,
                eosinophiles=mesure_data.eosinophiles,
                lymphocytes=mesure_data.lymphocytes
            )

            if not mesure:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Erreur lors de la création de la mesure"
                )

            return MesureResponse(
                annee=mesure["annee"],
                leucocytes=mesure["leucocytes"],
                neutrophiles=mesure["neutrophiles"],
                eosinophiles=mesure["eosinophiles"],
                lymphocytes=mesure["lymphocytes"]
            )
        except sqlite3.IntegrityError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Une mesure existe déjà pour l'année {mesure_data.annee}"
            )

    @staticmethod
    def update_mesure(annee: int, mesure_data: MesureUpdate) -> MesureResponse:
        """Met à jour une mesure existante"""
        # Convertir leucocytes si fourni
        leucocytes_converti = None
        if mesure_data.leucocytes is not None:
            leucocytes_converti = mesure_data.leucocytes * 1000

        mesure = db.update_mesure(
            annee=annee,
            leucocytes=leucocytes_converti,
            neutrophiles=mesure_data.neutrophiles,
            eosinophiles=mesure_data.eosinophiles,
            lymphocytes=mesure_data.lymphocytes
        )

        if not mesure:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Aucune mesure trouvée pour l'année {annee}"
            )

        return MesureResponse(
            annee=mesure["annee"],
            leucocytes=mesure["leucocytes"],
            neutrophiles=mesure["neutrophiles"],
            eosinophiles=mesure["eosinophiles"],
            lymphocytes=mesure["lymphocytes"]
        )

    @staticmethod
    def delete_mesure(annee: int) -> None:
        """Supprime une mesure"""
        success = db.delete_mesure(annee)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Aucune mesure trouvée pour l'année {annee}"
            )

    @staticmethod
    def get_stats() -> StatsResponse:
        """Calcule des statistiques sur les mesures"""
        mesures = db.get_all_mesures()

        if not mesures:
            return StatsResponse(
                total_mesures=0,
                annee_debut=None,
                annee_fin=None,
                leucocytes=None
            )

        leucocytes_values = [m["leucocytes"] for m in mesures]

        return StatsResponse(
            total_mesures=len(mesures),
            annee_debut=mesures[0]["annee"],
            annee_fin=mesures[-1]["annee"],
            leucocytes={
                "moyenne": sum(leucocytes_values) / len(leucocytes_values),
                "min": min(leucocytes_values),
                "max": max(leucocytes_values)
            }
        )


# Instance du service
mesure_service = MesureService()

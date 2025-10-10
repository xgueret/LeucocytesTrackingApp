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
    def get_all_mesures(annee: int = None, mois: int = None) -> List[MesureResponse]:
        """Récupère toutes les mesures avec filtres optionnels"""
        mesures = db.get_all_mesures(annee=annee, mois=mois)

        return [
            MesureResponse(
                id=m["id"],
                annee=m["annee"],
                mois=m["mois"],
                leucocytes=m["leucocytes"],
                neutrophiles=m["neutrophiles"],
                eosinophiles=m["eosinophiles"],
                lymphocytes=m["lymphocytes"]
            )
            for m in mesures
        ]

    @staticmethod
    def get_mesure_by_id(mesure_id: int) -> MesureResponse:
        """Récupère une mesure par ID"""
        mesure = db.get_mesure_by_id(mesure_id)

        if not mesure:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Aucune mesure trouvée avec l'ID {mesure_id}"
            )

        return MesureResponse(
            id=mesure["id"],
            annee=mesure["annee"],
            mois=mesure["mois"],
            leucocytes=mesure["leucocytes"],
            neutrophiles=mesure["neutrophiles"],
            eosinophiles=mesure["eosinophiles"],
            lymphocytes=mesure["lymphocytes"]
        )

    @staticmethod
    def create_mesure(mesure_data: MesureCreate) -> MesureResponse:
        """Crée une nouvelle mesure"""
        try:
            mesure = db.create_mesure(
                annee=mesure_data.annee,
                mois=mesure_data.mois,
                leucocytes=mesure_data.leucocytes,
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
                id=mesure["id"],
                annee=mesure["annee"],
                mois=mesure["mois"],
                leucocytes=mesure["leucocytes"],
                neutrophiles=mesure["neutrophiles"],
                eosinophiles=mesure["eosinophiles"],
                lymphocytes=mesure["lymphocytes"]
            )
        except sqlite3.IntegrityError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Une mesure existe déjà pour {mesure_data.annee}/{mesure_data.mois:02d}"
            )

    @staticmethod
    def update_mesure(mesure_id: int, mesure_data: MesureUpdate) -> MesureResponse:
        """Met à jour une mesure existante"""
        mesure = db.update_mesure(
            mesure_id=mesure_id,
            annee=mesure_data.annee,
            mois=mesure_data.mois,
            leucocytes=mesure_data.leucocytes,
            neutrophiles=mesure_data.neutrophiles,
            eosinophiles=mesure_data.eosinophiles,
            lymphocytes=mesure_data.lymphocytes
        )

        if not mesure:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Aucune mesure trouvée avec l'ID {mesure_id}"
            )

        return MesureResponse(
            id=mesure["id"],
            annee=mesure["annee"],
            mois=mesure["mois"],
            leucocytes=mesure["leucocytes"],
            neutrophiles=mesure["neutrophiles"],
            eosinophiles=mesure["eosinophiles"],
            lymphocytes=mesure["lymphocytes"]
        )

    @staticmethod
    def delete_mesure(mesure_id: int) -> None:
        """Supprime une mesure"""
        success = db.delete_mesure(mesure_id)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Aucune mesure trouvée avec l'ID {mesure_id}"
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

"""
Gestion de la base de données SQLite
"""
import sqlite3
from typing import List, Optional, Dict
from contextlib import contextmanager
from app.config import get_settings

settings = get_settings()


class Database:
    """Classe pour gérer les opérations de base de données"""

    def __init__(self, db_name: str = None):
        self.db_name = db_name or settings.database_url
        self.init_db()

    @contextmanager
    def get_connection(self):
        """Context manager pour les connexions à la base de données"""
        conn = sqlite3.connect(self.db_name)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()

    def init_db(self):
        """Initialise la base de données"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS mesures (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    annee INTEGER NOT NULL,
                    mois INTEGER NOT NULL,
                    leucocytes REAL NOT NULL,
                    neutrophiles REAL NOT NULL,
                    eosinophiles REAL NOT NULL,
                    lymphocytes REAL NOT NULL,
                    date_saisie TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(annee, mois)
                )
            ''')

    def get_all_mesures(self, annee: int = None, mois: int = None) -> List[Dict]:
        """Récupère toutes les mesures avec filtres optionnels"""
        with self.get_connection() as conn:
            cursor = conn.cursor()

            query = """
                SELECT id, annee, mois, leucocytes, neutrophiles, eosinophiles,
                       lymphocytes, date_saisie
                FROM mesures
            """
            params = []

            # Ajouter filtres si fournis
            conditions = []
            if annee is not None:
                conditions.append("annee = ?")
                params.append(annee)
            if mois is not None:
                conditions.append("mois = ?")
                params.append(mois)

            if conditions:
                query += " WHERE " + " AND ".join(conditions)

            query += " ORDER BY annee, mois"

            cursor.execute(query, params)
            rows = cursor.fetchall()
            return [dict(row) for row in rows]

    def get_mesure_by_id(self, mesure_id: int) -> Optional[Dict]:
        """Récupère une mesure par ID"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, annee, mois, leucocytes, neutrophiles, eosinophiles,
                       lymphocytes, date_saisie
                FROM mesures
                WHERE id = ?
            """, (mesure_id,))
            row = cursor.fetchone()
            return dict(row) if row else None

    def get_mesure_by_annee_mois(self, annee: int, mois: int) -> Optional[Dict]:
        """Récupère une mesure par année et mois"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, annee, mois, leucocytes, neutrophiles, eosinophiles,
                       lymphocytes, date_saisie
                FROM mesures
                WHERE annee = ? AND mois = ?
            """, (annee, mois))
            row = cursor.fetchone()
            return dict(row) if row else None

    def create_mesure(self, annee: int, mois: int, leucocytes: float, neutrophiles: float,
                      eosinophiles: float, lymphocytes: float) -> Optional[Dict]:
        """Crée une nouvelle mesure"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO mesures (annee, mois, leucocytes, neutrophiles, eosinophiles, lymphocytes)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (annee, mois, leucocytes, neutrophiles, eosinophiles, lymphocytes))

        return self.get_mesure_by_annee_mois(annee, mois)

    def update_mesure(self, mesure_id: int, annee: int = None, mois: int = None,
                     leucocytes: float = None, neutrophiles: float = None,
                     eosinophiles: float = None, lymphocytes: float = None) -> Optional[Dict]:
        """Met à jour une mesure existante"""
        # Construire la requête dynamiquement
        updates = []
        params = []

        if annee is not None:
            updates.append("annee = ?")
            params.append(annee)
        if mois is not None:
            updates.append("mois = ?")
            params.append(mois)
        if leucocytes is not None:
            updates.append("leucocytes = ?")
            params.append(leucocytes)
        if neutrophiles is not None:
            updates.append("neutrophiles = ?")
            params.append(neutrophiles)
        if eosinophiles is not None:
            updates.append("eosinophiles = ?")
            params.append(eosinophiles)
        if lymphocytes is not None:
            updates.append("lymphocytes = ?")
            params.append(lymphocytes)

        if not updates:
            return None

        params.append(mesure_id)
        query = f"UPDATE mesures SET {', '.join(updates)} WHERE id = ?"

        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            rowcount = cursor.rowcount

        if rowcount > 0:
            return self.get_mesure_by_id(mesure_id)
        return None

    def delete_mesure(self, mesure_id: int) -> bool:
        """Supprime une mesure par ID"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM mesures WHERE id = ?", (mesure_id,))
            return cursor.rowcount > 0


# Instance globale de la base de données
db = Database()

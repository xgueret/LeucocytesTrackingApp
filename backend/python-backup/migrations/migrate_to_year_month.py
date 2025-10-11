#!/usr/bin/env python3
"""
Migration de la base de données : année seule → année + mois
Migre les anciennes mesures (année) vers le format (année, mois=1)
"""
import sqlite3
import sys
from pathlib import Path

# Chemin vers la base de données
DB_PATH = Path(__file__).parent.parent / "app" / "data" / "leucocytes.db"


def migrate():
    """Effectue la migration de la base de données"""
    print(f"📂 Migration de la base de données : {DB_PATH}")

    if not DB_PATH.exists():
        print(f"❌ Erreur : Base de données introuvable à {DB_PATH}")
        sys.exit(1)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # 1. Vérifier la structure actuelle
        cursor.execute("PRAGMA table_info(mesures)")
        columns = [col[1] for col in cursor.fetchall()]
        print(f"📋 Colonnes actuelles : {columns}")

        # 2. Créer la nouvelle table avec année + mois
        print("🔨 Création de la nouvelle table...")
        cursor.execute("""
            CREATE TABLE mesures_new (
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
        """)

        # 3. Migrer les données existantes (mois=1 par défaut pour janvier)
        print("📦 Migration des données existantes...")
        cursor.execute("""
            INSERT INTO mesures_new (annee, mois, leucocytes, neutrophiles, eosinophiles, lymphocytes, date_saisie)
            SELECT annee, 1 as mois, leucocytes, neutrophiles, eosinophiles, lymphocytes, date_saisie
            FROM mesures
        """)

        rows_migrated = cursor.rowcount
        print(f"✅ {rows_migrated} mesures migrées (mois=1 par défaut)")

        # 4. Supprimer l'ancienne table
        print("🗑️  Suppression de l'ancienne table...")
        cursor.execute("DROP TABLE mesures")

        # 5. Renommer la nouvelle table
        print("✏️  Renommage de la table...")
        cursor.execute("ALTER TABLE mesures_new RENAME TO mesures")

        # 6. Vérifier le résultat
        cursor.execute("SELECT COUNT(*) FROM mesures")
        total = cursor.fetchone()[0]

        cursor.execute("PRAGMA table_info(mesures)")
        new_columns = [col[1] for col in cursor.fetchall()]

        print(f"\n✅ Migration terminée avec succès !")
        print(f"   - Nouvelles colonnes : {new_columns}")
        print(f"   - Total de mesures : {total}")
        print(f"   - Contrainte d'unicité : (annee, mois)")

        # Commit des changements
        conn.commit()

    except Exception as e:
        print(f"\n❌ Erreur lors de la migration : {e}")
        conn.rollback()
        sys.exit(1)

    finally:
        conn.close()

    print("\n🎉 Base de données migrée avec succès !")
    print("ℹ️  Les anciennes mesures ont été assignées au mois de janvier (mois=1)")


if __name__ == "__main__":
    migrate()

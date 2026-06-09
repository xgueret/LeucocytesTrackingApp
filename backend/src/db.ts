import Database from 'better-sqlite3';
import { initAuth, createUser, userExists, setUserRole } from './auth';
import { config } from './config';

/**
 * Crée les tables et index nécessaires et initialise le module d'authentification.
 */
export function setupSchema(db: Database.Database): void {
  db.exec(`
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
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS share_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMP NOT NULL,
      created_by TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Index pour accélérer les requêtes fréquentes
  db.exec('CREATE INDEX IF NOT EXISTS idx_mesures_annee_mois ON mesures(annee, mois)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_share_links_expires_at ON share_links(expires_at)');

  // Initialise le module d'authentification (crée la table users + migration role)
  initAuth(db);

  console.log('✅ Base de données initialisée');
}

/**
 * Crée le compte administrateur à partir des variables d'environnement
 * ou garantit son rôle admin s'il existe déjà.
 */
export async function bootstrapAdmin(): Promise<void> {
  if (!userExists(config.adminUsername)) {
    await createUser(config.adminUsername, config.adminPassword, 'admin');
    console.log(`👤 Utilisateur admin "${config.adminUsername}" créé`);
  } else {
    setUserRole(config.adminUsername, 'admin');
    console.log(`👤 Utilisateur admin "${config.adminUsername}" déjà existant`);
  }
}

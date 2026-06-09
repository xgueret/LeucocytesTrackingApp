import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const REQUIRED_ENV = ['SECRET_KEY', 'ADMIN_USERNAME', 'ADMIN_PASSWORD'];

/**
 * Vérifie la présence des variables d'environnement obligatoires.
 * Termine le processus si l'une d'elles manque (appelé uniquement au démarrage du serveur).
 */
export function validateEnv(): void {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`❌ Variables d'environnement manquantes : ${missing.join(', ')}`);
    console.error('   Voir backend/.env.example pour la configuration requise.');
    process.exit(1);
  }
}

export const config = {
  port: process.env.PORT || 8081,
  databaseUrl: process.env.DATABASE_URL || path.join(__dirname, '..', 'app', 'data', 'leucocytes.db'),
  corsOrigins: process.env.CORS_ORIGINS?.split(',').map((origin) => origin.trim()) || [
    'http://localhost:3000',
    'http://localhost:5173',
  ],
  adminUsername: process.env.ADMIN_USERNAME || '',
  adminPassword: process.env.ADMIN_PASSWORD || '',
  adminPin: process.env.ADMIN_PIN || '',
};

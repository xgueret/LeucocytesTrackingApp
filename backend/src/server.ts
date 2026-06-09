import Database from 'better-sqlite3';
import { validateEnv, config } from './config';
import { setupSchema, bootstrapAdmin } from './db';
import { createApp } from './app';

// Vérifier les variables d'environnement obligatoires avant tout
validateEnv();

// Initialisation de la base de données SQLite
const db = new Database(config.databaseUrl);
db.pragma('journal_mode = WAL'); // Optimisation pour les performances

// Gestion de la fermeture propre
const gracefulShutdown = () => {
  console.log('\n🛑 Arrêt du serveur...');
  db.close();
  console.log('✅ Base de données fermée');
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Démarrage du serveur (après initialisation de la base)
const startServer = async () => {
  try {
    setupSchema(db);
    await bootstrapAdmin();
  } catch (error) {
    console.error('❌ Échec de l\'initialisation de la base de données:', error);
    process.exit(1);
  }

  const app = createApp(db);

  app.listen(config.port, () => {
    console.log('🚀 Serveur API démarré');
    console.log(`📚 Documentation: http://localhost:${config.port}/docs`);
    console.log(`🔧 API disponible: http://localhost:${config.port}/api`);
    console.log(`💾 Base de données: ${config.databaseUrl}`);
    console.log(`🌐 CORS activé pour: ${config.corsOrigins.join(', ')}`);
  });
};

startServer();

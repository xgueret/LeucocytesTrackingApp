import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { z } from 'zod';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { swaggerDocument } from './swagger';
import path from 'path';

// Charger les variables d'environnement
dotenv.config();

// Configuration
const PORT = process.env.PORT || 8081;
const DATABASE_URL = process.env.DATABASE_URL || path.join(__dirname, '..', 'app', 'data', 'leucocytes.db');
const CORS_ORIGINS = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'];

// Initialisation Express
const app = express();
app.use(express.json());
app.use(cors({
  origin: CORS_ORIGINS,
  credentials: true
}));

// Initialisation de la base de données SQLite
const db = new Database(DATABASE_URL);
db.pragma('journal_mode = WAL'); // Optimisation pour les performances

// Création du schéma si nécessaire
const initDb = () => {
  const createTableQuery = `
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
  `;
  db.exec(createTableQuery);
  console.log('✅ Base de données initialisée');
};

initDb();

// Schémas de validation Zod
const MesureSchema = z.object({
  annee: z.number().int().min(1997).max(2100),
  mois: z.number().int().min(1).max(12),
  leucocytes: z.number().positive(),
  neutrophiles: z.number().nonnegative(),
  eosinophiles: z.number().nonnegative(),
  lymphocytes: z.number().nonnegative()
});

const MesureUpdateSchema = z.object({
  annee: z.number().int().min(1997).max(2100).optional(),
  mois: z.number().int().min(1).max(12).optional(),
  leucocytes: z.number().positive().optional(),
  neutrophiles: z.number().nonnegative().optional(),
  eosinophiles: z.number().nonnegative().optional(),
  lymphocytes: z.number().nonnegative().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: "Au moins un champ doit être fourni pour la mise à jour"
});

// Middleware pour gérer les erreurs Zod
const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Erreur de validation',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }))
        });
      } else {
        next(error);
      }
    }
  };
};

// Documentation Swagger sur /docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes API

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// GET /api/mesures - Liste toutes les mesures avec filtres optionnels
app.get('/api/mesures', (req: Request, res: Response) => {
  try {
    const { annee, mois } = req.query;

    let query = `
      SELECT id, annee, mois, leucocytes, neutrophiles, eosinophiles,
             lymphocytes, date_saisie
      FROM mesures
    `;

    const conditions: string[] = [];
    const params: any[] = [];

    if (annee) {
      conditions.push('annee = ?');
      params.push(parseInt(annee as string));
    }

    if (mois) {
      conditions.push('mois = ?');
      params.push(parseInt(mois as string));
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY annee, mois';

    const stmt = db.prepare(query);
    const mesures = stmt.all(...params);

    res.json(mesures);
  } catch (error) {
    console.error('Erreur lors de la récupération des mesures:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/mesures/stats/summary - Statistiques
// Note: Cette route doit être AVANT /api/mesures/:id pour éviter que "stats" soit interprété comme un ID
app.get('/api/mesures/stats/summary', (req: Request, res: Response) => {
  try {
    const mesures = db.prepare(`
      SELECT annee, leucocytes
      FROM mesures
      ORDER BY annee, mois
    `).all() as Array<{ annee: number; leucocytes: number }>;

    if (mesures.length === 0) {
      return res.json({
        total_mesures: 0,
        annee_debut: null,
        annee_fin: null,
        leucocytes: null
      });
    }

    const leucocytesValues = mesures.map(m => m.leucocytes);
    const moyenne = leucocytesValues.reduce((a, b) => a + b, 0) / leucocytesValues.length;
    const min = Math.min(...leucocytesValues);
    const max = Math.max(...leucocytesValues);

    res.json({
      total_mesures: mesures.length,
      annee_debut: mesures[0].annee,
      annee_fin: mesures[mesures.length - 1].annee,
      leucocytes: {
        moyenne,
        min,
        max
      }
    });
  } catch (error) {
    console.error('Erreur lors du calcul des statistiques:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/mesures - Crée une nouvelle mesure
app.post('/api/mesures', validateRequest(MesureSchema), (req: Request, res: Response) => {
  try {
    const { annee, mois, leucocytes, neutrophiles, eosinophiles, lymphocytes } = req.body;

    const stmt = db.prepare(`
      INSERT INTO mesures (annee, mois, leucocytes, neutrophiles, eosinophiles, lymphocytes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(annee, mois, leucocytes, neutrophiles, eosinophiles, lymphocytes);

    // Récupérer la mesure créée
    const mesure = db.prepare('SELECT * FROM mesures WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json(mesure);
  } catch (error: any) {
    console.error('Erreur lors de la création de la mesure:', error);

    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({
        error: 'Mesure déjà existante',
        detail: `Une mesure existe déjà pour ${req.body.annee}/${String(req.body.mois).padStart(2, '0')}`
      });
    } else {
      res.status(500).json({ error: 'Erreur lors de la création de la mesure' });
    }
  }
});

// GET /api/mesures/:id - Récupère une mesure par ID
app.get('/api/mesures/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const mesure = db.prepare('SELECT * FROM mesures WHERE id = ?').get(id);

    if (!mesure) {
      return res.status(404).json({
        error: 'Mesure non trouvée',
        detail: `Aucune mesure trouvée avec l'ID ${id}`
      });
    }

    res.json(mesure);
  } catch (error) {
    console.error('Erreur lors de la récupération de la mesure:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/mesures/:id - Met à jour une mesure
app.put('/api/mesures/:id', validateRequest(MesureUpdateSchema), (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    // Vérifier que la mesure existe
    const existingMesure = db.prepare('SELECT * FROM mesures WHERE id = ?').get(id);

    if (!existingMesure) {
      return res.status(404).json({
        error: 'Mesure non trouvée',
        detail: `Aucune mesure trouvée avec l'ID ${id}`
      });
    }

    // Construire la requête de mise à jour dynamiquement
    const updates: string[] = [];
    const params: any[] = [];

    const allowedFields = ['annee', 'mois', 'leucocytes', 'neutrophiles', 'eosinophiles', 'lymphocytes'];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(req.body[field]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
    }

    params.push(id);

    const query = `UPDATE mesures SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(query).run(...params);

    // Récupérer la mesure mise à jour
    const updatedMesure = db.prepare('SELECT * FROM mesures WHERE id = ?').get(id);

    res.json(updatedMesure);
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour de la mesure:', error);

    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({
        error: 'Conflit',
        detail: 'Une mesure existe déjà pour cette année et ce mois'
      });
    } else {
      res.status(500).json({ error: 'Erreur lors de la mise à jour' });
    }
  }
});

// DELETE /api/mesures/:id - Supprime une mesure
app.delete('/api/mesures/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const result = db.prepare('DELETE FROM mesures WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({
        error: 'Mesure non trouvée',
        detail: `Aucune mesure trouvée avec l'ID ${id}`
      });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Erreur lors de la suppression de la mesure:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Middleware de gestion des erreurs globales
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Erreur non gérée:', err);
  res.status(500).json({
    error: 'Erreur serveur interne',
    detail: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Gestion de la fermeture propre
const gracefulShutdown = () => {
  console.log('\n🛑 Arrêt du serveur...');
  db.close();
  console.log('✅ Base de données fermée');
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Démarrage du serveur
app.listen(PORT, () => {
  console.log('🚀 Serveur API démarré');
  console.log(`📚 Documentation: http://localhost:${PORT}/docs`);
  console.log(`🔧 API disponible: http://localhost:${PORT}/api`);
  console.log(`💾 Base de données: ${DATABASE_URL}`);
  console.log(`🌐 CORS activé pour: ${CORS_ORIGINS.join(', ')}`);
});

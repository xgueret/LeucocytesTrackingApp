import express, { Request, Response, NextFunction, Express } from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import swaggerUi from 'swagger-ui-express';
import { swaggerDocument } from './swagger';
import { authenticateUser, createAccessToken } from './auth';
import { rateLimit } from './rate-limit';
import { config } from './config';
import { mesuresRouter } from './routes/mesures';
import { shareRouter } from './routes/share';
import { adminRouter } from './routes/admin';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Trop de tentatives de connexion. Réessayez dans quelques minutes.',
});

/**
 * Construit l'application Express à partir d'une instance de base de données.
 * Ne démarre pas le serveur (pas de listen) : utilisable tel quel en test.
 */
export function createApp(db: Database.Database): Express {
  const app = express();

  app.use(express.json());
  app.use(cors({ origin: config.corsOrigins, credentials: true }));

  // Documentation Swagger
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  // Authentification et obtention du JWT
  app.post('/api/token', authLimiter, async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          error: 'Données manquantes',
          detail: 'Le nom d\'utilisateur et le mot de passe sont requis',
        });
      }

      const user = await authenticateUser(username, password);

      if (!user) {
        return res.status(401).json({
          error: 'Identifiants incorrects',
          detail: 'Nom d\'utilisateur ou mot de passe invalide',
        });
      }

      const accessToken = createAccessToken(user.username);

      res.json({ access_token: accessToken, token_type: 'bearer', username: user.username });
    } catch (error) {
      console.error('Erreur lors de l\'authentification:', error);
      res.status(500).json({ error: 'Erreur serveur', detail: 'Erreur lors de l\'authentification' });
    }
  });

  // Routes métier
  app.use('/api/mesures', mesuresRouter(db));
  app.use('/api', shareRouter(db));
  app.use('/api/admin', adminRouter(db));

  // Middleware de gestion des erreurs globales
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Erreur non gérée:', err);
    res.status(500).json({
      error: 'Erreur serveur interne',
      detail: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  });

  return app;
}

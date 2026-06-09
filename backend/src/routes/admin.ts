import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import { requireAuth, requireAdmin, createUser, userExists, getAllUsers, deleteUser } from '../auth';
import { rateLimit } from '../rate-limit';
import { config } from '../config';

const pinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Trop de tentatives de code PIN. Réessayez dans quelques minutes.',
});

/**
 * Routes d'administration, montées sous /api/admin. Réservées aux admins.
 */
export function adminRouter(db: Database.Database): Router {
  const router = Router();

  // POST /verify-pin - Vérifie le code PIN admin côté serveur
  router.post('/verify-pin', pinLimiter, requireAuth, requireAdmin, (req: Request, res: Response) => {
    const { pin } = req.body;

    if (!config.adminPin) {
      return res.status(503).json({
        error: 'PIN non configuré',
        detail: 'Aucun code PIN admin n\'est configuré sur le serveur (ADMIN_PIN).',
      });
    }

    if (typeof pin !== 'string' || pin !== config.adminPin) {
      return res.status(401).json({ error: 'Code PIN incorrect' });
    }

    res.json({ valid: true });
  });

  // GET /users - Liste tous les utilisateurs
  router.get('/users', requireAuth, requireAdmin, (req: Request, res: Response) => {
    try {
      res.json(getAllUsers());
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  // POST /users - Crée un nouvel utilisateur
  router.post('/users', requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { username, password, role } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          error: 'Données manquantes',
          detail: 'Le nom d\'utilisateur et le mot de passe sont requis',
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          error: 'Mot de passe trop court',
          detail: 'Le mot de passe doit contenir au moins 8 caractères',
        });
      }

      const userRole = role === 'admin' ? 'admin' : 'user';
      const user = await createUser(username, password, userRole);

      res.status(201).json({
        id: user.id,
        username: user.username,
        role: user.role,
        created_at: user.created_at,
      });
    } catch (error: any) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);

      if (error.message.includes('existe déjà')) {
        res.status(400).json({ error: 'Utilisateur existant', detail: error.message });
      } else {
        res.status(500).json({ error: 'Erreur serveur' });
      }
    }
  });

  // DELETE /users/:username - Supprime un utilisateur
  router.delete('/users/:username', requireAuth, requireAdmin, (req: Request, res: Response) => {
    try {
      const { username } = req.params;

      if (username === config.adminUsername) {
        return res.status(403).json({
          error: 'Opération interdite',
          detail: 'Impossible de supprimer l\'utilisateur admin principal',
        });
      }

      if (!userExists(username)) {
        return res.status(404).json({
          error: 'Utilisateur non trouvé',
          detail: `L'utilisateur "${username}" n'existe pas`,
        });
      }

      deleteUser(username);
      res.status(204).send();
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  return router;
}

import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import crypto from 'crypto';
import { requireAuth, AuthenticatedRequest } from '../auth';

/**
 * Routes des liens de partage éphémères, montées sous /api.
 * La gestion (création/liste/révocation) requiert un utilisateur authentifié ;
 * l'accès aux données partagées est public via le token.
 */
export function shareRouter(db: Database.Database): Router {
  const router = Router();

  // POST /share-links - Génère un lien éphémère (admin)
  router.post('/share-links', requireAuth, (req: Request, res: Response) => {
    try {
      const { hours = 24 } = req.body;
      const username = (req as AuthenticatedRequest).user?.username || 'unknown';

      const duration = Math.min(Math.max(hours, 1), 24);
      const token = crypto.randomBytes(32).toString('hex');

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + duration);

      db.prepare(
        `
        INSERT INTO share_links (token, expires_at, created_by)
        VALUES (?, ?, ?)
      `
      ).run(token, expiresAt.toISOString(), username);

      res.status(201).json({
        token,
        expires_at: expiresAt.toISOString(),
        duration_hours: duration,
        url: `${req.protocol}://${req.get('host')}/share/${token}`,
      });
    } catch (error) {
      console.error('Erreur lors de la création du lien éphémère:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  // GET /share-links - Liste tous les liens actifs (admin)
  router.get('/share-links', requireAuth, (req: Request, res: Response) => {
    try {
      const now = new Date().toISOString();

      db.prepare('DELETE FROM share_links WHERE expires_at < ?').run(now);

      const links = db
        .prepare(
          `
        SELECT id, token, expires_at, created_by, created_at
        FROM share_links
        WHERE expires_at > ?
        ORDER BY created_at DESC
      `
        )
        .all(now);

      res.json(links);
    } catch (error) {
      console.error('Erreur lors de la récupération des liens:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  // DELETE /share-links/:token - Révoque un lien (admin)
  router.delete('/share-links/:token', requireAuth, (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const result = db.prepare('DELETE FROM share_links WHERE token = ?').run(token);

      if (result.changes === 0) {
        return res.status(404).json({ error: 'Lien non trouvé' });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Erreur lors de la révocation du lien:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  // GET /share/:token/mesures - Accès public aux données via lien éphémère
  router.get('/share/:token/mesures', (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const now = new Date().toISOString();

      const link = db
        .prepare(
          `
        SELECT * FROM share_links
        WHERE token = ? AND expires_at > ?
      `
        )
        .get(token, now);

      if (!link) {
        return res.status(401).json({
          error: 'Lien invalide ou expiré',
          detail: 'Ce lien de partage n\'est plus valide',
        });
      }

      const mesures = db
        .prepare(
          `
        SELECT id, annee, mois, leucocytes, neutrophiles, eosinophiles,
               lymphocytes, date_saisie
        FROM mesures
        ORDER BY annee, mois
      `
        )
        .all();

      res.json(mesures);
    } catch (error) {
      console.error('Erreur lors de l\'accès aux données partagées:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  return router;
}

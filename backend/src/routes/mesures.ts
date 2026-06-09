import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import { requireAuth } from '../auth';
import { validateRequest, MesureSchema, MesureUpdateSchema } from '../validation';

/**
 * Routes CRUD des mesures, montées sous /api/mesures.
 */
export function mesuresRouter(db: Database.Database): Router {
  const router = Router();

  // GET / - Liste toutes les mesures avec filtres optionnels
  router.get('/', requireAuth, (req: Request, res: Response) => {
    try {
      const { annee, mois } = req.query;

      let query = `
        SELECT id, annee, mois, leucocytes, neutrophiles, eosinophiles,
               lymphocytes, date_saisie
        FROM mesures
      `;

      const conditions: string[] = [];
      const params: (number | string)[] = [];

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

  // GET /stats/summary - Statistiques (doit être avant /:id)
  router.get('/stats/summary', requireAuth, (req: Request, res: Response) => {
    try {
      const stats = db
        .prepare(
          `
        SELECT
          COUNT(*) AS total_mesures,
          MIN(annee) AS annee_debut,
          MAX(annee) AS annee_fin,
          AVG(leucocytes) AS moyenne,
          MIN(leucocytes) AS min,
          MAX(leucocytes) AS max
        FROM mesures
      `
        )
        .get() as {
        total_mesures: number;
        annee_debut: number | null;
        annee_fin: number | null;
        moyenne: number | null;
        min: number | null;
        max: number | null;
      };

      if (stats.total_mesures === 0) {
        return res.json({
          total_mesures: 0,
          annee_debut: null,
          annee_fin: null,
          leucocytes: null,
        });
      }

      res.json({
        total_mesures: stats.total_mesures,
        annee_debut: stats.annee_debut,
        annee_fin: stats.annee_fin,
        leucocytes: {
          moyenne: stats.moyenne,
          min: stats.min,
          max: stats.max,
        },
      });
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  // POST / - Crée une nouvelle mesure
  router.post('/', requireAuth, validateRequest(MesureSchema), (req: Request, res: Response) => {
    try {
      const { annee, mois, leucocytes, neutrophiles, eosinophiles, lymphocytes } = req.body;

      const stmt = db.prepare(`
        INSERT INTO mesures (annee, mois, leucocytes, neutrophiles, eosinophiles, lymphocytes)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(annee, mois, leucocytes, neutrophiles, eosinophiles, lymphocytes);
      const mesure = db.prepare('SELECT * FROM mesures WHERE id = ?').get(result.lastInsertRowid);

      res.status(201).json(mesure);
    } catch (error: any) {
      console.error('Erreur lors de la création de la mesure:', error);

      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.message.includes('UNIQUE constraint failed')) {
        res.status(400).json({
          error: 'Mesure déjà existante',
          detail: `Une mesure existe déjà pour ${req.body.annee}/${String(req.body.mois).padStart(2, '0')}`,
        });
      } else {
        res.status(500).json({ error: 'Erreur lors de la création de la mesure' });
      }
    }
  });

  // GET /:id - Récupère une mesure par ID
  router.get('/:id', requireAuth, (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID invalide' });
      }

      const mesure = db.prepare('SELECT * FROM mesures WHERE id = ?').get(id);

      if (!mesure) {
        return res.status(404).json({
          error: 'Mesure non trouvée',
          detail: `Aucune mesure trouvée avec l'ID ${id}`,
        });
      }

      res.json(mesure);
    } catch (error) {
      console.error('Erreur lors de la récupération de la mesure:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  // PUT /:id - Met à jour une mesure
  router.put('/:id', requireAuth, validateRequest(MesureUpdateSchema), (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID invalide' });
      }

      const existingMesure = db.prepare('SELECT * FROM mesures WHERE id = ?').get(id);

      if (!existingMesure) {
        return res.status(404).json({
          error: 'Mesure non trouvée',
          detail: `Aucune mesure trouvée avec l'ID ${id}`,
        });
      }

      const updates: string[] = [];
      const params: (number | string)[] = [];
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

      const updatedMesure = db.prepare('SELECT * FROM mesures WHERE id = ?').get(id);

      res.json(updatedMesure);
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour de la mesure:', error);

      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.message.includes('UNIQUE constraint failed')) {
        res.status(400).json({
          error: 'Conflit',
          detail: 'Une mesure existe déjà pour cette année et ce mois',
        });
      } else {
        res.status(500).json({ error: 'Erreur lors de la mise à jour' });
      }
    }
  });

  // DELETE /:id - Supprime une mesure
  router.delete('/:id', requireAuth, (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID invalide' });
      }

      const result = db.prepare('DELETE FROM mesures WHERE id = ?').run(id);

      if (result.changes === 0) {
        return res.status(404).json({
          error: 'Mesure non trouvée',
          detail: `Aucune mesure trouvée avec l'ID ${id}`,
        });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Erreur lors de la suppression de la mesure:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  return router;
}

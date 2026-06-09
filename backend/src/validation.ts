import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Schémas de validation Zod
export const MesureSchema = z.object({
  annee: z.number().int().min(1997).max(2100),
  mois: z.number().int().min(1).max(12),
  leucocytes: z.number().positive(),
  neutrophiles: z.number().nonnegative(),
  eosinophiles: z.number().nonnegative(),
  lymphocytes: z.number().nonnegative(),
});

export const MesureUpdateSchema = z
  .object({
    annee: z.number().int().min(1997).max(2100).optional(),
    mois: z.number().int().min(1).max(12).optional(),
    leucocytes: z.number().positive().optional(),
    neutrophiles: z.number().nonnegative().optional(),
    eosinophiles: z.number().nonnegative().optional(),
    lymphocytes: z.number().nonnegative().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Au moins un champ doit être fourni pour la mise à jour',
  });

// Middleware pour valider le corps de la requête avec un schéma Zod
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Erreur de validation',
          details: error.errors.map((err) => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        });
      } else {
        next(error);
      }
    }
  };
};

import { Request, Response, NextFunction } from 'express';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
}

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Limiteur de débit en mémoire, par adresse IP.
 *
 * Adapté à un déploiement mono-instance (SQLite). Pour un déploiement
 * multi-instances, remplacer par express-rate-limit avec un store partagé (Redis).
 */
export function rateLimit(options: RateLimitOptions) {
  const { windowMs, max, message = 'Trop de requêtes, réessayez plus tard.' } = options;
  const buckets = new Map<string, Bucket>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const key = req.ip || req.socket.remoteAddress || 'unknown';

    let bucket = buckets.get(key);

    if (!bucket || now > bucket.resetAt) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;

    if (bucket.count > max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      res.status(429).json({ error: 'Trop de tentatives', detail: message });
      return;
    }

    next();
  };
}

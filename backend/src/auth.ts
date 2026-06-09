import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import Database from 'better-sqlite3';

// Secret key pour JWT (obligatoire, définie dans .env)
const SECRET_KEY = process.env.SECRET_KEY;
const TOKEN_EXPIRATION = process.env.TOKEN_EXPIRATION || '30m'; // Token expire après 30 minutes
const BCRYPT_ROUNDS = 12;

/**
 * Retourne la clé secrète JWT ou lève une erreur si elle n'est pas configurée.
 * Validation paresseuse pour ne pas casser les outils CLI qui n'émettent pas de token.
 */
function getSecretKey(): string {
  if (!SECRET_KEY) {
    throw new Error(
      'SECRET_KEY environment variable is required. Generate one with: openssl rand -hex 32'
    );
  }
  return SECRET_KEY;
}

// Interface pour le payload JWT
export interface JWTPayload {
  username: string;
  iat?: number;
  exp?: number;
}

// Interface pour l'utilisateur
export interface User {
  id?: number;
  username: string;
  hashed_password: string;
  role?: string;
  created_at?: string;
}

// Requête Express enrichie avec l'utilisateur authentifié
export interface AuthenticatedRequest extends Request {
  user?: { username: string; role: string };
}

// Instance de la base de données (injectée depuis server.ts)
let dbInstance: Database.Database | null = null;

/**
 * Initialise le module auth avec une instance de base de données
 */
export function initAuth(db: Database.Database): void {
  dbInstance = db;

  // Créer la table users si elle n'existe pas
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      hashed_password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migration : ajouter la colonne role aux bases existantes
  const columns = db.prepare('PRAGMA table_info(users)').all() as Array<{ name: string }>;
  if (!columns.some((column) => column.name === 'role')) {
    db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'");
  }

  console.log('✅ Table users initialisée');
}

/**
 * Hash un mot de passe avec bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
  return bcrypt.hash(password, salt);
}

/**
 * Vérifie un mot de passe contre son hash
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Crée un access token JWT
 */
export function createAccessToken(username: string): string {
  const payload: JWTPayload = { username };
  const options: jwt.SignOptions = { expiresIn: TOKEN_EXPIRATION as jwt.SignOptions['expiresIn'] };
  return jwt.sign(payload, getSecretKey(), options);
}

/**
 * Vérifie et décode un token JWT
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, getSecretKey()) as JWTPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Authentifie un utilisateur avec username/password
 */
export async function authenticateUser(username: string, password: string): Promise<User | null> {
  if (!dbInstance) {
    throw new Error('Auth module not initialized. Call initAuth() first.');
  }

  // Récupérer l'utilisateur depuis la base de données
  const user = dbInstance.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined;

  if (!user) {
    return null;
  }

  const isValidPassword = await verifyPassword(password, user.hashed_password);

  if (!isValidPassword) {
    return null;
  }

  return user;
}

/**
 * Middleware Express pour protéger les routes
 * Vérifie la présence et la validité du token JWT dans le header Authorization
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    // Récupérer le token depuis le header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Non authentifié',
        detail: 'Token manquant. Veuillez vous connecter.'
      });
      return;
    }

    // Extraire le token (format: "Bearer TOKEN")
    const token = authHeader.substring(7);

    // Vérifier le token
    const payload = verifyToken(token);

    if (!payload) {
      res.status(401).json({
        error: 'Non authentifié',
        detail: 'Token invalide ou expiré. Veuillez vous reconnecter.'
      });
      return;
    }

    // Recharger l'utilisateur depuis la base : invalide les tokens d'utilisateurs supprimés
    // et garantit que le rôle attaché est à jour.
    const user = dbInstance
      ?.prepare('SELECT username, role FROM users WHERE username = ?')
      .get(payload.username) as { username: string; role: string } | undefined;

    if (!user) {
      res.status(401).json({
        error: 'Non authentifié',
        detail: 'Compte introuvable. Veuillez vous reconnecter.'
      });
      return;
    }

    // Attacher l'utilisateur à la requête pour les middlewares suivants
    (req as AuthenticatedRequest).user = { username: user.username, role: user.role || 'user' };

    next();
  } catch (error) {
    console.error('Erreur dans requireAuth:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      detail: 'Erreur lors de la vérification de l\'authentification'
    });
  }
}

/**
 * Middleware Express exigeant le rôle administrateur.
 * Doit être placé après requireAuth.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const user = (req as AuthenticatedRequest).user;

  if (!user || user.role !== 'admin') {
    res.status(403).json({
      error: 'Accès refusé',
      detail: 'Droits administrateur requis pour cette opération.'
    });
    return;
  }

  next();
}

/**
 * Crée un nouvel utilisateur dans la base de données
 */
export async function createUser(
  username: string,
  password: string,
  role: string = 'user'
): Promise<User> {
  if (!dbInstance) {
    throw new Error('Auth module not initialized. Call initAuth() first.');
  }

  const hashedPassword = await hashPassword(password);

  try {
    const stmt = dbInstance.prepare(`
      INSERT INTO users (username, hashed_password, role)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(username, hashedPassword, role);

    const user = dbInstance.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid) as User;

    return user;
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.message.includes('UNIQUE constraint failed')) {
      throw new Error(`L'utilisateur "${username}" existe déjà`);
    }
    throw error;
  }
}

/**
 * Récupère tous les utilisateurs (sans les mots de passe)
 */
export function getAllUsers(): Omit<User, 'hashed_password'>[] {
  if (!dbInstance) {
    throw new Error('Auth module not initialized. Call initAuth() first.');
  }

  const users = dbInstance.prepare('SELECT id, username, role, created_at FROM users ORDER BY created_at DESC').all() as User[];
  return users;
}

/**
 * Supprime un utilisateur par username
 */
export function deleteUser(username: string): boolean {
  if (!dbInstance) {
    throw new Error('Auth module not initialized. Call initAuth() first.');
  }

  const result = dbInstance.prepare('DELETE FROM users WHERE username = ?').run(username);
  return result.changes > 0;
}

/**
 * Met à jour le rôle d'un utilisateur
 */
export function setUserRole(username: string, role: string): boolean {
  if (!dbInstance) {
    throw new Error('Auth module not initialized. Call initAuth() first.');
  }

  const result = dbInstance.prepare('UPDATE users SET role = ? WHERE username = ?').run(role, username);
  return result.changes > 0;
}

/**
 * Vérifie si un utilisateur existe
 */
export function userExists(username: string): boolean {
  if (!dbInstance) {
    throw new Error('Auth module not initialized. Call initAuth() first.');
  }

  const user = dbInstance.prepare('SELECT 1 FROM users WHERE username = ?').get(username);
  return !!user;
}

import { describe, it, expect, beforeAll } from 'vitest';
import Database from 'better-sqlite3';
import {
  initAuth,
  hashPassword,
  verifyPassword,
  createAccessToken,
  verifyToken,
  createUser,
  userExists,
  setUserRole,
  getAllUsers,
  deleteUser,
} from '../src/auth';

describe('auth', () => {
  beforeAll(() => {
    const db = new Database(':memory:');
    initAuth(db);
  });

  it('hache et vérifie un mot de passe', async () => {
    const hash = await hashPassword('secret123');
    expect(hash).not.toBe('secret123');
    expect(await verifyPassword('secret123', hash)).toBe(true);
    expect(await verifyPassword('mauvais', hash)).toBe(false);
  });

  it('signe et vérifie un JWT', () => {
    const token = createAccessToken('alice');
    expect(verifyToken(token)?.username).toBe('alice');
    expect(verifyToken('jeton.invalide')).toBeNull();
  });

  it('crée un utilisateur avec le rôle user par défaut', async () => {
    const user = await createUser('bob', 'password1');
    expect(user.role).toBe('user');
    expect(userExists('bob')).toBe(true);
  });

  it('crée un admin et permet de changer son rôle', async () => {
    await createUser('carol', 'password1', 'admin');
    expect(getAllUsers().find((u) => u.username === 'carol')?.role).toBe('admin');

    setUserRole('carol', 'user');
    expect(getAllUsers().find((u) => u.username === 'carol')?.role).toBe('user');
  });

  it('refuse un username en double', async () => {
    await createUser('dave', 'password1');
    await expect(createUser('dave', 'password2')).rejects.toThrow(/existe déjà/);
  });

  it('supprime un utilisateur', async () => {
    await createUser('erin', 'password1');
    expect(deleteUser('erin')).toBe(true);
    expect(userExists('erin')).toBe(false);
  });
});

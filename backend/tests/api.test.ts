import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import Database from 'better-sqlite3';
import { setupSchema } from '../src/db';
import { createUser } from '../src/auth';
import { createApp } from '../src/app';

const MESURE = {
  annee: 2020,
  mois: 5,
  leucocytes: 7000,
  neutrophiles: 4000,
  eosinophiles: 200,
  lymphocytes: 2000,
};

describe('API', () => {
  let app: ReturnType<typeof createApp>;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    const db = new Database(':memory:');
    setupSchema(db);
    await createUser('admin', 'TestAdmin123!', 'admin');
    await createUser('bob', 'BobPass123', 'user');
    app = createApp(db);

    const adminLogin = await request(app).post('/api/token').send({ username: 'admin', password: 'TestAdmin123!' });
    adminToken = adminLogin.body.access_token;
    const userLogin = await request(app).post('/api/token').send({ username: 'bob', password: 'BobPass123' });
    userToken = userLogin.body.access_token;
  });

  it('répond au health check', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  it('refuse un mauvais mot de passe', async () => {
    const res = await request(app).post('/api/token').send({ username: 'admin', password: 'nope' });
    expect(res.status).toBe(401);
  });

  it('protège /api/mesures sans token', async () => {
    expect((await request(app).get('/api/mesures')).status).toBe(401);
  });

  it('crée puis liste une mesure', async () => {
    const create = await request(app).post('/api/mesures').set('Authorization', `Bearer ${userToken}`).send(MESURE);
    expect(create.status).toBe(201);

    const list = await request(app).get('/api/mesures').set('Authorization', `Bearer ${userToken}`);
    expect(list.status).toBe(200);
    expect(list.body.length).toBe(1);
  });

  it('refuse une mesure en double (409/400)', async () => {
    const res = await request(app).post('/api/mesures').set('Authorization', `Bearer ${userToken}`).send(MESURE);
    expect(res.status).toBe(400);
  });

  it('rejette une mesure invalide (validation Zod)', async () => {
    const res = await request(app)
      .post('/api/mesures')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ ...MESURE, mois: 13, leucocytes: -5 });
    expect(res.status).toBe(400);
  });

  it('RBAC : un utilisateur normal est interdit sur /api/admin/users', async () => {
    const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it('RBAC : un admin accède à /api/admin/users', async () => {
    const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  it('vérifie le PIN admin côté serveur', async () => {
    const ok = await request(app).post('/api/admin/verify-pin').set('Authorization', `Bearer ${adminToken}`).send({ pin: '4242' });
    expect(ok.status).toBe(200);
    const ko = await request(app).post('/api/admin/verify-pin').set('Authorization', `Bearer ${adminToken}`).send({ pin: '0000' });
    expect(ko.status).toBe(401);
  });

  it('calcule les statistiques', async () => {
    const res = await request(app).get('/api/mesures/stats/summary').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.total_mesures).toBe(1);
  });

  it('un admin crée un lien de partage accessible publiquement', async () => {
    const link = await request(app).post('/api/share-links').set('Authorization', `Bearer ${adminToken}`).send({ hours: 1 });
    expect(link.status).toBe(201);

    const pub = await request(app).get(`/api/share/${link.body.token}/mesures`);
    expect(pub.status).toBe(200);
    expect(pub.body.length).toBe(1);
  });

  it('interdit la création de lien de partage à un utilisateur normal', async () => {
    const res = await request(app).post('/api/share-links').set('Authorization', `Bearer ${userToken}`).send({ hours: 1 });
    expect(res.status).toBe(403);
  });
});

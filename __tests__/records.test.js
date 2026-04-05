require('./setup');
const request = require('supertest');
const app = require('../src/app');

const AUTH = '/api/auth';
const BASE = '/api/records';

const getToken = async (role = 'ADMIN') => {
  const email = `${role.toLowerCase()}-${Date.now()}@test.com`;
  const res = await request(app)
    .post(`${AUTH}/register`)
    .send({ name: `${role} User`, email, password: 'pass123', role });
  return res.body.data.token;
};

const recordPayload = (overrides = {}) => ({
  amount: 1000,
  type: 'INCOME',
  category: 'Salary',
  date: new Date().toISOString(),
  description: 'Test record',
  ...overrides,
});

describe('Records — POST /api/records', () => {
  it('ANALYST can create a record', async () => {
    const token = await getToken('ANALYST');
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send(recordPayload());

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe(1000);
    expect(res.body.data.createdBy).toBeDefined();
  });

  it('VIEWER cannot create a record (403)', async () => {
    const token = await getToken('VIEWER');
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send(recordPayload());

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 on invalid payload', async () => {
    const token = await getToken('ADMIN');
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: -50, type: 'INCOME', category: 'Salary', date: new Date().toISOString() });

    expect(res.status).toBe(400);
    expect(res.body.error.details).toBeDefined();
  });
});

describe('Records — GET /api/records', () => {
  let token;

  beforeEach(async () => {
    token = await getToken('ADMIN');
    // Seed 5 INCOME + 3 EXPENSE records
    await Promise.all([
      ...Array(5).fill(null).map(() =>
        request(app).post(BASE).set('Authorization', `Bearer ${token}`)
          .send(recordPayload({ type: 'INCOME', category: 'Salary', amount: 1000 }))
      ),
      ...Array(3).fill(null).map(() =>
        request(app).post(BASE).set('Authorization', `Bearer ${token}`)
          .send(recordPayload({ type: 'EXPENSE', category: 'Rent', amount: 500 }))
      ),
    ]);
  });

  it('returns all records with correct meta', async () => {
    const res = await request(app)
      .get(BASE)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.records).toHaveLength(8);
    expect(res.body.meta.total).toBe(8);
    expect(res.body.meta.page).toBe(1);
  });

  it('filters by type', async () => {
    const res = await request(app)
      .get(`${BASE}?type=INCOME`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.records).toHaveLength(5);
    expect(res.body.records.every((r) => r.type === 'INCOME')).toBe(true);
  });

  it('filters by category (case-insensitive)', async () => {
    const res = await request(app)
      .get(`${BASE}?category=rent`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.records).toHaveLength(3);
  });

  it('pagination returns correct meta', async () => {
    const res = await request(app)
      .get(`${BASE}?page=1&limit=3`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.records).toHaveLength(3);
    expect(res.body.meta.total).toBe(8);
    expect(res.body.meta.totalPages).toBe(3);
    expect(res.body.meta.limit).toBe(3);
  });
});

describe('Records — GET /api/records/:id', () => {
  it('returns 400 for invalid ObjectId format', async () => {
    const token = await getToken('VIEWER');
    const res = await request(app)
      .get(`${BASE}/not-a-valid-id`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it('returns 404 for valid but non-existent ID', async () => {
    const token = await getToken('VIEWER');
    const res = await request(app)
      .get(`${BASE}/000000000000000000000001`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

describe('Records — DELETE /api/records/:id (soft delete)', () => {
  it('soft-deletes a record; subsequent GET returns 404', async () => {
    const token = await getToken('ADMIN');

    const create = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send(recordPayload());
    const id = create.body.data._id;

    const del = await request(app)
      .delete(`${BASE}/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);

    const get = await request(app)
      .get(`${BASE}/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(get.status).toBe(404);
  });

  it('soft-deleted records are excluded from list', async () => {
    const token = await getToken('ADMIN');

    const create = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send(recordPayload());
    const id = create.body.data._id;

    await request(app)
      .delete(`${BASE}/${id}`)
      .set('Authorization', `Bearer ${token}`);

    const list = await request(app)
      .get(BASE)
      .set('Authorization', `Bearer ${token}`);
    expect(list.body.records.find((r) => r._id === id)).toBeUndefined();
  });
});

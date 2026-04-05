require('./setup');
const request = require('supertest');
const User = require('../src/models/user.model');
const app = require('../src/app');

const BASE = '/api/auth';

const registerPayload = (overrides = {}) => ({
  name: 'Test User',
  email: 'test@example.com',
  password: 'pass123',
  role: 'VIEWER',
  ...overrides,
});

describe('Auth — POST /api/auth/register', () => {
  it('registers a new user and returns token + user (no password)', async () => {
    const res = await request(app).post(`${BASE}/register`).send(registerPayload());

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('test@example.com');
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('returns 409 on duplicate email', async () => {
    const payload = registerPayload();
    await request(app).post(`${BASE}/register`).send(payload);
    const res = await request(app).post(`${BASE}/register`).send(payload);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when name is too short', async () => {
    const res = await request(app)
      .post(`${BASE}/register`)
      .send(registerPayload({ name: 'A' }));

    expect(res.status).toBe(400);
    expect(res.body.error.details).toBeDefined();
  });

  it('returns 400 when password is under 6 characters', async () => {
    const res = await request(app)
      .post(`${BASE}/register`)
      .send(registerPayload({ password: '123' }));

    expect(res.status).toBe(400);
  });
});

describe('Auth — POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app)
      .post(`${BASE}/register`)
      .send(registerPayload({ email: 'login@example.com' }));
  });

  it('returns token on valid credentials', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: 'login@example.com', password: 'pass123' });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('returns 401 on wrong password', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: 'login@example.com', password: 'wrongpass' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 for inactive user', async () => {
    await User.findOneAndUpdate({ email: 'login@example.com' }, { status: 'INACTIVE' });

    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: 'login@example.com', password: 'pass123' });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toMatch(/inactive/i);
  });
});

describe('Auth — protected route access', () => {
  it('returns 401 when accessing protected route without token', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });

  it('returns 401 with malformed token', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', 'Bearer notavalidtoken');

    expect(res.status).toBe(401);
  });
});

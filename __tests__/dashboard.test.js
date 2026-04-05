require('./setup');
const request = require('supertest');
const app = require('../src/app');

const AUTH = '/api/auth';
const RECORDS = '/api/records';
const DASH = '/api/dashboard';

const getToken = async (role = 'ADMIN') => {
  const email = `${role.toLowerCase()}-${Date.now()}@dash.com`;
  const res = await request(app)
    .post(`${AUTH}/register`)
    .send({ name: `${role} User`, email, password: 'pass123', role });
  return res.body.data.token;
};

const createRecord = (token, overrides = {}) =>
  request(app)
    .post(RECORDS)
    .set('Authorization', `Bearer ${token}`)
    .send({
      amount: 1000,
      type: 'INCOME',
      category: 'Salary',
      date: new Date().toISOString(),
      ...overrides,
    });

describe('Dashboard — GET /api/dashboard/summary', () => {
  it('returns correct totals for income, expenses and net balance', async () => {
    const token = await getToken('ADMIN');

    await createRecord(token, { amount: 3000, type: 'INCOME', category: 'Salary' });
    await createRecord(token, { amount: 2000, type: 'INCOME', category: 'Freelance' });
    await createRecord(token, { amount: 800, type: 'EXPENSE', category: 'Rent' });
    await createRecord(token, { amount: 200, type: 'EXPENSE', category: 'Food' });

    const res = await request(app)
      .get(`${DASH}/summary`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.totalIncome).toBe(5000);
    expect(res.body.data.totalExpenses).toBe(1000);
    expect(res.body.data.netBalance).toBe(4000);
    expect(res.body.data.totalRecords).toBe(4);
  });

  it('returns zeros when no records exist', async () => {
    const token = await getToken('ADMIN');
    const res = await request(app)
      .get(`${DASH}/summary`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.totalIncome).toBe(0);
    expect(res.body.data.totalExpenses).toBe(0);
    expect(res.body.data.netBalance).toBe(0);
  });
});

describe('Dashboard — GET /api/dashboard/categories', () => {
  it('groups records by category with correct income/expense/net', async () => {
    const token = await getToken('ADMIN');

    await createRecord(token, { amount: 5000, type: 'INCOME', category: 'Salary' });
    await createRecord(token, { amount: 1500, type: 'EXPENSE', category: 'Rent' });
    await createRecord(token, { amount: 300, type: 'EXPENSE', category: 'Food' });

    const res = await request(app)
      .get(`${DASH}/categories`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const salary = res.body.data.find((c) => c.category === 'Salary');
    const rent = res.body.data.find((c) => c.category === 'Rent');

    expect(salary.income).toBe(5000);
    expect(salary.expense).toBe(0);
    expect(salary.net).toBe(5000);
    expect(rent.expense).toBe(1500);
    expect(rent.net).toBe(-1500);
  });
});

describe('Dashboard — GET /api/dashboard/trends', () => {
  it('returns monthly trend data for current month', async () => {
    const token = await getToken('ADMIN');

    await createRecord(token, { amount: 4000, type: 'INCOME', category: 'Salary' });
    await createRecord(token, { amount: 600, type: 'EXPENSE', category: 'Utilities' });

    const res = await request(app)
      .get(`${DASH}/trends?months=3`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);

    const now = new Date();
    const thisMonth = res.body.data.find(
      (m) => m.year === now.getFullYear() && m.month === now.getMonth() + 1
    );
    expect(thisMonth).toBeDefined();
    expect(thisMonth.income).toBe(4000);
    expect(thisMonth.expense).toBe(600);
    expect(thisMonth.net).toBe(3400);
  });

  it('VIEWER cannot access trends (403)', async () => {
    const token = await getToken('VIEWER');
    const res = await request(app)
      .get(`${DASH}/trends`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.error.message).toMatch(/ANALYST, ADMIN/);
  });

  it('returns 400 for months out of range', async () => {
    const token = await getToken('ANALYST');
    const res = await request(app)
      .get(`${DASH}/trends?months=99`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });
});

describe('Dashboard — GET /api/dashboard/recent', () => {
  it('returns records sorted by date descending', async () => {
    const token = await getToken('ADMIN');

    const past = new Date();
    past.setDate(past.getDate() - 5);

    await createRecord(token, { date: past.toISOString(), amount: 100 });
    await createRecord(token, { date: new Date().toISOString(), amount: 200 });

    const res = await request(app)
      .get(`${DASH}/recent?limit=5`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].amount).toBe(200);
  });
});

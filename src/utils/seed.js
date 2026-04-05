require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const FinancialRecord = require('../models/record.model');

const monthsAgo = (n) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
};

const USERS = [
  { name: 'Admin User', email: 'admin@finance.com', password: 'pass123', role: 'ADMIN' },
  { name: 'Analyst User', email: 'analyst@finance.com', password: 'pass123', role: 'ANALYST' },
  { name: 'Viewer User', email: 'viewer@finance.com', password: 'pass123', role: 'VIEWER' },
];

const buildRecords = (adminId) => [
  // INCOME — salary (6 months)
  { amount: 5000, type: 'INCOME', category: 'Salary', date: monthsAgo(0), description: 'Monthly salary' },
  { amount: 5000, type: 'INCOME', category: 'Salary', date: monthsAgo(1), description: 'Monthly salary' },
  { amount: 5000, type: 'INCOME', category: 'Salary', date: monthsAgo(2), description: 'Monthly salary' },
  { amount: 5000, type: 'INCOME', category: 'Salary', date: monthsAgo(3), description: 'Monthly salary' },
  { amount: 5000, type: 'INCOME', category: 'Salary', date: monthsAgo(4), description: 'Monthly salary' },
  { amount: 5000, type: 'INCOME', category: 'Salary', date: monthsAgo(5), description: 'Monthly salary' },
  // INCOME — freelance
  { amount: 1500, type: 'INCOME', category: 'Freelance', date: monthsAgo(0), description: 'Web design project' },
  { amount: 800, type: 'INCOME', category: 'Freelance', date: monthsAgo(1), description: 'Consulting work' },
  { amount: 2200, type: 'INCOME', category: 'Freelance', date: monthsAgo(2), description: 'Mobile app contract' },
  // EXPENSE — rent (5 months)
  { amount: 1500, type: 'EXPENSE', category: 'Rent', date: monthsAgo(0), description: 'Monthly rent' },
  { amount: 1500, type: 'EXPENSE', category: 'Rent', date: monthsAgo(1), description: 'Monthly rent' },
  { amount: 1500, type: 'EXPENSE', category: 'Rent', date: monthsAgo(2), description: 'Monthly rent' },
  { amount: 1500, type: 'EXPENSE', category: 'Rent', date: monthsAgo(3), description: 'Monthly rent' },
  { amount: 1500, type: 'EXPENSE', category: 'Rent', date: monthsAgo(4), description: 'Monthly rent' },
  // EXPENSE — food
  { amount: 350, type: 'EXPENSE', category: 'Food', date: monthsAgo(0), description: 'Groceries' },
  { amount: 420, type: 'EXPENSE', category: 'Food', date: monthsAgo(1), description: 'Groceries + dining out' },
  { amount: 280, type: 'EXPENSE', category: 'Food', date: monthsAgo(2), description: 'Groceries' },
  // EXPENSE — transport
  { amount: 120, type: 'EXPENSE', category: 'Transport', date: monthsAgo(0), description: 'Fuel & parking' },
  { amount: 95, type: 'EXPENSE', category: 'Transport', date: monthsAgo(1), description: 'Public transit pass' },
  // EXPENSE — utilities
  { amount: 180, type: 'EXPENSE', category: 'Utilities', date: monthsAgo(0), description: 'Electricity & internet' },
  { amount: 165, type: 'EXPENSE', category: 'Utilities', date: monthsAgo(1), description: 'Electricity & internet' },
  // EXPENSE — entertainment
  { amount: 75, type: 'EXPENSE', category: 'Entertainment', date: monthsAgo(0), description: 'Streaming subscriptions' },
  { amount: 110, type: 'EXPENSE', category: 'Entertainment', date: monthsAgo(1), description: 'Cinema & events' },
  // EXPENSE — healthcare
  { amount: 250, type: 'EXPENSE', category: 'Healthcare', date: monthsAgo(2), description: 'Dental check-up' },
  { amount: 380, type: 'EXPENSE', category: 'Healthcare', date: monthsAgo(3), description: 'Physiotherapy sessions' },
].map((r) => ({ ...r, createdBy: adminId, deletedAt: null }));

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    await User.deleteMany({});
    await FinancialRecord.deleteMany({});
    console.log('Dropped existing data');

    const createdUsers = await Promise.all(
      USERS.map(async ({ password, ...rest }) => {
        const hashed = await bcrypt.hash(password, 10);
        return User.create({ ...rest, password: hashed });
      })
    );
    console.log(`Created ${createdUsers.length} users`);

    const admin = createdUsers.find((u) => u.role === 'ADMIN');
    const records = await FinancialRecord.insertMany(buildRecords(admin._id));
    console.log(`Created ${records.length} financial records`);

    console.log('\n--- Seed credentials ---');
    USERS.forEach(({ email, password, role }) => {
      console.log(`[${role}] ${email} / ${password}`);
    });
    console.log('------------------------\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
};

seed();

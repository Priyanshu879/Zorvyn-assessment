const FinancialRecord = require('../models/record.model');

const getSummary = async () => {
  const results = await FinancialRecord.aggregate([
    { $match: { deletedAt: null } },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  let totalIncome = 0;
  let totalExpenses = 0;
  let totalRecords = 0;

  for (const r of results) {
    if (r._id === 'INCOME') totalIncome = r.total;
    else if (r._id === 'EXPENSE') totalExpenses = r.total;
    totalRecords += r.count;
  }

  return {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    totalRecords,
  };
};

const getCategoryTotals = async () => {
  const results = await FinancialRecord.aggregate([
    { $match: { deletedAt: null } },
    {
      $group: {
        _id: { category: '$category', type: '$type' },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  const map = {};
  for (const r of results) {
    const { category, type } = r._id;
    if (!map[category]) map[category] = { category, income: 0, expense: 0, count: 0 };
    if (type === 'INCOME') map[category].income += r.total;
    else if (type === 'EXPENSE') map[category].expense += r.total;
    map[category].count += r.count;
  }

  return Object.values(map).map((entry) => ({
    ...entry,
    net: entry.income - entry.expense,
  }));
};

const getMonthlyTrends = async (months = 6) => {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const results = await FinancialRecord.aggregate([
    { $match: { deletedAt: null, date: { $gte: since } } },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
          type: '$type',
        },
        total: { $sum: '$amount' },
      },
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 },
    },
  ]);

  const map = {};
  for (const r of results) {
    const { year, month, type } = r._id;
    const key = `${year}-${month}`;
    if (!map[key]) map[key] = { year, month, income: 0, expense: 0 };
    if (type === 'INCOME') map[key].income += r.total;
    else if (type === 'EXPENSE') map[key].expense += r.total;
  }

  return Object.values(map).map((entry) => ({
    ...entry,
    net: entry.income - entry.expense,
  }));
};

const getRecentActivity = async (limit = 10) => {
  return FinancialRecord.find({ deletedAt: null })
    .sort({ date: -1 })
    .limit(limit)
    .populate('createdBy', 'name email');
};

module.exports = { getSummary, getCategoryTotals, getMonthlyTrends, getRecentActivity };

const FinancialRecord = require('../models/record.model');
const AppError = require('../utils/AppError');

const createRecord = async (data, userId) => {
  const record = await FinancialRecord.create({ ...data, createdBy: userId });
  return FinancialRecord.findById(record._id).populate('createdBy', 'name email');
};

const getRecords = async ({ type, category, startDate, endDate, minAmount, maxAmount, page, limit }) => {
  const filter = { deletedAt: null };

  if (type) filter.type = type;
  if (category) filter.category = { $regex: category, $options: 'i' };

  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  if (minAmount !== undefined || maxAmount !== undefined) {
    filter.amount = {};
    if (minAmount !== undefined) filter.amount.$gte = minAmount;
    if (maxAmount !== undefined) filter.amount.$lte = maxAmount;
  }

  const skip = (page - 1) * limit;
  const [records, total] = await Promise.all([
    FinancialRecord.find(filter)
      .populate('createdBy', 'name email')
      .skip(skip)
      .limit(limit),
    FinancialRecord.countDocuments(filter),
  ]);

  return {
    records,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

const getRecordById = async (id) => {
  const record = await FinancialRecord.findOne({ _id: id, deletedAt: null }).populate('createdBy', 'name email');
  if (!record) throw new AppError('Record not found', 404);
  return record;
};

const updateRecord = async (id, data) => {
  const record = await FinancialRecord.findOneAndUpdate(
    { _id: id, deletedAt: null },
    data,
    { new: true, runValidators: true }
  ).populate('createdBy', 'name email');
  if (!record) throw new AppError('Record not found', 404);
  return record;
};

const softDeleteRecord = async (id) => {
  const record = await FinancialRecord.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { deletedAt: new Date() },
    { new: true }
  );
  if (!record) throw new AppError('Record not found', 404);
  return record;
};

module.exports = { createRecord, getRecords, getRecordById, updateRecord, softDeleteRecord };

const mongoose = require('mongoose');

const financialRecordSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ['INCOME', 'EXPENSE'],
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

financialRecordSchema.index({ type: 1, category: 1, date: 1, deletedAt: 1 });

module.exports = mongoose.model('FinancialRecord', financialRecordSchema);

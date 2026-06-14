const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Type is required'],
    enum: {
      values: ['income', 'expense'],
      message: 'Type must be either income or expense'
    }
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  note: {
    type: String,
    trim: true,
    default: ''
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrenceInterval: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'none'],
    default: 'none'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Transaction', transactionSchema);

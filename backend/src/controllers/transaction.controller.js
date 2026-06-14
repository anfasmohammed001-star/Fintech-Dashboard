const Transaction = require('../models/transaction.model');
const mockDbService = require('../services/mockDb.service');
const { isMock } = require('../config/db');
const { generateInsight } = require('../services/insight.service');

// Helper to fetch filtered transactions
const fetchFilteredTransactions = async (userId, queryParams) => {
  const { category, startDate, endDate } = queryParams;
  
  if (isMock()) {
    return await mockDbService.find(userId, { category, startDate, endDate });
  }

  // MongoDB filters
  const filter = { userId };
  if (category && category !== 'All') {
    filter.category = category;
  }
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) {
      filter.date.$gte = new Date(startDate);
    }
    if (endDate) {
      filter.date.$lte = new Date(endDate);
    }
  }
  return await Transaction.find(filter).sort({ date: -1 });
};

// GET /api/transactions
exports.getTransactions = async (req, res) => {
  try {
    const transactions = await fetchFilteredTransactions(req.userId, req.query);
    return res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve transactions',
      error: error.message
    });
  }
};

// POST /api/transactions
exports.createTransaction = async (req, res) => {
  try {
    const { amount, category, type, date, note, isRecurring, recurrenceInterval } = req.body;

    // Server-side validation
    if (amount === undefined || amount === null || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: Amount must be greater than 0'
      });
    }
    if (!category || category.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: Category cannot be empty'
      });
    }
    if (!type || !['income', 'expense'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: Transaction type must be selected (income or expense)'
      });
    }
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: Date cannot be empty'
      });
    }

    let transaction;
    if (isMock()) {
      transaction = await mockDbService.create(req.userId, {
        amount, category, type, date, note, isRecurring, recurrenceInterval
      });
    } else {
      transaction = await Transaction.create({
        userId: req.userId,
        amount, category, type, date, note, isRecurring, recurrenceInterval
      });
    }

    return res.status(201).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create transaction',
      error: error.message
    });
  }
};

// PUT /api/transactions/:id
exports.updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, category, type, date, note, isRecurring, recurrenceInterval } = req.body;

    if (amount !== undefined && Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: Amount must be greater than 0'
      });
    }

    let transaction;
    if (isMock()) {
      transaction = await mockDbService.findByIdAndUpdate(req.userId, id, {
        amount, category, type, date, note, isRecurring, recurrenceInterval
      });
    } else {
      transaction = await Transaction.findOneAndUpdate(
        { _id: id, userId: req.userId },
        { amount, category, type, date, note, isRecurring, recurrenceInterval },
        { new: true, runValidators: true }
      );
    }

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or unauthorized'
      });
    }

    return res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update transaction',
      error: error.message
    });
  }
};

// GET /api/summary
exports.getSummary = async (req, res) => {
  try {
    const transactions = await fetchFilteredTransactions(req.userId, req.query);
    
    let totalIncome = 0;
    let totalExpense = 0;
    const categoryExpenses = {};

    transactions.forEach(t => {
      if (t.type === 'income') {
        totalIncome += t.amount;
      } else if (t.type === 'expense') {
        totalExpense += t.amount;
        categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + t.amount;
      }
    });

    const netBalance = totalIncome - totalExpense;

    let topCategoryName = 'None';
    let maxExpense = 0;
    for (const [category, amount] of Object.entries(categoryExpenses)) {
      if (amount > maxExpense) {
        maxExpense = amount;
        topCategoryName = category;
      }
    }

    const topCategory = topCategoryName === 'None' ? 'None' : `${topCategoryName} (₹${maxExpense.toLocaleString('en-IN')})`;

    return res.status(200).json({
      success: true,
      data: {
        totalIncome,
        totalExpense,
        netBalance,
        topCategory
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve summary',
      error: error.message
    });
  }
};

// GET /api/chart
exports.getChartData = async (req, res) => {
  try {
    const transactions = await fetchFilteredTransactions(req.userId, req.query);
    const categoryExpenses = {};

    transactions.forEach(t => {
      if (t.type === 'expense') {
        categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + t.amount;
      }
    });

    const chartData = Object.entries(categoryExpenses).map(([category, amount]) => ({
      category,
      amount
    }));

    return res.status(200).json({
      success: true,
      data: chartData
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve chart data',
      error: error.message
    });
  }
};

// GET /api/insight
exports.getInsight = async (req, res) => {
  try {
    const transactions = await fetchFilteredTransactions(req.userId, req.query);
    const insight = generateInsight(transactions);
    
    return res.status(200).json({
      success: true,
      data: {
        message: insight.message,
        rule: insight.rule,
        type: insight.type
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve insight',
      error: error.message
    });
  }
};

// DELETE /api/transactions/:id
exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    let deleted;
    if (isMock()) {
      deleted = await mockDbService.findByIdAndDelete(req.userId, id);
    } else {
      deleted = await Transaction.findOneAndDelete({ _id: id, userId: req.userId });
    }

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or unauthorized'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully',
      data: deleted
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete transaction',
      error: error.message
    });
  }
};

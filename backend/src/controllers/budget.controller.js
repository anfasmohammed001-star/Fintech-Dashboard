const { isMock } = require('../config/db');
const Budget = require('../models/budget.model');
const mockDbService = require('../services/mockDb.service');

exports.getBudgets = async (req, res) => {
  try {
    let budgets;
    if (isMock()) {
      budgets = await mockDbService.findBudgets(req.userId);
    } else {
      budgets = await Budget.find({ userId: req.userId });
    }

    return res.status(200).json({
      success: true,
      data: budgets
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve budgets',
      error: error.message
    });
  }
};

exports.setBudget = async (req, res) => {
  try {
    const { category, amount } = req.body;

    if (!category || category.trim() === '') {
      return res.status(400).json({ success: false, message: 'Category is required' });
    }
    if (amount === undefined || amount === null || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than 0' });
    }

    let budget;
    if (isMock()) {
      budget = await mockDbService.setBudget(req.userId, category.trim(), amount);
    } else {
      budget = await Budget.findOneAndUpdate(
        { userId: req.userId, category: category.trim() },
        { amount: Number(amount) },
        { new: true, upsert: true, runValidators: true }
      );
    }

    return res.status(200).json({
      success: true,
      data: budget
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to set budget',
      error: error.message
    });
  }
};

exports.deleteBudget = async (req, res) => {
  try {
    const { id } = req.params;
    let deleted;
    if (isMock()) {
      deleted = await mockDbService.deleteBudget(req.userId, id);
    } else {
      deleted = await Budget.findOneAndDelete({ _id: id, userId: req.userId });
    }

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Budget deleted successfully',
      data: deleted
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete budget',
      error: error.message
    });
  }
};

const { isMock } = require('../config/db');
const Goal = require('../models/goal.model');
const mockDbService = require('../services/mockDb.service');

exports.getGoals = async (req, res) => {
  try {
    let goals;
    if (isMock()) {
      goals = await mockDbService.findGoals(req.userId);
    } else {
      goals = await Goal.find({ userId: req.userId });
    }

    return res.status(200).json({
      success: true,
      data: goals
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve goals',
      error: error.message
    });
  }
};

exports.createGoal = async (req, res) => {
  try {
    const { name, targetAmount, currentAmount, deadline } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Goal name is required' });
    }
    if (targetAmount === undefined || targetAmount === null || Number(targetAmount) <= 0) {
      return res.status(400).json({ success: false, message: 'Target amount must be greater than 0' });
    }

    let goal;
    if (isMock()) {
      goal = await mockDbService.createGoal(req.userId, { name: name.trim(), targetAmount, currentAmount, deadline });
    } else {
      goal = await Goal.create({
        userId: req.userId,
        name: name.trim(),
        targetAmount,
        currentAmount: currentAmount || 0,
        deadline
      });
    }

    return res.status(201).json({
      success: true,
      data: goal
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create goal',
      error: error.message
    });
  }
};

exports.updateGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, targetAmount, currentAmount, deadline } = req.body;

    let updated;
    if (isMock()) {
      updated = await mockDbService.updateGoal(req.userId, id, { name, targetAmount, currentAmount, deadline });
    } else {
      updated = await Goal.findOneAndUpdate(
        { _id: id, userId: req.userId },
        { name, targetAmount, currentAmount, deadline },
        { new: true, runValidators: true }
      );
    }

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    return res.status(200).json({
      success: true,
      data: updated
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update goal',
      error: error.message
    });
  }
};

exports.deleteGoal = async (req, res) => {
  try {
    const { id } = req.params;
    let deleted;
    if (isMock()) {
      deleted = await mockDbService.deleteGoal(req.userId, id);
    } else {
      deleted = await Goal.findOneAndDelete({ _id: id, userId: req.userId });
    }

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Goal deleted successfully',
      data: deleted
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete goal',
      error: error.message
    });
  }
};

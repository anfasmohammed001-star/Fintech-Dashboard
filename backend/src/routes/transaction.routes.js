const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transaction.controller');
const authController = require('../controllers/auth.controller');
const budgetController = require('../controllers/budget.controller');
const goalController = require('../controllers/goal.controller');
const { protect } = require('../middleware/auth.middleware');

// Public Auth routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', protect, authController.getMe);

// Protected Category Budget routes
router.route('/budgets')
  .get(protect, budgetController.getBudgets)
  .post(protect, budgetController.setBudget);
router.delete('/budgets/:id', protect, budgetController.deleteBudget);

// Protected Savings Goal routes
router.route('/goals')
  .get(protect, goalController.getGoals)
  .post(protect, goalController.createGoal);
router.route('/goals/:id')
  .put(protect, goalController.updateGoal)
  .delete(protect, goalController.deleteGoal);

// Protected Transaction routes
router.route('/transactions')
  .get(protect, transactionController.getTransactions)
  .post(protect, transactionController.createTransaction);

router.route('/transactions/:id')
  .put(protect, transactionController.updateTransaction)
  .delete(protect, transactionController.deleteTransaction);

// Protected metrics routes
router.get('/summary', protect, transactionController.getSummary);
router.get('/chart', protect, transactionController.getChartData);
router.get('/insight', protect, transactionController.getInsight);

module.exports = router;

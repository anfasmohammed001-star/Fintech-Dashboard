const generateInsight = (transactions) => {
  if (!transactions || transactions.length === 0) {
    return {
      rule: 'NO_TRANSACTIONS',
      type: 'info',
      message: 'No transaction data available. Start tracking your finances to receive insights.'
    };
  }

  const incomeTransactions = transactions.filter(t => t.type === 'income');
  const expenseTransactions = transactions.filter(t => t.type === 'expense');

  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  // Rule 2: Expenses exceed income (highest critical alert)
  if (totalExpense > totalIncome) {
    const deficit = totalExpense - totalIncome;
    return {
      rule: 'EXPENSES_EXCEED_INCOME',
      type: 'danger',
      message: `Your expenses exceed your income by ₹${deficit.toLocaleString('en-IN')}. Consider reducing discretionary spending.`
    };
  }

  // Calculate expense categories
  const categoryExpenses = {};
  expenseTransactions.forEach(t => {
    categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + t.amount;
  });

  // Check Rule 1: Highest spending category >= 40%
  if (totalExpense > 0) {
    let topCategory = null;
    let topAmount = 0;
    
    for (const [category, amount] of Object.entries(categoryExpenses)) {
      if (amount > topAmount) {
        topAmount = amount;
        topCategory = category;
      }
    }

    if (topCategory) {
      const percentage = (topAmount / totalExpense) * 100;
      if (percentage >= 40) {
        return {
          rule: 'HIGHEST_SPENDING_CATEGORY',
          type: 'warning',
          message: `${topCategory} accounts for ${percentage.toFixed(0)}% of your expenses. Consider reviewing your ${topCategory.toLowerCase()} budget.`
        };
      }
    }
  }

  // Rule 3: Healthy balance (positive net balance)
  if (netBalance > 0) {
    return {
      rule: 'HEALTHY_BALANCE',
      type: 'success',
      message: `Great job! You saved ₹${netBalance.toLocaleString('en-IN')} during this period.`
    };
  }

  // Fallback
  return {
    rule: 'NEUTRAL',
    type: 'info',
    message: 'Start adding details and reviewing transactions to gain customized financial tips.'
  };
};

module.exports = { generateInsight };

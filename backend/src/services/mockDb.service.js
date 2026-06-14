const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const FILE_PATHS = {
  transactions: path.join(DATA_DIR, 'db.json'),
  users: path.join(DATA_DIR, 'users.json'),
  budgets: path.join(DATA_DIR, 'budgets.json'),
  goals: path.join(DATA_DIR, 'goals.json')
};

const ensureFileExists = (key) => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const filePath = FILE_PATHS[key];
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2), 'utf-8');
  }
};

const readCollection = (key) => {
  ensureFileExists(key);
  try {
    const data = fs.readFileSync(FILE_PATHS[key], 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading mock collection ${key}:`, error);
    return [];
  }
};

const writeCollection = (key, data) => {
  ensureFileExists(key);
  try {
    fs.writeFileSync(FILE_PATHS[key], JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error writing mock collection ${key}:`, error);
  }
};

const mockDbService = {
  // --- USERS ---
  findUserByEmail: async (email) => {
    const users = readCollection('users');
    return users.find(u => u.email === email.toLowerCase()) || null;
  },

  findUserById: async (id) => {
    const users = readCollection('users');
    return users.find(u => u._id === id) || null;
  },

  createUser: async (userData) => {
    const users = readCollection('users');
    const newUser = {
      _id: 'user_' + Math.random().toString(36).substring(2, 11),
      email: userData.email.toLowerCase(),
      password: userData.password,
      name: userData.name || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    users.push(newUser);
    writeCollection('users', users);
    return newUser;
  },

  // --- BUDGETS ---
  findBudgets: async (userId) => {
    const budgets = readCollection('budgets');
    return budgets.filter(b => b.userId === userId);
  },

  setBudget: async (userId, category, amount) => {
    const budgets = readCollection('budgets');
    const index = budgets.findIndex(b => b.userId === userId && b.category.toLowerCase() === category.toLowerCase());
    
    const budgetData = {
      amount: Number(amount),
      updatedAt: new Date().toISOString()
    };

    if (index !== -1) {
      budgets[index] = { ...budgets[index], ...budgetData };
      writeCollection('budgets', budgets);
      return budgets[index];
    } else {
      const newBudget = {
        _id: 'budget_' + Math.random().toString(36).substring(2, 11),
        userId,
        category,
        amount: Number(amount),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      budgets.push(newBudget);
      writeCollection('budgets', budgets);
      return newBudget;
    }
  },

  deleteBudget: async (userId, id) => {
    let budgets = readCollection('budgets');
    const budget = budgets.find(b => b._id === id && b.userId === userId);
    if (!budget) return null;
    budgets = budgets.filter(b => b._id !== id);
    writeCollection('budgets', budgets);
    return budget;
  },

  // --- GOALS ---
  findGoals: async (userId) => {
    const goals = readCollection('goals');
    return goals.filter(g => g.userId === userId);
  },

  createGoal: async (userId, data) => {
    const goals = readCollection('goals');
    const newGoal = {
      _id: 'goal_' + Math.random().toString(36).substring(2, 11),
      userId,
      name: data.name,
      targetAmount: Number(data.targetAmount),
      currentAmount: Number(data.currentAmount || 0),
      deadline: data.deadline || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    goals.push(newGoal);
    writeCollection('goals', goals);
    return newGoal;
  },

  updateGoal: async (userId, id, data) => {
    const goals = readCollection('goals');
    const index = goals.findIndex(g => g._id === id && g.userId === userId);
    if (index === -1) return null;

    goals[index] = {
      ...goals[index],
      name: data.name !== undefined ? data.name : goals[index].name,
      targetAmount: data.targetAmount !== undefined ? Number(data.targetAmount) : goals[index].targetAmount,
      currentAmount: data.currentAmount !== undefined ? Number(data.currentAmount) : goals[index].currentAmount,
      deadline: data.deadline !== undefined ? data.deadline : goals[index].deadline,
      updatedAt: new Date().toISOString()
    };
    
    writeCollection('goals', goals);
    return goals[index];
  },

  deleteGoal: async (userId, id) => {
    let goals = readCollection('goals');
    const goal = goals.find(g => g._id === id && g.userId === userId);
    if (!goal) return null;
    goals = goals.filter(g => g._id !== id);
    writeCollection('goals', goals);
    return goal;
  },

  // --- TRANSACTIONS ---
  find: async (userId, query = {}) => {
    let transactions = readCollection('transactions');
    
    // Filter by User
    transactions = transactions.filter(t => t.userId === userId);
    
    // Filter by category
    if (query.category && query.category !== 'All') {
      transactions = transactions.filter(t => t.category.toLowerCase() === query.category.toLowerCase());
    }
    
    // Filter by date range
    if (query.startDate || query.endDate) {
      const start = query.startDate ? new Date(query.startDate) : null;
      const end = query.endDate ? new Date(query.endDate) : null;
      
      transactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        if (start && tDate < start) return false;
        if (end && tDate > end) return false;
        return true;
      });
    }

    // Sort by date descending
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    return transactions;
  },

  findById: async (userId, id) => {
    const transactions = readCollection('transactions');
    return transactions.find(t => t._id === id && t.userId === userId) || null;
  },

  create: async (userId, data) => {
    const transactions = readCollection('transactions');
    const newTransaction = {
      _id: Math.random().toString(36).substring(2, 11),
      userId,
      amount: Number(data.amount),
      category: data.category,
      type: data.type,
      date: data.date,
      note: data.note || '',
      isRecurring: Boolean(data.isRecurring),
      recurrenceInterval: data.recurrenceInterval || 'none',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    transactions.push(newTransaction);
    writeCollection('transactions', transactions);
    return newTransaction;
  },

  findByIdAndUpdate: async (userId, id, data) => {
    const transactions = readCollection('transactions');
    const index = transactions.findIndex(t => t._id === id && t.userId === userId);
    if (index === -1) return null;
    
    transactions[index] = {
      ...transactions[index],
      amount: data.amount !== undefined ? Number(data.amount) : transactions[index].amount,
      category: data.category !== undefined ? data.category : transactions[index].category,
      type: data.type !== undefined ? data.type : transactions[index].type,
      date: data.date !== undefined ? data.date : transactions[index].date,
      note: data.note !== undefined ? data.note : transactions[index].note,
      isRecurring: data.isRecurring !== undefined ? Boolean(data.isRecurring) : transactions[index].isRecurring,
      recurrenceInterval: data.recurrenceInterval !== undefined ? data.recurrenceInterval : transactions[index].recurrenceInterval,
      updatedAt: new Date().toISOString()
    };
    
    writeCollection('transactions', transactions);
    return transactions[index];
  },

  findByIdAndDelete: async (userId, id) => {
    let transactions = readCollection('transactions');
    const transaction = transactions.find(t => t._id === id && t.userId === userId);
    if (!transaction) return null;
    
    transactions = transactions.filter(t => t._id !== id);
    writeCollection('transactions', transactions);
    return transaction;
  }
};

module.exports = mockDbService;

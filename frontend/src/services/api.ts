import { Transaction, FinancialSummary, ChartDataPoint, FinancialInsight, User, Budget, Goal } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface FilterParams {
  category?: string;
  startDate?: string;
  endDate?: string;
}

const getHeaders = () => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
};

const buildQueryString = (filters: FilterParams) => {
  const params = new URLSearchParams();
  if (filters.category && filters.category !== 'All') {
    params.append('category', filters.category);
  }
  if (filters.startDate) {
    params.append('startDate', filters.startDate);
  }
  if (filters.endDate) {
    params.append('endDate', filters.endDate);
  }
  const str = params.toString();
  return str ? `?${str}` : '';
};

export const api = {
  // --- AUTHENTICATION ---
  login: async (credentials: { email: string; password?: string }): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.message || 'Login failed');
    return json.data;
  },

  register: async (details: { email: string; password?: string; name?: string }): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(details)
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.message || 'Registration failed');
    return json.data;
  },

  getMe: async (): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getHeaders(),
      cache: 'no-store'
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.message || 'Failed to fetch user profile');
    return json.data;
  },

  // --- CATEGORY BUDGETS ---
  getBudgets: async (): Promise<Budget[]> => {
    const response = await fetch(`${API_BASE_URL}/budgets`, {
      headers: getHeaders(),
      cache: 'no-store'
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.message || 'Failed to fetch budgets');
    return json.data || [];
  },

  setBudget: async (budget: { category: string; amount: number }): Promise<Budget> => {
    const response = await fetch(`${API_BASE_URL}/budgets`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(budget)
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.message || 'Failed to set budget');
    return json.data;
  },

  deleteBudget: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/budgets/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!response.ok) {
      const json = await response.json();
      throw new Error(json.message || 'Failed to delete budget');
    }
  },

  // --- SAVINGS GOALS ---
  getGoals: async (): Promise<Goal[]> => {
    const response = await fetch(`${API_BASE_URL}/goals`, {
      headers: getHeaders(),
      cache: 'no-store'
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.message || 'Failed to fetch goals');
    return json.data || [];
  },

  createGoal: async (goal: { name: string; targetAmount: number; currentAmount?: number; deadline?: string }): Promise<Goal> => {
    const response = await fetch(`${API_BASE_URL}/goals`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(goal)
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.message || 'Failed to create goal');
    return json.data;
  },

  updateGoal: async (id: string, updates: { name?: string; targetAmount?: number; currentAmount?: number; deadline?: string }): Promise<Goal> => {
    const response = await fetch(`${API_BASE_URL}/goals/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates)
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.message || 'Failed to update goal');
    return json.data;
  },

  deleteGoal: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/goals/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!response.ok) {
      const json = await response.json();
      throw new Error(json.message || 'Failed to delete goal');
    }
  },

  // --- TRANSACTIONS ---
  getTransactions: async (filters: FilterParams = {}): Promise<Transaction[]> => {
    const response = await fetch(`${API_BASE_URL}/transactions${buildQueryString(filters)}`, {
      headers: getHeaders(),
      cache: 'no-store'
    });
    if (!response.ok) throw new Error('Failed to fetch transactions');
    const json = await response.json();
    return json.data || [];
  },

  createTransaction: async (data: Omit<Transaction, '_id'>): Promise<Transaction> => {
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.message || 'Failed to create transaction');
    return json.data;
  },

  updateTransaction: async (id: string, data: Partial<Omit<Transaction, '_id'>>): Promise<Transaction> => {
    const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.message || 'Failed to update transaction');
    return json.data;
  },

  deleteTransaction: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!response.ok) {
      const json = await response.json();
      throw new Error(json.message || 'Failed to delete transaction');
    }
  },

  getSummary: async (filters: FilterParams = {}): Promise<FinancialSummary> => {
    const response = await fetch(`${API_BASE_URL}/summary${buildQueryString(filters)}`, {
      headers: getHeaders(),
      cache: 'no-store'
    });
    if (!response.ok) throw new Error('Failed to fetch summary');
    const json = await response.json();
    return json.data;
  },

  getChartData: async (filters: FilterParams = {}): Promise<ChartDataPoint[]> => {
    const response = await fetch(`${API_BASE_URL}/chart${buildQueryString(filters)}`, {
      headers: getHeaders(),
      cache: 'no-store'
    });
    if (!response.ok) throw new Error('Failed to fetch chart data');
    const json = await response.json();
    return json.data || [];
  },

  getInsight: async (filters: FilterParams = {}): Promise<FinancialInsight> => {
    const response = await fetch(`${API_BASE_URL}/insight${buildQueryString(filters)}`, {
      headers: getHeaders(),
      cache: 'no-store'
    });
    if (!response.ok) throw new Error('Failed to fetch insight');
    const json = await response.json();
    return json.data;
  }
};

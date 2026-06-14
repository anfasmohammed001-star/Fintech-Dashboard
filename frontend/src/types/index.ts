export interface Transaction {
  _id: string;
  userId?: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  date: string;
  note?: string;
  isRecurring?: boolean;
  recurrenceInterval?: 'daily' | 'weekly' | 'monthly' | 'none';
  createdAt?: string;
  updatedAt?: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  topCategory: string;
}

export interface ChartDataPoint {
  category: string;
  amount: number;
}

export interface FinancialInsight {
  message: string;
  rule: string;
  type: 'success' | 'warning' | 'danger' | 'info';
}

export interface User {
  _id: string;
  email: string;
  name?: string;
  token?: string;
}

export interface Budget {
  _id: string;
  userId: string;
  category: string;
  amount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Goal {
  _id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  rate: number; // conversion rate from base currency (INR)
}

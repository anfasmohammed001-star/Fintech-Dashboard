'use client';

import React, { useState, useEffect } from 'react';
import { api, FilterParams } from '../services/api';
import { Transaction, FinancialSummary, ChartDataPoint, FinancialInsight, User, Budget, Goal, CurrencyConfig, CurrencyCode } from '../types';
import { SummaryCards } from '../components/SummaryCards';
import { SpendingChart } from '../components/SpendingChart';
import { InsightCard } from '../components/InsightCard';
import { Filters } from '../components/Filters';
import { TransactionForm } from '../components/TransactionForm';
import { TransactionTable } from '../components/TransactionTable';
import { AuthScreen } from '../components/AuthScreen';
import { BudgetTracker } from '../components/BudgetTracker';
import { GoalsTracker } from '../components/GoalsTracker';
import { Wallet, LogOut, Sun, Moon, DollarSign, CalendarRange, TrendingUp, BarChart3, PieChartIcon, AlertTriangle, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CURRENCIES: CurrencyConfig[] = [
  { code: 'INR', symbol: '₹', rate: 1.0 },
  { code: 'USD', symbol: '$', rate: 0.012 }, // 1 INR = 0.012 USD
  { code: 'EUR', symbol: '€', rate: 0.011 },  // 1 INR = 0.011 EUR
  { code: 'GBP', symbol: '£', rate: 0.0096 }  // 1 INR = 0.0096 GBP
];

export default function DashboardPage() {
  // Authentication State
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Theme state
  const [isLightMode, setIsLightMode] = useState(true);

  // Multi-currency State
  const [activeCurrency, setActiveCurrency] = useState<CurrencyConfig>(CURRENCIES[0]);

  // Tab State: 'pie' (spending by category) | 'monthly' (income vs expense MoM reports)
  const [activeTab, setActiveTab] = useState<'pie' | 'monthly'>('pie');

  // Filter parameters
  const [filters, setFilters] = useState<FilterParams>({
    category: 'All',
    startDate: '',
    endDate: '',
  });

  // Data Collections State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [summary, setSummary] = useState<FinancialSummary>({
    totalIncome: 0,
    totalExpense: 0,
    netBalance: 0,
    topCategory: 'None',
  });
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [insight, setInsight] = useState<FinancialInsight | null>(null);

  // Transaction Edit Selection
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);

  // Loading and error indicators
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check login session on load
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    
    // Set default light mode class
    if (isLightMode) {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    
    setAuthChecked(true);
  }, []);

  // Sync theme
  const toggleTheme = () => {
    const nextMode = !isLightMode;
    setIsLightMode(nextMode);
    if (nextMode) {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  };

  // Fetch all dashboard data
  const fetchDashboardData = async (filterParams: FilterParams) => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const [txList, summaryInfo, chartInfo, insightInfo, budgetList, goalList] = await Promise.all([
        api.getTransactions(filterParams),
        api.getSummary(filterParams),
        api.getChartData(filterParams),
        api.getInsight(filterParams),
        api.getBudgets(),
        api.getGoals()
      ]);

      setTransactions(txList);
      setSummary(summaryInfo);
      setChartData(chartInfo);
      setInsight(insightInfo);
      setBudgets(budgetList);
      setGoals(goalList);
    } catch (err: any) {
      console.error(err);
      setError('Could not connect to backend server. Re-trying...');
    } finally {
      setIsLoading(false);
    }
  };

  // Refetch when filters or user changes
  useEffect(() => {
    if (user) {
      fetchDashboardData(filters);
    }
  }, [filters, user]);

  const handleAuthSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setTransactions([]);
    setBudgets([]);
    setGoals([]);
  };

  const handleTransactionAdded = () => {
    fetchDashboardData(filters);
  };

  const handleTransactionDeleted = async (id: string) => {
    try {
      await api.deleteTransaction(id);
      if (editTransaction?._id === id) {
        setEditTransaction(null);
      }
      fetchDashboardData(filters);
    } catch (err: any) {
      alert(err.message || 'Failed to delete transaction');
    }
  };

  const handleEditSelect = (t: Transaction) => {
    setEditTransaction(t);
  };

  const handleCancelEdit = () => {
    setEditTransaction(null);
  };

  // Categories list helper
  const availableCategories = Array.from(new Set(transactions.map(t => t.category)));

  // Currency Converter Helpers
  const convertVal = (inrVal: number) => {
    return inrVal * activeCurrency.rate;
  };

  const convertedSummary: FinancialSummary = {
    totalIncome: convertVal(summary.totalIncome),
    totalExpense: convertVal(summary.totalExpense),
    netBalance: convertVal(summary.netBalance),
    topCategory: summary.topCategory.replace(/₹([\d,.]+)/g, (_, match) => {
      const parsedInr = Number(match.replace(/,/g, ''));
      return `${activeCurrency.symbol}${Math.round(convertVal(parsedInr)).toLocaleString('en-IN')}`;
    })
  };

  const convertedChartData = chartData.map(c => ({
    category: c.category,
    amount: convertVal(c.amount)
  }));

  // Group transactions for Monthly Reports MoM Bar Chart
  const getMonthlyChartData = () => {
    const monthlyTotals: Record<string, { month: string; Income: number; Expense: number }> = {};
    
    // Process transactions chronologically
    [...transactions].reverse().forEach(t => {
      try {
        const dateObj = new Date(t.date);
        const monthStr = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (!monthlyTotals[monthStr]) {
          monthlyTotals[monthStr] = { month: monthStr, Income: 0, Expense: 0 };
        }
        if (t.type === 'income') {
          monthlyTotals[monthStr].Income += convertVal(t.amount);
        } else {
          monthlyTotals[monthStr].Expense += convertVal(t.amount);
        }
      } catch (err) {}
    });

    return Object.values(monthlyTotals);
  };

  const monthlyReportData = getMonthlyChartData();

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center font-sans text-text-muted">
        <div className="w-6 h-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onSuccess={handleAuthSuccess} isLightMode={isLightMode} toggleTheme={toggleTheme} />;
  }

  return (
    <div className="relative min-h-screen pb-16 overflow-hidden bg-[var(--background)] text-[var(--foreground)] font-sans print:bg-white print:text-slate-900 transition-colors duration-300">
      {/* Decorative Glow Overlays */}
      <div className="glow-bg-indigo top-0 left-1/4 w-[500px] h-[500px] opacity-40 print:hidden" />
      <div className="glow-bg-emerald bottom-0 right-1/4 w-[600px] h-[600px] opacity-20 print:hidden" />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6 relative z-10 print:pt-0">
        
        {/* Header bar */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-card-border pb-6 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-primary to-indigo-600 rounded-2xl shadow-lg shadow-primary/30 text-white border border-primary/20 shrink-0">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-500">
                  FinSight
                </h1>
              </div>
              <p className="text-xs text-text-muted font-medium mt-0.5">
                Take control of budgets, goals, and recurring transactions
              </p>
            </div>
          </div>

          {/* Settings & User Profiles */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto md:justify-end">
            {/* Currency Switcher */}
            <div className="flex bg-input-bg border border-input-border rounded-xl p-1 shrink-0">
              {CURRENCIES.map(curr => (
                <button
                  key={curr.code}
                  onClick={() => setActiveCurrency(curr)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeCurrency.code === curr.code
                      ? 'bg-primary text-white shadow'
                      : 'text-text-muted hover:text-text-title'
                  }`}
                >
                  {curr.code}
                </button>
              ))}
            </div>

            {/* Light/Dark Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 bg-input-bg border border-input-border rounded-xl text-text-muted hover:text-text-title transition-all cursor-pointer shrink-0"
              title={isLightMode ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {isLightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* User Session */}
            <div className="text-text-title text-xs font-semibold bg-input-bg border border-input-border rounded-xl px-3.5 py-2 backdrop-blur-md flex items-center gap-2.5 ml-auto md:ml-0 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{user.name || user.email}</span>
              <button
                onClick={handleLogout}
                className="hover:text-expense transition-all cursor-pointer pl-1.5 border-l border-input-border"
                title="Log Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </header>

        {/* Global Error Banner */}
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
            <div className="flex gap-3 items-start sm:items-center">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 sm:mt-0" />
              <p className="text-sm text-rose-300 font-medium">{error}</p>
            </div>
            <button
              onClick={() => fetchDashboardData(filters)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/25 rounded-xl hover:bg-rose-500/20 transition-all cursor-pointer active:scale-95 shrink-0 self-end sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Connection
            </button>
          </div>
        )}

        {/* 1. Summary Cards Section */}
        <SummaryCards summary={convertedSummary} isLoading={isLoading} currencySymbol={activeCurrency.symbol} isLightMode={isLightMode} />

        {/* 2. Visual / Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Charts area with Tabs */}
          <div className="lg:col-span-2 rounded-2xl glass-panel p-6 border border-card-border h-[390px] flex flex-col justify-between relative">
            <div className="flex items-center justify-between border-b border-card-border pb-4 mb-4 shrink-0 print:hidden">
              <h3 className="text-sm font-semibold text-text-title flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Reports & Analytics
              </h3>
              
              {/* Tab Toggles */}
              <div className="flex bg-input-bg border border-input-border rounded-xl p-1">
                <button
                  onClick={() => setActiveTab('pie')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'pie' ? 'bg-primary text-white' : 'text-text-muted hover:text-text-title'
                  }`}
                >
                  <PieChartIcon className="w-3.5 h-3.5" />
                  Category Pie
                </button>
                <button
                  onClick={() => setActiveTab('monthly')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'monthly' ? 'bg-primary text-white' : 'text-text-muted hover:text-text-title'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  Monthly MoM
                </button>
              </div>
            </div>

            {/* Tab Rendering Content */}
            <div className="flex-1 min-h-0">
              {activeTab === 'pie' ? (
                // Category Expense Pie
                <div className="w-full h-full">
                  <SpendingChart data={convertedChartData} isLoading={isLoading} isLightMode={isLightMode} />
                </div>
              ) : (
                // MoM Income vs Expense reports
                <div className="w-full h-full flex flex-col justify-between">
                  <div className="flex-1 min-h-0 flex items-center justify-center">
                    {isLoading ? (
                      <div className="w-6 h-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                    ) : monthlyReportData.length === 0 ? (
                      <div className="text-center py-10">
                        <CalendarRange className="w-8 h-8 text-text-muted mx-auto mb-2" />
                        <p className="text-xs text-text-muted">No monthly logs found.</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="95%">
                        <BarChart data={monthlyReportData}>
                          <CartesianGrid strokeDasharray="3 3" stroke={isLightMode ? "rgba(15, 23, 42, 0.08)" : "rgba(255, 255, 255, 0.05)"} />
                          <XAxis dataKey="month" stroke={isLightMode ? "rgba(15, 23, 42, 0.4)" : "rgba(255, 255, 255, 0.4)"} fontSize={11} />
                          <YAxis stroke={isLightMode ? "rgba(15, 23, 42, 0.4)" : "rgba(255, 255, 255, 0.4)"} fontSize={11} />
                          <Tooltip
                            contentStyle={{ 
                              background: isLightMode ? '#ffffff' : '#0f172a', 
                              border: isLightMode ? '1px solid rgba(15, 23, 42, 0.1)' : '1px solid rgba(255,255,255,0.1)', 
                              borderRadius: '12px',
                              color: isLightMode ? '#1e293b' : '#f8fafc'
                            }}
                            labelStyle={{ color: isLightMode ? '#64748b' : '#94a3b8', fontSize: 11, fontWeight: 'bold' }}
                          />
                          <Legend wrapperStyle={{ fontSize: 11, color: isLightMode ? '#1e293b' : '#e2e8f0' }} />
                          <Bar dataKey="Income" fill={isLightMode ? "#1d9e75" : "#10b981"} radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Expense" fill={isLightMode ? "#e24b4a" : "#f43f5e"} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* stacked Budgets & Goals trackers */}
          <div className="space-y-6 print:hidden">
            <BudgetTracker
              budgets={budgets}
              transactions={transactions}
              onUpdate={() => fetchDashboardData(filters)}
              currencySymbol={activeCurrency.symbol}
              currencyRate={activeCurrency.rate}
            />
            <GoalsTracker
              goals={goals}
              onUpdate={() => fetchDashboardData(filters)}
              currencySymbol={activeCurrency.symbol}
              currencyRate={activeCurrency.rate}
            />
          </div>
        </div>

        {/* 3. Filters Component */}
        <Filters filters={filters} onChange={setFilters} availableCategories={availableCategories} />

        {/* 4. Ledger & Inputs layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Table history list */}
          <div className="lg:col-span-2">
            <TransactionTable
              transactions={transactions}
              onDelete={handleTransactionDeleted}
              onEditSelect={handleEditSelect}
              isLoading={isLoading}
              currencySymbol={activeCurrency.symbol}
              currencyRate={activeCurrency.rate}
              isLightMode={isLightMode}
            />
          </div>

          {/* Inputs Form and Insights */}
          <div className="space-y-6 print:hidden">
            <InsightCard insight={insight} isLoading={isLoading} />
            <TransactionForm
              onSuccess={handleTransactionAdded}
              availableCategories={availableCategories}
              editTransaction={editTransaction}
              onCancelEdit={handleCancelEdit}
              currencySymbol={activeCurrency.symbol}
              currencyRate={activeCurrency.rate}
            />
          </div>
        </div>

      </main>
    </div>
  );
}

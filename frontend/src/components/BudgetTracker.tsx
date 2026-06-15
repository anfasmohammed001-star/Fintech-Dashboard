'use client';

import React, { useState } from 'react';
import { api } from '../services/api';
import { Budget, Transaction } from '../types';
import { Plus, Trash2, ShieldAlert, Target, Coins } from 'lucide-react';

interface BudgetTrackerProps {
  budgets: Budget[];
  transactions: Transaction[];
  onUpdate: () => void;
  currencySymbol: string;
  currencyRate: number;
}

export const BudgetTracker: React.FC<BudgetTrackerProps> = ({
  budgets,
  transactions,
  onUpdate,
  currencySymbol,
  currencyRate,
}) => {
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaults = ['Food', 'Travel', 'Shopping', 'Bills', 'Salary', 'Freelance'];

  const convertVal = (inrVal: number) => {
    return inrVal * currencyRate;
  };

  const formatCurrency = (val: number) => {
    return `${currencySymbol}${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  const handleSetBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!category || !amount || Number(amount) <= 0) {
      setError('Select a category and limit.');
      return;
    }

    setIsSubmitting(true);
    try {
      const inrAmount = Number(amount) / currencyRate;
      await api.setBudget({ category, amount: inrAmount });
      setAmount('');
      setCategory('');
      onUpdate();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to set budget';
      setError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    try {
      await api.deleteBudget(id);
      onUpdate();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to delete budget';
      alert(errMsg);
    }
  };

  const categoryExpenses: Record<string, number> = {};
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + t.amount;
    });

  return (
    <div className="rounded-2xl glass-panel p-6 border border-card-border flex flex-col h-[280px] justify-between">
      <div className="min-h-0 flex flex-col h-full">
        <h3 className="text-sm font-semibold text-text-title mb-3 flex items-center gap-2 shrink-0">
          <Target className="w-4.5 h-4.5 text-primary" />
          Category Budgets
        </h3>

        {/* Set Budget Form */}
        <form onSubmit={handleSetBudget} className="flex gap-2 mb-3 shrink-0">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="flex-1 bg-[var(--input-bg)] border border-input-border rounded-xl px-2.5 py-1.5 text-xs text-text-title focus:outline-none focus:border-primary"
          >
            <option value="" disabled>Category...</option>
            {defaults.map((cat) => (
              <option key={cat} value={cat} className="bg-[var(--card-bg)] text-[var(--foreground)]">
                {cat}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder={`Limit (${currencySymbol})`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-24 bg-[var(--input-bg)] border border-input-border rounded-xl px-2.5 py-1.5 text-xs text-text-title focus:outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="p-1.5 bg-primary hover:bg-primary-hover text-white rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 active:scale-95 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>

        {error && <p className="text-[10px] text-expense font-medium mb-2 shrink-0">{error}</p>}

        {/* Budgets List */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
          {budgets.length === 0 ? (
            <div className="text-center py-5">
              <Coins className="w-5 h-5 text-text-muted mx-auto mb-1" />
              <p className="text-[11px] text-text-muted">No category limits set.</p>
            </div>
          ) : (
            budgets.map((b) => {
              const actualInr = categoryExpenses[b.category] || 0;
              const limitInr = b.amount;
              const percentage = limitInr > 0 ? (actualInr / limitInr) * 100 : 0;
              
              let barColor = 'bg-primary';
              if (percentage >= 100) {
                barColor = 'bg-expense';
              } else if (percentage >= 80) {
                barColor = 'bg-amber-500';
              }

              return (
                <div key={b._id} className="space-y-1 group">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-text-title font-medium">{b.category}</span>
                      {percentage >= 100 && (
                        <span title="Exceeded!"><ShieldAlert className="w-3.5 h-3.5 text-expense shrink-0" /></span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-text-muted text-[10px]">
                        {formatCurrency(convertVal(actualInr))} / <span className="text-text-title font-semibold">{formatCurrency(convertVal(limitInr))}</span>
                      </span>
                      <button
                        onClick={() => handleDeleteBudget(b._id)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-expense/10 hover:text-expense text-text-muted rounded transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="w-full bg-progress-track rounded-full h-1.5 overflow-hidden border border-card-border">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
export default BudgetTracker;

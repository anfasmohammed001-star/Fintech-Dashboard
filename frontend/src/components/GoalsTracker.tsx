'use client';

import React, { useState } from 'react';
import { api } from '../services/api';
import { Goal } from '../types';
import { Plus, Trash2, Trophy, PiggyBank, ArrowUpRight } from 'lucide-react';

interface GoalsTrackerProps {
  goals: Goal[];
  onUpdate: () => void;
  currencySymbol: string;
  currencyRate: number;
}

export const GoalsTracker: React.FC<GoalsTrackerProps> = ({
  goals,
  onUpdate,
  currencySymbol,
  currencyRate
}) => {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [contribGoalId, setContribGoalId] = useState<string | null>(null);
  const [contribAmount, setContribAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const convertVal = (inrVal: number) => {
    return inrVal * currencyRate;
  };

  const formatCurrency = (val: number) => {
    return `${currencySymbol}${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name || !targetAmount || Number(targetAmount) <= 0) {
      setError('Provide name and target.');
      return;
    }

    setIsSubmitting(true);
    try {
      const inrTarget = Number(targetAmount) / currencyRate;
      await api.createGoal({
        name: name.trim(),
        targetAmount: inrTarget,
        currentAmount: 0,
        deadline: deadline || undefined
      });
      setName('');
      setTargetAmount('');
      setDeadline('');
      onUpdate();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to create savings goal';
      setError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContribute = async (id: string, currentSaved: number) => {
    if (!contribAmount || Number(contribAmount) <= 0) return;
    
    try {
      const inrAdd = Number(contribAmount) / currencyRate;
      const newSaved = currentSaved + inrAdd;
      await api.updateGoal(id, { currentAmount: newSaved });
      setContribAmount('');
      setContribGoalId(null);
      onUpdate();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to add savings contribution';
      alert(errMsg);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      await api.deleteGoal(id);
      onUpdate();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to delete goal';
      alert(errMsg);
    }
  };

  return (
    <div className="rounded-2xl glass-panel p-6 border border-card-border flex flex-col h-[280px] justify-between">
      <div className="min-h-0 flex flex-col h-full">
        <h3 className="text-sm font-semibold text-text-title mb-3 flex items-center gap-2 shrink-0">
          <Trophy className="w-4.5 h-4.5 text-primary" />
          Savings Goals
        </h3>

        {/* Add Goal Form */}
        <form onSubmit={handleCreateGoal} className="flex gap-1.5 mb-3 shrink-0">
          <input
            type="text"
            placeholder="Goal..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 bg-[var(--input-bg)] border border-input-border rounded-xl px-2.5 py-1.5 text-xs text-text-title focus:outline-none focus:border-primary"
          />
          <input
            type="number"
            placeholder={`Target (${currencySymbol})`}
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            className="w-20 bg-[var(--input-bg)] border border-input-border rounded-xl px-2.5 py-1.5 text-xs text-text-title focus:outline-none focus:border-primary"
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

        {/* Goals List */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
          {goals.length === 0 ? (
            <div className="text-center py-5">
              <PiggyBank className="w-5 h-5 text-text-muted mx-auto mb-1" />
              <p className="text-[11px] text-text-muted">No savings targets created.</p>
            </div>
          ) : (
            goals.map((g) => {
              const savedVal = convertVal(g.currentAmount);
              const targetVal = convertVal(g.targetAmount);
              const percentage = targetVal > 0 ? (savedVal / targetVal) * 100 : 0;
              const isContributing = contribGoalId === g._id;

              return (
                <div key={g._id} className="space-y-1 group">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-text-title font-medium">{g.name}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-text-muted text-[10px]">
                        {formatCurrency(savedVal)} / <span className="text-text-title font-semibold">{formatCurrency(targetVal)}</span>
                        {` (${percentage.toFixed(0)}%)`}
                      </span>
                      <button
                        onClick={() => setContribGoalId(isContributing ? null : g._id)}
                        className="p-0.5 hover:bg-primary/10 hover:text-primary text-text-muted rounded transition-all cursor-pointer"
                        title="Contribute savings"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(g._id)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-expense/10 hover:text-expense text-text-muted rounded transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Contribution input block */}
                  {isContributing && (
                    <div className="flex gap-1.5 items-center p-1 bg-input-bg border border-input-border rounded-xl shrink-0">
                      <input
                        type="number"
                        placeholder={`Add ${currencySymbol}...`}
                        value={contribAmount}
                        onChange={(e) => setContribAmount(e.target.value)}
                        className="flex-1 bg-[var(--input-bg)] border border-input-border rounded-lg px-2 py-1 text-[11px] text-text-title focus:outline-none"
                      />
                      <button
                        onClick={() => handleContribute(g._id, g.currentAmount)}
                        className="px-2 py-1 bg-primary hover:bg-primary-hover text-white rounded-lg text-[10px] font-bold cursor-pointer active:scale-95"
                      >
                        Add
                      </button>
                    </div>
                  )}

                  <div className="w-full bg-progress-track rounded-full h-1.5 overflow-hidden border border-card-border">
                    <div
                      className="h-full rounded-full transition-all duration-500 bg-income"
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
export default GoalsTracker;

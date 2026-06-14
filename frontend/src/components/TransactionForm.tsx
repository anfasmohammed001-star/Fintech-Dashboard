'use client';

import React, { useState, useEffect } from 'react';
import { PlusCircle, RefreshCw, Calendar, Tag, FileText, CheckCircle2, Repeat, X } from 'lucide-react';
import { Transaction } from '../types';
import confetti from 'canvas-confetti';

interface TransactionFormProps {
  onSuccess: () => void;
  availableCategories: string[];
  editTransaction: Transaction | null;
  onCancelEdit: () => void;
  currencySymbol: string;
  currencyRate: number;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  onSuccess,
  availableCategories,
  editTransaction,
  onCancelEdit,
  currencySymbol,
  currencyRate
}) => {
  const defaults = ['Food', 'Travel', 'Shopping', 'Bills', 'Salary', 'Freelance', 'Others'];
  const categoriesList = Array.from(new Set([...defaults, ...availableCategories])).sort();

  const getTodayDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [date, setDate] = useState(getTodayDateString());
  const [note, setNote] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceInterval, setRecurrenceInterval] = useState<'daily' | 'weekly' | 'monthly' | 'none'>('none');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState('');

  // Handle Edit state loading
  useEffect(() => {
    if (editTransaction) {
      // Amount in editTransaction is in INR. Convert to active currency
      const displayAmount = (editTransaction.amount * currencyRate).toFixed(2);
      setAmount(displayAmount);
      
      const isDefaultCategory = defaults.includes(editTransaction.category);
      if (isDefaultCategory) {
        setCategory(editTransaction.category);
        setShowCustom(false);
      } else {
        setCustomCategory(editTransaction.category);
        setShowCustom(true);
      }
      
      setType(editTransaction.type);
      
      // Parse date: yyyy-mm-dd
      const dateObj = new Date(editTransaction.date);
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      setDate(`${yyyy}-${mm}-${dd}`);
      
      setNote(editTransaction.note || '');
      setIsRecurring(editTransaction.isRecurring || false);
      setRecurrenceInterval(editTransaction.recurrenceInterval || 'none');
      setErrors({});
    } else {
      handleReset();
    }
  }, [editTransaction]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!amount || Number(amount) <= 0) {
      errs.amount = 'Amount must be greater than 0';
    }
    
    const finalCategory = (showCustom || category === 'Others') ? customCategory : category;
    if (!finalCategory || finalCategory.trim() === '') {
      errs.category = 'Category is required';
    }
    
    if (!type) {
      errs.type = 'Type is required';
    }
    
    if (!date) {
      errs.date = 'Date is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSuccessMsg('');

    const finalCategory = (showCustom || category === 'Others') ? customCategory : category;

    // Convert display currency back to INR base currency before submitting to backend!
    const inrAmount = Number(amount) / currencyRate;

    const bodyData = {
      amount: inrAmount,
      category: finalCategory.trim(),
      type,
      date,
      note: note.trim(),
      isRecurring,
      recurrenceInterval: isRecurring ? recurrenceInterval : 'none'
    };

    try {
      const url = editTransaction 
        ? `http://localhost:5000/api/transactions/${editTransaction._id}` 
        : 'http://localhost:5000/api/transactions';
      const method = editTransaction ? 'PUT' : 'POST';

      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(bodyData)
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message || 'Failed to save transaction');
      }

      // Success!
      setSuccessMsg(editTransaction ? 'Transaction updated successfully!' : 'Transaction logged successfully!');
      
      // Trigger confetti!
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899']
      });

      if (editTransaction) {
        onCancelEdit();
      } else {
        handleReset();
      }

      // Notify parent to refetch data
      onSuccess();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMsg(''), 3000);

    } catch (err: any) {
      setErrors({ server: err.message || 'Server error, failed to save.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setAmount('');
    setCategory('');
    setCustomCategory('');
    setShowCustom(false);
    setType('expense');
    setDate(getTodayDateString());
    setNote('');
    setIsRecurring(false);
    setRecurrenceInterval('none');
    setErrors({});
    setSuccessMsg('');
  };

  return (
    <div className="rounded-2xl glass-panel p-6 border border-white/5 relative overflow-hidden shrink-0">
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-indigo-400" />
          {editTransaction ? 'Edit Transaction' : 'Add Transaction'}
        </h3>
        {editTransaction && (
          <button
            onClick={onCancelEdit}
            className="p-1 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Cancel Edit"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type selector toggle (Income/Expense) */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/80 rounded-xl border border-white/5">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
              type === 'expense'
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                : 'text-slate-400 border border-transparent hover:text-slate-200'
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
              type === 'income'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 border border-transparent hover:text-slate-200'
            }`}
          >
            Income
          </button>
        </div>

        {/* Amount */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-400">Amount ({currencySymbol})</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 select-none">
              {currencySymbol}
            </span>
            <input
              type="number"
              step="any"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`w-full bg-slate-900/60 border rounded-xl pl-8 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 transition-all ${
                errors.amount
                  ? 'border-rose-500/50 focus:border-rose-500 focus:ring-rose-500'
                  : 'border-white/10 focus:border-indigo-500 focus:ring-indigo-500'
              }`}
            />
          </div>
          {errors.amount && <p className="text-[11px] text-rose-400 font-medium">{errors.amount}</p>}
        </div>

        {/* Category dropdown / Custom input */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-xs font-medium text-slate-400">Category</label>
            <button
              type="button"
              onClick={() => {
                setShowCustom(!showCustom);
                setCategory('');
                setCustomCategory('');
              }}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer pointer-events-auto"
            >
              {showCustom ? 'Select Default' : 'Add Custom'}
            </button>
          </div>

          <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            {showCustom ? (
              <input
                type="text"
                placeholder="e.g. Entertainment"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className={`w-full bg-slate-900/60 border rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 transition-all ${
                  errors.category
                    ? 'border-rose-500/50 focus:border-rose-500 focus:ring-rose-500'
                    : 'border-white/10 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              />
            ) : (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`w-full bg-slate-900/60 border rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 transition-all appearance-none cursor-pointer ${
                  errors.category
                    ? 'border-rose-500/50 focus:border-rose-500 focus:ring-rose-500'
                    : 'border-white/10 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              >
                <option value="" disabled className="text-slate-600">Select category...</option>
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat} className="bg-slate-950 text-slate-200">
                    {cat}
                  </option>
                ))}
              </select>
            )}
          </div>
          {errors.category && <p className="text-[11px] text-rose-400 font-medium">{errors.category}</p>}

          {/* Sub-input to specify category type if "Others" is selected in standard dropdown */}
          {category === 'Others' && !showCustom && (
            <div className="mt-2 relative animate-fade-in">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Specify category type..."
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className={`w-full bg-slate-900/60 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all`}
              />
            </div>
          )}
        </div>

        {/* Date Picker */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-400">Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`w-full bg-slate-900/60 border rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 transition-all cursor-pointer ${
                errors.date
                  ? 'border-rose-500/50 focus:border-rose-500 focus:ring-rose-500'
                  : 'border-white/10 focus:border-indigo-500 focus:ring-indigo-500'
              }`}
            />
          </div>
          {errors.date && <p className="text-[11px] text-rose-400 font-medium">{errors.date}</p>}
        </div>

        {/* Recurring Schedules Toggle */}
        <div className="space-y-2 py-1">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isRecurring"
              checked={isRecurring}
              onChange={(e) => {
                setIsRecurring(e.target.checked);
                if (e.target.checked && recurrenceInterval === 'none') {
                  setRecurrenceInterval('monthly');
                }
              }}
              className="w-4 h-4 rounded border-white/10 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="isRecurring" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 cursor-pointer">
              <Repeat className="w-3.5 h-3.5 text-indigo-400" />
              Recurring transaction
            </label>
          </div>

          {isRecurring && (
            <div className="pl-6 animate-fade-in">
              <select
                value={recurrenceInterval}
                onChange={(e: any) => setRecurrenceInterval(e.target.value)}
                className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="daily">Daily recurrence</option>
                <option value="weekly">Weekly recurrence</option>
                <option value="monthly">Monthly recurrence</option>
              </select>
            </div>
          )}
        </div>

        {/* Note */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-400">Note (Optional)</label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
            <textarea
              placeholder="Add details..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full bg-slate-900/60 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
            />
          </div>
        </div>

        {errors.server && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
            {errors.server}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {successMsg}
          </div>
        )}

        {/* Actions buttons */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <button
            type="button"
            onClick={editTransaction ? onCancelEdit : handleReset}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white rounded-xl text-xs font-semibold text-slate-300 transition-all cursor-pointer active:scale-95"
          >
            {editTransaction ? 'Cancel' : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                Reset
              </>
            )}
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="col-span-2 flex items-center justify-center gap-1.5 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 cursor-pointer active:scale-95"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            ) : (
              editTransaction ? 'Update' : 'Save'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
export default TransactionForm;

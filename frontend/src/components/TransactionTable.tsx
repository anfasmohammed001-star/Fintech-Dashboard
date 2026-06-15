'use client';

import React, { useState } from 'react';
import { ArrowUpDown, Trash2, Search, Calendar, AlertCircle, Edit, Download, Printer, Repeat } from 'lucide-react';
import { Transaction } from '../types';

interface TransactionTableProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEditSelect: (t: Transaction) => void;
  isLoading: boolean;
  currencySymbol: string;
  currencyRate: number;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  onDelete,
  onEditSelect,
  isLoading,
  currencySymbol,
  currencyRate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Formatting date helper
  const formatDate = (dateStr: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateStr).toLocaleDateString('en-US', options);
    } catch {
      return dateStr;
    }
  };

  const convertVal = (inrVal: number) => {
    return inrVal * currencyRate;
  };

  const formatCurrency = (val: number) => {
    return `${currencySymbol}${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleSort = () => {
    setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
  };

  const handleConfirmDelete = async (id: string) => {
    try {
      await onDelete(id);
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  // Search filter
  const filtered = transactions.filter(t => {
    const text = (t.category + ' ' + (t.note || '')).toLowerCase();
    return text.includes(searchTerm.toLowerCase());
  });

  // Sort logic (local)
  const sorted = [...filtered].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
  });

  // Export to CSV helper
  const handleExportCSV = () => {
    if (sorted.length === 0) return;
    const headers = ['Date', 'Category', 'Type', 'Amount (INR)', `Amount (${currencySymbol})`, 'Note', 'Recurring', 'Interval'];
    const rows = sorted.map(t => [
      new Date(t.date).toISOString().split('T')[0],
      t.category,
      t.type,
      t.amount,
      (t.amount * currencyRate).toFixed(2),
      t.note || '',
      t.isRecurring ? 'Yes' : 'No',
      t.recurrenceInterval || 'none'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `finsight_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print PDF helper
  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="rounded-2xl glass-panel border border-card-border overflow-hidden flex flex-col h-[520px] print-table-container">
      {/* Header and Search */}
      <div className="p-5 border-b border-card-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 print:hidden">
        <div>
          <h3 className="text-base font-semibold text-text-title">Transaction History</h3>
          <p className="text-xs text-text-muted mt-0.5">
            Showing {sorted.length} {sorted.length === 1 ? 'transaction' : 'transactions'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 max-w-lg w-full sm:justify-end">
          <div className="relative flex-1 min-w-[150px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-input-border rounded-xl pl-9 pr-4 py-2 text-xs text-text-title placeholder-slate-600 dark:placeholder-slate-600/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          <button
            onClick={handleExportCSV}
            disabled={sorted.length === 0}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-text-title bg-btn-secondary border border-btn-secondary-border hover:bg-btn-secondary-hover transition-all cursor-pointer disabled:opacity-40"
            title="Export to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">CSV</span>
          </button>

          <button
            onClick={handlePrintPDF}
            disabled={sorted.length === 0}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-text-title bg-btn-secondary border border-btn-secondary-border hover:bg-btn-secondary-hover transition-all cursor-pointer disabled:opacity-40"
            title="Export Report PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden md:inline">PDF</span>
          </button>
        </div>
      </div>

      {/* Printing Title (visible only during media printing) */}
      <div className="hidden print:block p-6 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-900">FinSight Ledger Report</h2>
        <p className="text-xs text-slate-500 mt-1">Generated on {new Date().toLocaleDateString()}</p>
      </div>

      {/* Table container */}
      <div className="flex-1 min-h-0 overflow-y-auto print:overflow-visible">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            <span className="text-xs text-text-muted">Loading ledger logs...</span>
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-10 text-center">
            <AlertCircle className="w-8 h-8 text-slate-600 mb-2" />
            <p className="text-sm text-text-muted">No transactions recorded.</p>
            <p className="text-xs text-text-muted/65 mt-1">Start by logging a transaction or reset filters.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-text-title print:text-slate-900">
            <thead className="text-[10px] font-semibold text-text-muted bg-table-header-bg sticky top-0 backdrop-blur-md border-b border-card-border z-10 print:bg-slate-100 print:text-slate-700 print:border-slate-300">
              <tr>
                <th className="py-4 px-5">
                  <button
                    onClick={handleSort}
                    className="flex items-center gap-1.5 hover:text-text-title transition-all cursor-pointer font-semibold uppercase tracking-wider text-[10px] print:pointer-events-none print:hover:text-slate-700"
                  >
                    Date
                    <ArrowUpDown className="w-3.5 h-3.5 text-primary print:hidden" />
                  </button>
                </th>
                <th className="py-4 px-5 uppercase tracking-wider">Category</th>
                <th className="py-4 px-5 uppercase tracking-wider">Type</th>
                <th className="py-4 px-5 uppercase tracking-wider text-right">Amount</th>
                <th className="py-4 px-5 uppercase tracking-wider">Note</th>
                <th className="py-4 px-5 text-center uppercase tracking-wider w-24 print:hidden">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border text-sm print:divide-slate-200">
              {sorted.map((t) => {
                const isExpense = t.type === 'expense';
                const isConfirming = deletingId === t._id;
                
                return (
                  <tr
                    key={t._id}
                    className={`hover:bg-table-row-hover transition-colors duration-150 print:hover:bg-transparent ${
                      isConfirming ? 'bg-rose-500/5' : ''
                    }`}
                  >
                    {/* Date */}
                    <td className="py-4 px-5 whitespace-nowrap font-medium text-text-title print:text-slate-800">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0 print:hidden" />
                        {formatDate(t.date)}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-badge-bg border border-card-border text-text-title print:bg-slate-100 print:border-slate-300 print:text-slate-800">
                        {t.category}
                      </span>
                    </td>

                    {/* Type */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          isExpense
                            ? 'bg-expense/10 border-expense/20 text-expense print:bg-transparent print:border-rose-300 print:text-rose-700'
                            : 'bg-income/10 border-income/20 text-income print:bg-transparent print:border-emerald-300 print:text-emerald-700'
                        }`}
                      >
                        {isExpense ? 'Expense' : 'Income'}
                        {t.isRecurring && (
                          <span className="flex items-center gap-0.5 text-[9px] opacity-75 ml-1 border-l pl-1 border-current">
                            <Repeat className="w-2.5 h-2.5" />
                            {t.recurrenceInterval}
                          </span>
                        )}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className={`py-4 px-5 whitespace-nowrap text-right font-bold tabular-nums ${
                      isExpense ? 'text-expense print:text-rose-700' : 'text-income print:text-emerald-700'
                    }`}>
                      {isExpense ? '-' : '+'}{formatCurrency(convertVal(t.amount))}
                    </td>

                    {/* Note */}
                    <td className="py-4 px-5 text-text-muted print:text-slate-600 max-w-xs truncate" title={t.note}>
                      {t.note || <span className="text-text-muted/65 italic text-xs print:text-slate-400">No note</span>}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-center whitespace-nowrap relative print:hidden">
                      {isConfirming ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleConfirmDelete(t._id)}
                            className="px-2 py-0.5 bg-expense hover:bg-expense/90 text-white rounded text-[10px] font-bold cursor-pointer transition-all"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="px-2 py-0.5 bg-btn-secondary text-text-title border border-btn-secondary-border rounded text-[10px] font-medium cursor-pointer transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onEditSelect(t)}
                            className="p-1.5 hover:bg-btn-secondary hover:text-text-title border border-transparent rounded-lg text-text-muted cursor-pointer transition-all animate-fade-in"
                            title="Edit transaction"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(t._id)}
                            className="p-1.5 hover:bg-expense/10 hover:text-expense border border-transparent rounded-lg text-text-muted cursor-pointer transition-all"
                            title="Delete transaction"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
export default TransactionTable;

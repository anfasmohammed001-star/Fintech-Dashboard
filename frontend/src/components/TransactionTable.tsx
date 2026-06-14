'use client';

import React, { useState } from 'react';
import { ArrowUpDown, Trash2, Search, ArrowUpRight, ArrowDownRight, Calendar, AlertCircle, Edit, Download, Printer, Repeat } from 'lucide-react';
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
    <div className="rounded-2xl glass-panel border border-white/5 overflow-hidden flex flex-col h-[520px] print-table-container">
      {/* Header and Search */}
      <div className="p-5 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 print:hidden">
        <div>
          <h3 className="text-base font-semibold text-slate-200">Transaction History</h3>
          <p className="text-xs text-slate-400 mt-0.5">
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
              className="w-full bg-slate-900/60 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          <button
            onClick={handleExportCSV}
            disabled={sorted.length === 0}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all cursor-pointer disabled:opacity-40"
            title="Export to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">CSV</span>
          </button>

          <button
            onClick={handlePrintPDF}
            disabled={sorted.length === 0}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all cursor-pointer disabled:opacity-40"
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
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
            <span className="text-xs text-slate-400">Loading ledger logs...</span>
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-10 text-center">
            <AlertCircle className="w-8 h-8 text-slate-600 mb-2" />
            <p className="text-sm text-slate-400">No transactions recorded.</p>
            <p className="text-xs text-slate-500 mt-1">Start by logging a transaction or reset filters.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-slate-300 print:text-slate-900">
            <thead className="text-[10px] font-semibold text-slate-400 bg-slate-900/20 sticky top-0 backdrop-blur-md border-b border-white/5 z-10 print:bg-slate-100 print:text-slate-700 print:border-slate-300">
              <tr>
                <th className="py-4 px-5">
                  <button
                    onClick={handleSort}
                    className="flex items-center gap-1.5 hover:text-white transition-all cursor-pointer font-semibold uppercase tracking-wider text-[10px] print:pointer-events-none print:hover:text-slate-700"
                  >
                    Date
                    <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400 print:hidden" />
                  </button>
                </th>
                <th className="py-4 px-5 uppercase tracking-wider">Category</th>
                <th className="py-4 px-5 uppercase tracking-wider">Type</th>
                <th className="py-4 px-5 uppercase tracking-wider text-right">Amount</th>
                <th className="py-4 px-5 uppercase tracking-wider">Note</th>
                <th className="py-4 px-5 text-center uppercase tracking-wider w-24 print:hidden">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm print:divide-slate-200">
              {sorted.map((t) => {
                const isExpense = t.type === 'expense';
                const isConfirming = deletingId === t._id;
                
                return (
                  <tr
                    key={t._id}
                    className={`hover:bg-white/2 transition-colors duration-150 print:hover:bg-transparent ${
                      isConfirming ? 'bg-rose-500/5' : ''
                    }`}
                  >
                    {/* Date */}
                    <td className="py-4 px-5 whitespace-nowrap font-medium text-slate-300 print:text-slate-800">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0 print:hidden" />
                        {formatDate(t.date)}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-900 border border-white/5 text-slate-300 print:bg-slate-100 print:border-slate-300 print:text-slate-800">
                        {t.category}
                      </span>
                    </td>

                    {/* Type */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          isExpense
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 print:bg-transparent print:border-rose-300 print:text-rose-700'
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 print:bg-transparent print:border-emerald-300 print:text-emerald-700'
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
                      isExpense ? 'text-rose-400 print:text-rose-700' : 'text-emerald-400 print:text-emerald-700'
                    }`}>
                      {isExpense ? '-' : '+'}{formatCurrency(convertVal(t.amount))}
                    </td>

                    {/* Note */}
                    <td className="py-4 px-5 text-slate-400 print:text-slate-600 max-w-xs truncate" title={t.note}>
                      {t.note || <span className="text-slate-600 italic text-xs print:text-slate-400">No note</span>}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-center whitespace-nowrap relative print:hidden">
                      {isConfirming ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleConfirmDelete(t._id)}
                            className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold cursor-pointer transition-all"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-medium cursor-pointer transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onEditSelect(t)}
                            className="p-1.5 hover:bg-white/5 hover:text-slate-200 border border-transparent rounded-lg text-slate-500 cursor-pointer transition-all animate-fade-in"
                            title="Edit transaction"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(t._id)}
                            className="p-1.5 hover:bg-rose-500/10 hover:text-rose-400 border border-transparent rounded-lg text-slate-500 cursor-pointer transition-all"
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

'use client';

import React from 'react';
import { Filter, RotateCcw, Calendar, FolderOpen } from 'lucide-react';
import { FilterParams } from '../services/api';

interface FiltersProps {
  filters: FilterParams;
  onChange: (filters: FilterParams) => void;
  availableCategories: string[];
}

export const Filters: React.FC<FiltersProps> = ({ filters, onChange, availableCategories }) => {
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, category: e.target.value });
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, startDate: e.target.value });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, endDate: e.target.value });
  };

  const handleReset = () => {
    onChange({ category: 'All', startDate: '', endDate: '' });
  };

  // Ensure default categories exist, merge with custom ones, and remove duplicates
  const defaults = ['Food', 'Travel', 'Shopping', 'Bills', 'Salary', 'Freelance'];
  const allCategories = Array.from(new Set([...defaults, ...availableCategories]));
  const categoriesList = ['All', ...allCategories.sort()];

  return (
    <div className="rounded-2xl glass-panel p-5 border border-card-border flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-text-title">
        <Filter className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Filter Transactions</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 max-w-3xl">
        {/* Category selector */}
        <div className="relative">
          <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <select
            value={filters.category || 'All'}
            onChange={handleCategoryChange}
            className="w-full bg-[var(--input-bg)] border border-input-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text-title focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer"
          >
            {categoriesList.map(cat => (
              <option key={cat} value={cat} className="bg-[var(--card-bg)] text-[var(--foreground)]">
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Start date */}
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            type="date"
            placeholder="Start Date"
            value={filters.startDate || ''}
            onChange={handleStartDateChange}
            className="w-full bg-[var(--input-bg)] border border-input-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text-title focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer"
          />
        </div>

        {/* End date */}
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            type="date"
            placeholder="End Date"
            value={filters.endDate || ''}
            onChange={handleEndDateChange}
            className="w-full bg-[var(--input-bg)] border border-input-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text-title focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer"
          />
        </div>
      </div>

      <button
        onClick={handleReset}
        className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-text-title bg-btn-secondary border border-btn-secondary-border hover:bg-btn-secondary-hover transition-all cursor-pointer active:scale-95 shrink-0"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Reset Filters
      </button>
    </div>
  );
};
export default Filters;

import React from 'react';
import { ArrowUpRight, ArrowDownRight, Wallet, Award } from 'lucide-react';
import { FinancialSummary } from '../types';

interface SummaryCardsProps {
  summary: FinancialSummary;
  isLoading: boolean;
  currencySymbol: string;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary, isLoading, currencySymbol }) => {
  const formatCurrency = (val: number) => {
    return `${currencySymbol}${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  const cards = [
    {
      title: 'Total Income',
      value: isLoading ? '...' : formatCurrency(summary.totalIncome),
      icon: ArrowUpRight,
      colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      glowClass: 'bg-emerald-500/10',
    },
    {
      title: 'Total Expenses',
      value: isLoading ? '...' : formatCurrency(summary.totalExpense),
      icon: ArrowDownRight,
      colorClass: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      glowClass: 'bg-rose-500/10',
    },
    {
      title: 'Net Balance',
      value: isLoading ? '...' : formatCurrency(summary.netBalance),
      icon: Wallet,
      colorClass: summary.netBalance >= 0 ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      glowClass: summary.netBalance >= 0 ? 'bg-indigo-500/10' : 'bg-rose-500/10',
    },
    {
      title: 'Top Category',
      value: isLoading ? '...' : summary.topCategory,
      icon: Award,
      colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      glowClass: 'bg-amber-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <div
            key={idx}
            className="relative overflow-hidden rounded-2xl glass-panel glass-panel-hover p-6 border border-white/5"
          >
            <div className={`absolute -right-4 -bottom-4 w-20 h-20 rounded-full blur-2xl ${card.glowClass} opacity-30`} />
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">{card.title}</span>
              <div className={`p-2.5 rounded-xl border ${card.colorClass}`}>
                <IconComponent className="w-5 h-5" />
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="text-2xl font-bold tracking-tight text-white leading-none">
                {card.value}
              </h3>
            </div>
          </div>
        );
      })}
    </div>
  );
};
export default SummaryCards;

import React from 'react';
import { Info, AlertTriangle, CheckCircle2, ShieldAlert, Lightbulb } from 'lucide-react';
import { FinancialInsight } from '../types';

interface InsightCardProps {
  insight: FinancialInsight | null;
  isLoading: boolean;
}

export const InsightCard: React.FC<InsightCardProps> = ({ insight, isLoading }) => {
  if (isLoading) {
    return (
      <div className="rounded-2xl glass-panel p-6 border border-white/5 h-[120px] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          <span className="text-sm text-slate-400">Evaluating insights...</span>
        </div>
      </div>
    );
  }

  if (!insight) {
    return (
      <div className="rounded-2xl glass-panel p-6 border border-white/5 h-[120px] flex items-center justify-center">
        <p className="text-sm text-slate-400">No insight data available.</p>
      </div>
    );
  }

  // Determine styles and icon based on insight type
  let cardStyles = '';
  let iconStyles = '';
  let IconComponent = Lightbulb;
  let title = 'Financial Insight';

  switch (insight.type) {
    case 'success':
      cardStyles = 'border-emerald-500/20 bg-emerald-950/5';
      iconStyles = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      IconComponent = CheckCircle2;
      title = 'Healthy Savings Alert';
      break;
    case 'warning':
      cardStyles = 'border-amber-500/20 bg-amber-950/5';
      iconStyles = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      IconComponent = AlertTriangle;
      title = 'Spending Alert';
      break;
    case 'danger':
      cardStyles = 'border-rose-500/20 bg-rose-950/5';
      iconStyles = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      IconComponent = ShieldAlert;
      title = 'Overspending Alert';
      break;
    case 'info':
    default:
      cardStyles = 'border-indigo-500/20 bg-indigo-950/5';
      iconStyles = 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
      IconComponent = Info;
      title = 'System Advisory';
      break;
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl glass-panel p-6 border transition-all duration-300 ${cardStyles}`}>
      <div className="flex gap-4 items-start relative z-10">
        <div className={`p-3 rounded-xl border shrink-0 ${iconStyles}`}>
          <IconComponent className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</h4>
          <p className="text-slate-200 text-sm leading-relaxed font-medium">
            {insight.message}
          </p>
        </div>
      </div>
    </div>
  );
};
export default InsightCard;

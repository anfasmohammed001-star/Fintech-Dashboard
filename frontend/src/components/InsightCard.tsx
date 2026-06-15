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
      <div className="rounded-2xl glass-panel p-6 border border-card-border h-[120px] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <span className="text-sm text-text-muted">Evaluating insights...</span>
        </div>
      </div>
    );
  }

  if (!insight) {
    return (
      <div className="rounded-2xl glass-panel p-6 border border-card-border h-[120px] flex items-center justify-center">
        <p className="text-sm text-text-muted">No insight data available.</p>
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
      cardStyles = 'border-income/20 bg-income/5';
      iconStyles = 'text-income bg-income/10 border-income/20';
      IconComponent = CheckCircle2;
      title = 'Healthy Savings Alert';
      break;
    case 'warning':
      cardStyles = 'border-amber-500/20 bg-amber-500/5';
      iconStyles = 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20';
      IconComponent = AlertTriangle;
      title = 'Spending Alert';
      break;
    case 'danger':
      cardStyles = 'border-expense/20 bg-expense/5';
      iconStyles = 'text-expense bg-expense/10 border-expense/20';
      IconComponent = ShieldAlert;
      title = 'Overspending Alert';
      break;
    case 'info':
    default:
      cardStyles = 'border-primary/20 bg-primary/5';
      iconStyles = 'text-primary bg-primary/10 border-primary/20';
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
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">{title}</h4>
          <p className="text-text-title text-sm leading-relaxed font-medium">
            {insight.message}
          </p>
        </div>
      </div>
    </div>
  );
};
export default InsightCard;

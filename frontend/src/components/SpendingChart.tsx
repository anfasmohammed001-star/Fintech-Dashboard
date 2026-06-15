'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ChartDataPoint } from '../types';

interface SpendingChartProps {
  data: ChartDataPoint[];
  isLoading: boolean;
  isLightMode?: boolean;
}

const DARK_COLORS = [
  '#6366f1', // Indigo
  '#f43f5e', // Rose
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
  '#a855f7', // Purple
  '#3b82f6', // Blue
];

const LIGHT_COLORS = [
  '#1d4ed8', // Primary Palette 1 Blue
  '#e24b4a', // Expense Palette 1 Red
  '#1d9e75', // Income Palette 1 Green
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
  '#a855f7', // Purple
  '#3b82f6', // Blue
];

export const SpendingChart: React.FC<SpendingChartProps> = ({ data, isLoading, isLightMode = false }) => {
  const hasData = data && data.length > 0;
  const total = data.reduce((sum, item) => sum + item.amount, 0);
  
  const colorsList = isLightMode ? LIGHT_COLORS : DARK_COLORS;

  const formatCurrency = (val: number) => {
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const pData = payload[0].payload;
      const percentage = total > 0 ? ((pData.amount / total) * 100).toFixed(1) : '0.0';
      return (
        <div className="glass-panel border border-card-border px-4 py-3 rounded-xl shadow-2xl">
          <p className="text-sm font-semibold text-text-title">{pData.category}</p>
          <div className="flex items-center gap-3 mt-1 text-xs">
            <span className="text-primary font-bold">{formatCurrency(pData.amount)}</span>
            <span className="text-text-muted">({percentage}%)</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl glass-panel p-6 border border-card-border h-[340px] flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-text-title">Spending by Category</h3>
        {!isLoading && hasData && (
          <span className="text-xs text-text-muted font-medium">
            Total Expense: <span className="text-expense font-semibold">{formatCurrency(total)}</span>
          </span>
        )}
      </div>

      <div className="flex-1 min-h-0 flex items-center justify-center">
        {isLoading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            <span className="text-xs text-text-muted">Loading chart data...</span>
          </div>
        ) : !hasData ? (
          <div className="text-center py-10">
            <p className="text-sm text-text-muted">No expense data to display.</p>
            <p className="text-xs text-text-muted/65 mt-1">Add expense transactions to see chart analysis.</p>
          </div>
        ) : (
          <div className="w-full h-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="amount"
                  nameKey="category"
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={colorsList[index % colorsList.length]} 
                      stroke={isLightMode ? '#ffffff' : 'rgba(15, 23, 42, 0.5)'}
                      strokeWidth={2}
                      className="outline-none"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  iconSize={8}
                  formatter={(value, entry: any) => {
                    const payload = entry.payload;
                    const percent = total > 0 ? ((payload.amount / total) * 100).toFixed(0) : '0';
                    return <span className="text-xs text-text-title font-medium">{value} ({percent}%)</span>;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Total label inside Donut */}
            <div className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center">
              <span className="text-[9px] uppercase tracking-wider text-text-muted font-medium">Expenses</span>
              <p className="text-base font-bold text-text-title leading-tight mt-0.5">
                {total > 100000 ? `₹${(total / 1000).toFixed(1)}k` : formatCurrency(total)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default SpendingChart;

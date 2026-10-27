import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  variant?: 'blue' | 'emerald' | 'purple' | 'slate';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon,
  variant = 'blue',
}) => {
  const iconBgs = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {label}
        </p>
        <p className="text-2xl font-bold text-slate-900 mt-1 tracking-tight font-mono">
          {value}
        </p>
        {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
      </div>
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center border shrink-0 ${iconBgs[variant]}`}
      >
        {icon}
      </div>
    </div>
  );
};

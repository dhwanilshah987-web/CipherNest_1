import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  padding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  action,
  padding = true,
}) => {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-sm transition-all ${className}`}
    >
      {(title || subtitle || action) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            {title && (
              <h3 className="text-sm font-semibold text-slate-900 tracking-tight flex items-center gap-2">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={padding ? 'p-6' : ''}>{children}</div>
    </div>
  );
};

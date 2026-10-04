import React from 'react';

export const StatsCard = ({ title, value, subtitle, icon: Icon, trend, trendLabel, color = 'chai' }) => {
  return (
    <div className="card p-5 relative overflow-hidden transition-all duration-200 hover:border-chai-300">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-[#7C7467]">{title}</p>
          <h3 className="text-2xl font-bold tracking-tight text-[#230E03]">{value}</h3>
          {subtitle && <p className="text-xs text-[#A8A193]">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-chai-50 border border-chai-100 flex items-center justify-center text-chai-800 flex-shrink-0">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {trend !== undefined && (
        <div className="mt-3.5 pt-3 border-t border-[#F3EFEA] flex items-center gap-1.5 text-xs">
          <span
            className={`font-semibold ${
              trend >= 0 ? 'text-emerald-700' : 'text-red-600'
            }`}
          >
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
          {trendLabel && <span className="text-[#7C7467]">{trendLabel}</span>}
        </div>
      )}
    </div>
  );
};

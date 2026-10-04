import React from 'react';
import { Calendar } from 'lucide-react';

export const DateFilter = ({ value, onChange, customStart, customEnd, onCustomChange }) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative inline-flex items-center">
        <Calendar className="w-4 h-4 absolute left-3 text-[#7C7467] pointer-events-none" />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-9 pr-8 py-2 bg-white border border-[#E8E2D8] rounded-lg text-sm text-[#230E03] focus:outline-none focus:ring-2 focus:ring-chai-700/20 focus:border-chai-700 font-medium cursor-pointer"
        >
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="this_week">This Week</option>
          <option value="last_week">Last Week</option>
          <option value="this_month">This Month</option>
          <option value="last_month">Last Month</option>
          <option value="custom">Custom Range</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {value === 'custom' && (
        <div className="flex items-center gap-2 animate-in fade-in">
          <input
            type="date"
            value={customStart || ''}
            onChange={(e) => onCustomChange && onCustomChange(e.target.value, customEnd)}
            className="px-2.5 py-1.5 bg-white border border-[#E8E2D8] rounded-lg text-xs text-[#230E03] focus:outline-none focus:border-chai-700"
          />
          <span className="text-xs text-[#7C7467]">to</span>
          <input
            type="date"
            value={customEnd || ''}
            onChange={(e) => onCustomChange && onCustomChange(customStart, e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-[#E8E2D8] rounded-lg text-xs text-[#230E03] focus:outline-none focus:border-chai-700"
          />
        </div>
      )}
    </div>
  );
};

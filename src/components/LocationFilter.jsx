import React from 'react';
import { MapPin } from 'lucide-react';

export const LocationFilter = ({ locations = [], value, onChange }) => {
  return (
    <div className="relative inline-flex items-center">
      <MapPin className="w-4 h-4 absolute left-3 text-[#7C7467] pointer-events-none" />
      <select
        value={value || 'all'}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 pr-8 py-2 bg-white border border-[#E8E2D8] rounded-lg text-sm text-[#230E03] focus:outline-none focus:ring-2 focus:ring-chai-700/20 focus:border-chai-700 font-medium cursor-pointer"
      >
        <option value="all">All Locations</option>
        {locations.map((loc) => (
          <option key={loc.id} value={loc.id}>
            {loc.name}
          </option>
        ))}
      </select>
    </div>
  );
};

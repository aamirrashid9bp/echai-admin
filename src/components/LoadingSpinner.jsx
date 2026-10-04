import React from 'react';

export const LoadingSpinner = ({ label = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-8 h-8 border-3 border-chai-200 border-t-chai-800 rounded-full animate-spin" />
      <span className="text-xs font-medium text-[#7C7467]">{label}</span>
    </div>
  );
};

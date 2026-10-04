import React from 'react';
import { FolderOpen } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = FolderOpen,
  title = 'No records found',
  description = 'There are no entries to display for the selected criteria.',
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-[#E8E2D8] rounded-xl bg-[#FAF9F6] my-4">
      <div className="w-12 h-12 rounded-xl bg-chai-50 text-chai-700 flex items-center justify-center mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-[#230E03] mb-1">{title}</h3>
      <p className="text-xs text-[#7C7467] max-w-sm mb-4 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-primary">
          {actionLabel}
        </button>
      )}
    </div>
  );
};

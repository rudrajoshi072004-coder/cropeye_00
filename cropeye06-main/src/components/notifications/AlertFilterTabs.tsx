import React from 'react';

export type AlertFilter = 'All' | 'Critical' | 'Crop Health' | 'Irrigation' | 'Pest/Disease';

interface AlertFilterTabsProps {
  currentFilter: AlertFilter;
  onFilterChange: (filter: AlertFilter) => void;
}

export const AlertFilterTabs: React.FC<AlertFilterTabsProps> = ({ currentFilter, onFilterChange }) => {
  const tabs: AlertFilter[] = ['All', 'Critical', 'Crop Health', 'Irrigation', 'Pest/Disease'];

  return (
    <div className="flex overflow-x-auto gap-2 p-3 bg-gray-50 border-b border-gray-200 scrollbar-hide">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onFilterChange(tab)}
          className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
            currentFilter === tab
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

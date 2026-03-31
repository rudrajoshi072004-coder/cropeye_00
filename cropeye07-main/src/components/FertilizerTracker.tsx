// FertilizerTracker.tsx
import React, { useState } from 'react';
import FertilizerTable from './FertilizerTable';

const FertilizerTracker: React.FC = () => {
  const [selectedWeek, setSelectedWeek] = useState<number>(1);

  return (
    <div className="p-4">
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700">Select Week:</label>
        <select
          value={selectedWeek}
          onChange={(e) => setSelectedWeek(Number(e.target.value))}
          className="ml-2 p-2 border border-gray-300 rounded"
        >
          {Array.from({ length: 52 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              Week {i + 1}
            </option>
          ))}
        </select>
      </div>

      <FertilizerTable selectedWeek={selectedWeek} />
    </div>
  );
};

export default FertilizerTracker;

import React from 'react';

interface SingleCategoryRiskMeterProps {
  category: 'Pests' | 'Diseases' | 'Weeds';
  highCount: number;
  moderateCount: number;
  lowCount: number;
  // icon: string;
  onRiskClick?: (category: 'Pests' | 'Diseases' | 'Weeds', level: 'High' | 'Moderate' | 'Low') => void;
  selectedCategory?: 'Pests' | 'Diseases' | 'Weeds' | null;
  selectedRiskLevel?: 'High' | 'Moderate' | 'Low' | null;
}

export const SingleCategoryRiskMeter: React.FC<SingleCategoryRiskMeterProps> = ({
  category,
  highCount,
  moderateCount,
  lowCount,
  onRiskClick,
  selectedCategory,
  selectedRiskLevel
}) => {
  // Calculate needle angle based on risk level
  const getNeedleAngle = () => {
    if (highCount > 0) {
      // High risk: needle points to red zone (right side, 45 to 90 degrees)
      const percentage = Math.min((highCount / 5) * 100, 100);
      return 45 + (percentage * 0.45); // 45 to 90 degrees
    } else if (moderateCount > 0) {
      // Moderate risk: needle points to yellow zone (middle, -15 to 45 degrees)
      const percentage = Math.min((moderateCount / 5) * 100, 100);
      return -15 + (percentage * 0.6); // -15 to 45 degrees
    } else {
      // Low risk: needle points to green zone (left side, -90 to -15 degrees)
      const percentage = Math.min((lowCount / 5) * 100, 100);
      return -90 + (percentage * 0.75); // -90 to -15 degrees
    }
  };

  const needleAngle = getNeedleAngle();

  // Get category-specific colors
  const getCategoryConfig = () => {
    switch (category) {
      case 'Pests':
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-600',
          gradientId: 'pests-gradient'
        };
      case 'Diseases':
        return {
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          textColor: 'text-purple-600',
          gradientId: 'diseases-gradient'
        };
      case 'Weeds':
        return {
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-600',
          gradientId: 'weeds-gradient'
        };
    }
  };

  const config = getCategoryConfig();
  const totalCount = highCount + moderateCount + lowCount;

  return (
    <div className={`${config.bgColor} ${config.borderColor} border-2 rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-all duration-300 hover:shadow-xl`}>
      {/* Category Title */}
      <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
        {/* <span className="text-3xl">{icon}</span> */}
        <h3 className={`text-xl sm:text-2xl font-bold ${config.textColor}`}>{category}</h3>
      </div>

      {/* Risk Gauge */}
      <div className="relative w-full max-w-xs h-32 sm:h-40 mx-auto mb-3 sm:mb-4">
        <svg viewBox="0 0 200 120" className="w-full h-full">
          <defs>
            <linearGradient id={config.gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>

          {/* Background arc */}
          <path
            d="M 30 100 A 70 70 0 0 1 170 100"
            stroke="#e5e7eb"
            strokeWidth="20"
            fill="none"
            strokeLinecap="round"
          />

          {/* Colored arc (Green -> Yellow -> Red) */}
          <path
            d="M 30 100 A 70 70 0 0 1 170 100"
            stroke={`url(#${config.gradientId})`}
            strokeWidth="20"
            fill="none"
            strokeLinecap="round"
          />

          {/* Needle */}
          <g transform={`rotate(${needleAngle} 100 100)`} className="transition-transform duration-700 ease-out">
            <polygon points="100,35 104,95 100,100 96,95" fill="#1f2937" />
            <circle cx="100" cy="100" r="8" fill="#1f2937" />
            <circle cx="100" cy="100" r="4" fill="#ef4444" />
          </g>

          {/* Risk level labels */}
          <text x="30" y="118" textAnchor="middle" className="text-xs fill-green-600 font-bold">
            Low
          </text>
          {/* <text x="100" y="15" textAnchor="middle" className="text-xs fill-yellow-600 font-bold ">
            Moderate
          </text> */}
          <text x="170" y="118" textAnchor="middle" className="text-xs fill-red-600 font-bold">
            High
          </text>
        </svg>
      </div>

      {/* Risk Counts Display - Clickable */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-3 sm:mb-4">
        <button
          onClick={() => onRiskClick?.(category, 'High')}
          className={`text-center p-1.5 sm:p-2 rounded-md sm:rounded-lg transition-all ${
            selectedCategory === category && selectedRiskLevel === 'High'
              ? 'bg-red-100 ring-2 ring-red-500'
              : 'hover:bg-red-50'
          }`}
        >
          <div className="text-xl sm:text-2xl font-bold text-red-600">{highCount}</div>
          <div className="text-xs text-gray-600">High Risk</div>
        </button>
        <button
          onClick={() => onRiskClick?.(category, 'Moderate')}
          className={`text-center p-1.5 sm:p-2 rounded-md sm:rounded-lg transition-all ${
            selectedCategory === category && selectedRiskLevel === 'Moderate'
              ? 'bg-yellow-100 ring-2 ring-yellow-500'
              : 'hover:bg-yellow-50'
          }`}
        >
          <div className="text-xl sm:text-2xl font-bold text-yellow-600">{moderateCount}</div>
          <div className="text-xs text-gray-600">Moderate</div>
        </button>
        <button
          onClick={() => onRiskClick?.(category, 'Low')}
          className={`text-center p-1.5 sm:p-2 rounded-md sm:rounded-lg transition-all ${
            selectedCategory === category && selectedRiskLevel === 'Low'
              ? 'bg-green-100 ring-2 ring-green-500'
              : 'hover:bg-green-50'
          }`}
        >
          <div className="text-xl sm:text-2xl font-bold text-green-600">{lowCount}</div>
          <div className="text-xs text-gray-600">Low Risk</div>
        </button>
      </div>

      {/* Total Count */}
      <div className="text-center pt-3 sm:pt-4 border-t-2 border-gray-200">
        <div className={`text-2xl sm:text-3xl font-extrabold ${config.textColor}`}>{totalCount}</div>
        <div className="text-xs sm:text-sm text-gray-600 mt-1">Total Predicted</div>
      </div>
    </div>
  );
};

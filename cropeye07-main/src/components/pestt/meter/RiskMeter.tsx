import React from 'react';
import { RiskLevel } from '../meter/pest';

interface DiseaseTag {
  name: string;
  image?: string;
  months?: string[];
}

interface RiskMeterProps {
  riskLevel: RiskLevel;
  count: number;
  detectedPests?: string[];
  detectedDiseases?: DiseaseTag[];
}

export const RiskMeter: React.FC<RiskMeterProps> = ({
  riskLevel,
  count,
  detectedPests = [],
  detectedDiseases = [],
}) => {
  const getRiskConfig = () => {
    switch (riskLevel) {
      case 'high':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          gradientColors: ['#ef4444', '#dc2626', '#b91c1c'],
          gaugeColor: '#ef4444',
          title: 'High Risk',
          icon: '🚨',
        };
      case 'moderate':
        return {
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          gradientColors: ['#f97316', '#ea580c', '#c2410c'],
          gaugeColor: '#f97316',
          title: 'Moderate Risk',
          icon: '⚠️',
        };
      case 'low':
      default:
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          gradientColors: ['#22c55e', '#16a34a', '#15803d'],
          gaugeColor: '#22c55e',
          title: 'Low Risk',
          icon: '✅',
        };
    }
  };

  const config = getRiskConfig();
  const maxCount = 4;
  const percentage = Math.min((count / maxCount) * 100, 100);
  const needleAngle = -90 + percentage * 1.8; // -90 to 90

  return (
    <div
      className={`${config.bgColor} ${config.borderColor} border-2 rounded-2xl p-6 text-center transition-all duration-300 hover:shadow-xl hover:scale-[1.02] w-[340px] min-h-[380px] flex flex-col justify-between`}
    >
      {/* Gauge */}
      <div className="relative w-56 h-36 mx-auto">
        <svg viewBox="0 0 160 100" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id={`gauge-gradient-${riskLevel}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={config.gradientColors[0]} />
              <stop offset="50%" stopColor={config.gradientColors[1]} />
              <stop offset="100%" stopColor={config.gradientColors[2]} />
            </linearGradient>
            <filter id={`glow-${riskLevel}`}>
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background arc */}
          <path
            d="M 20 80 A 60 60 0 0 1 140 80"
            stroke="#e5e7eb"
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
          />

          {/* Foreground arc */}
          <path
            d="M 20 80 A 60 60 0 0 1 140 80"
            stroke={`url(#gauge-gradient-${riskLevel})`}
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${percentage * 1.88} 188`}
            filter={`url(#glow-${riskLevel})`}
            className="transition-all duration-1000 ease-out"
          />

          {/* Needle */}
          <g transform={`rotate(${needleAngle} 80 80)`} className="transition-transform duration-1000 ease-out">
            <polygon points="80,30 84,75 80,80 76,75" fill="#374151" stroke="#1f2937" strokeWidth="1" />
            <circle cx="80" cy="80" r="5" fill="#374151" stroke="#1f2937" strokeWidth="2" />
            <circle cx="80" cy="80" r="2.5" fill="#9ca3af" />
          </g>

          {/* Start Label */}
          <text x="20" y="95" textAnchor="middle" className="text-xs fill-gray-500 font-medium">
            0
          </text>
        </svg>
      </div>

      {/* Risk Title */}
      <div className="flex items-center justify-center gap-3 mt-4 mb-2">
        <span className="text-3xl">{config.icon}</span>
        <h3 className={`text-xl font-bold ${config.color}`}>{config.title}</h3>
      </div>

      {/* Message */}
      <p className="text-sm text-gray-700 mb-1">
        {count > 0 ? `Pests & Diseases detected` : 'No pest & Diseases detected'}
      </p>

      {/* Pest Tags */}
      {count > 0 && detectedPests.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1 mt-1 max-h-20 overflow-y-auto">
          {detectedPests.map((pest, idx) => (
            <span
              key={idx}
              className={`text-xs px-2 py-1 rounded-full bg-white border ${config.borderColor} max-w-full truncate`}
              title={pest}
            >
              {pest.length > 15 ? pest.substring(0, 15) + '...' : pest}
            </span>
          ))}
        </div>
      )}

      {/* Disease Tags */}
      {detectedDiseases.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1 mt-2 max-h-20 overflow-y-auto">
          {detectedDiseases.map((disease, idx) => (
            <span
              key={idx}
              className={`text-xs px-2 py-1 rounded-full bg-white border ${config.borderColor} max-w-full truncate`}
              title={disease.name}
            >
              {disease.name.length > 15 ? disease.name.substring(0, 15) + '...' : disease.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

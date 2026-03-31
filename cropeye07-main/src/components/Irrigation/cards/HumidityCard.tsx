
import React from 'react';
import { Droplets } from 'lucide-react';
import '../Irrigation.css';

interface HumidityCardProps {
  value: number;        // Current humidity %
  lastUpdated: Date;
}

const HumidityCard: React.FC<HumidityCardProps> = ({ value, lastUpdated }) => {
  /* ── Minutes since update ─────────────────────────────── */
  const minutesSinceUpdate = Math.floor(
    (Date.now() - lastUpdated.getTime()) / 60000
  );

  /* ── Status text & colour ─────────────────────────────── */
  const getStatusInfo = () => {
    if (value >= 60 && value <= 80)
      return { text: 'Within optimal range', className: 'text-green-500' };
    if (value < 60)
      return { text: 'Below optimal range', className: 'text-yellow-500' };
    return { text: 'Above optimal range', className: 'text-orange-500' };
  };
  const statusInfo = getStatusInfo();

  /* ── Range band label (0-40, 40-80, 80-100) ───────────── */
  const getRangeLabel = () => {
    if (value < 40) return '0–40 %';
    if (value < 80) return '40–80 %';
    return '80–100 %';
  };

  /* ── Render ───────────────────────────────────────────── */
  return (
    <div className="irrigation-card">
      {/* Header */}
      <div className="card-header">
        <Droplets className="card-icon" size={24} />
        <h3 className="font-semibold">Humidity</h3>
      </div>

      {/* Content */}
      <div className="card-content humidity">
        <div className="humidity-icon">
          <Droplets size={80} color="#4287f5" />
        </div>

        {/* Numeric value */}
        <div className="metric-value">
          <span className="value">{value}</span>
          <span className="unit">%</span>
        </div>

        {/* Status */}
        <div className="humidity-status">
          <span className={statusInfo.className}>{statusInfo.text}</span>
        </div>

        {/* Simple range band */}
        <div className="humidity-range-label">
          Range:&nbsp;{getRangeLabel()}
        </div>

      </div>
    </div>
  );
};

export default HumidityCard;

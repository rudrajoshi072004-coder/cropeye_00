
import React from 'react';
import {
  Thermometer, Droplets, MapPin, RefreshCw,
  Wind, Eye, Sun, GaugeCircle
} from 'lucide-react';
import { WeatherData } from '../meter/pest';

interface WeatherCardProps {
  weather: WeatherData;
  onRefresh: () => void;
  isLoading: boolean;
}

export const WeatherCard: React.FC<WeatherCardProps> = ({ weather, onRefresh, isLoading }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">weather Status</h2>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Location */}
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-green-500" />
        <span className="text-md font-medium text-gray-700">{weather.location}</span>
      </div>

      {/* Weather Cards */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {[
          {
            label: 'Temperature',
            icon: <Thermometer className="text-red-600 w-5 h-5" />,
            value: `${weather.temperature.toFixed(1)}°C`,
            bg: 'bg-red-100'
          },
          {
            label: 'Humidity',
            icon: <Droplets className="text-blue-600 w-5 h-5" />,
            value: `${weather.humidity}%`,
            bg: 'bg-blue-100'
          },
          {
            label: 'Wind',
            icon: <Wind className="text-green-600 w-5 h-5" />,
            value: `${weather.wind_kph} kph ${weather.wind_dir}`,
            bg: 'bg-green-100'
          },
          {
            label: 'Pressure',
            icon: <GaugeCircle className="text-yellow-600 w-5 h-5" />,
            value: `${weather.pressure_mb} mb`,
            bg: 'bg-yellow-100'
          },
          {
            label: 'Visibility',
            icon: <Eye className="text-purple-600 w-5 h-5" />,
            value: `${weather.visibility_km} km`,
            bg: 'bg-purple-100'
          },
          {
            label: 'UV Index',
            icon: <Sun className="text-pink-600 w-5 h-5" />,
            value: `${weather.uv}`,
            bg: 'bg-pink-100'
          }
        ].map((card, index) => (
          <div
            key={index}
            className={`min-w-[160px] ${card.bg} rounded-lg p-4 flex-shrink-0 flex flex-col items-center justify-center text-center`}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              {card.icon}
              <p className="text-xl font-bold text-gray-700">{card.label}</p>
            </div>
            <p className="text-lg font-bold text-gray-800">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

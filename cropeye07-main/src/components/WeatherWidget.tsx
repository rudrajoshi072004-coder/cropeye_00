import React, { useEffect, useState } from 'react';
import { Cloud, Thermometer, Wind, Eye, Gauge, Droplet, AirVent } from 'lucide-react';

const API_URL = "http://api.weatherapi.com/v1/current.json?key=63e31ed27cf649b78c554210250404&q=Nasik&aqi=yes";

export const WeatherWidget: React.FC = () => {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(API_URL)
      .then(response => response.json())
      .then(data => {
        setWeather(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch weather data");
        setLoading(false);
      });
  }, []);

  const containerClasses = "bg-white rounded-xl shadow-lg p-6 w-full max-w-md min-h-[320px]";

  if (loading) return <div className={containerClasses}>Loading...</div>;
  if (error) return <div className={`${containerClasses} text-red-500`}>{error}</div>;

  return (
    <div className={containerClasses}>
      <h3 className="text-xl font-bold mb-4 text-gray-800">Weather Data</h3>
      <div className="space-y-2 text-sm text-gray-700">
        <div className="flex items-center"><Thermometer className="mr-2" />Temperature: {weather?.current?.temp_c || 'N/A'}°C</div>
        <div className="flex items-center"><Cloud className="mr-2" />Humidity: {weather?.current?.humidity || 'N/A'}%</div>
        <div className="flex items-center"><Wind className="mr-2" />Wind Speed: {weather?.current?.wind_kph || 'N/A'} km/h</div>
        <div className="flex items-center"><Droplet className="mr-2" />Precipitation: {weather?.current?.precip_mm || 'N/A'} mm</div>
        <div className="flex items-center"><AirVent className="mr-2" />Air Quality: {weather?.current?.air_quality?.pm2_5 || 'N/A'}</div>
        <div className="flex items-center"><Eye className="mr-2" />Visibility: {weather?.current?.vis_km || 'N/A'} km</div>
        <div className="flex items-center"><Gauge className="mr-2" />Pressure: {weather?.current?.pressure_mb || 'N/A'} mb</div>
        <div className="flex items-center"><Thermometer className="mr-2" />Dew Point: {weather?.current?.dewpoint_c || 'N/A'}°C</div>
      </div>
    </div>
  );
};

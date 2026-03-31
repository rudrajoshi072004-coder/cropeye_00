import React, { useState, useMemo } from "react";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface WeatherData {
  date: string;
  month: string;
  precipitation: number;
  tempHigh: number;
  tempAvg: number;
  tempMin: number;
  wind: number;
  highHumidity: number;
  lowHumidity: number;
}

type TimePeriod = "daily" | "weekly" | "monthly" | "yearly";

interface WeatherChartProps {
  timePeriod: TimePeriod;
}

const WeatherChart: React.FC<WeatherChartProps> = ({ timePeriod }) => {
  // State for legend selection
  const [visibleMetrics, setVisibleMetrics] = useState({
    precipitation: true,
    tempHigh: true,
    tempAvg: true,
    tempMin: true,
    wind: true,
    highHumidity: true,
    lowHumidity: true,
  });
  // Extended weather data with dates for aggregation
  const rawData: WeatherData[] = [
    {
      date: "2024-01-15",
      month: "Jan 2024",
      precipitation: 15,
      tempHigh: 28,
      tempAvg: 22,
      tempMin: 16,
      wind: 12,
      highHumidity: 75,
      lowHumidity: 45,
    },
    {
      date: "2024-01-22",
      month: "Jan 2024",
      precipitation: 18,
      tempHigh: 26,
      tempAvg: 20,
      tempMin: 14,
      wind: 10,
      highHumidity: 78,
      lowHumidity: 42,
    },
    {
      date: "2024-02-05",
      month: "Feb 2024",
      precipitation: 22,
      tempHigh: 30,
      tempAvg: 24,
      tempMin: 18,
      wind: 14,
      highHumidity: 82,
      lowHumidity: 48,
    },
    {
      date: "2024-02-12",
      month: "Feb 2024",
      precipitation: 20,
      tempHigh: 29,
      tempAvg: 23,
      tempMin: 17,
      wind: 13,
      highHumidity: 80,
      lowHumidity: 46,
    },
    {
      date: "2024-03-05",
      month: "Mar 2024",
      precipitation: 25,
      tempHigh: 32,
      tempAvg: 26,
      tempMin: 20,
      wind: 15,
      highHumidity: 80,
      lowHumidity: 50,
    },
    {
      date: "2024-03-12",
      month: "Mar 2024",
      precipitation: 28,
      tempHigh: 34,
      tempAvg: 28,
      tempMin: 22,
      wind: 16,
      highHumidity: 85,
      lowHumidity: 52,
    },
    {
      date: "2024-04-02",
      month: "Apr 2024",
      precipitation: 30,
      tempHigh: 36,
      tempAvg: 30,
      tempMin: 24,
      wind: 17,
      highHumidity: 88,
      lowHumidity: 54,
    },
    {
      date: "2024-04-09",
      month: "Apr 2024",
      precipitation: 32,
      tempHigh: 37,
      tempAvg: 31,
      tempMin: 25,
      wind: 18,
      highHumidity: 90,
      lowHumidity: 56,
    },
    {
      date: "2024-05-07",
      month: "May 2024",
      precipitation: 35,
      tempHigh: 38,
      tempAvg: 32,
      tempMin: 26,
      wind: 18,
      highHumidity: 85,
      lowHumidity: 55,
    },
    {
      date: "2024-05-14",
      month: "May 2024",
      precipitation: 38,
      tempHigh: 39,
      tempAvg: 33,
      tempMin: 27,
      wind: 19,
      highHumidity: 87,
      lowHumidity: 57,
    },
    {
      date: "2024-06-04",
      month: "Jun 2024",
      precipitation: 45,
      tempHigh: 36,
      tempAvg: 30,
      tempMin: 24,
      wind: 20,
      highHumidity: 92,
      lowHumidity: 65,
    },
    {
      date: "2024-06-11",
      month: "Jun 2024",
      precipitation: 50,
      tempHigh: 35,
      tempAvg: 29,
      tempMin: 23,
      wind: 21,
      highHumidity: 94,
      lowHumidity: 68,
    },
    {
      date: "2024-07-02",
      month: "Jul 2024",
      precipitation: 85,
      tempHigh: 35,
      tempAvg: 29,
      tempMin: 23,
      wind: 22,
      highHumidity: 90,
      lowHumidity: 70,
    },
    {
      date: "2024-07-09",
      month: "Jul 2024",
      precipitation: 88,
      tempHigh: 34,
      tempAvg: 28,
      tempMin: 22,
      wind: 23,
      highHumidity: 92,
      lowHumidity: 72,
    },
    {
      date: "2024-08-06",
      month: "Aug 2024",
      precipitation: 75,
      tempHigh: 33,
      tempAvg: 27,
      tempMin: 21,
      wind: 19,
      highHumidity: 88,
      lowHumidity: 62,
    },
    {
      date: "2024-08-13",
      month: "Aug 2024",
      precipitation: 72,
      tempHigh: 32,
      tempAvg: 26,
      tempMin: 20,
      wind: 18,
      highHumidity: 86,
      lowHumidity: 60,
    },
    {
      date: "2024-09-03",
      month: "Sep 2024",
      precipitation: 65,
      tempHigh: 33,
      tempAvg: 27,
      tempMin: 21,
      wind: 16,
      highHumidity: 85,
      lowHumidity: 60,
    },
    {
      date: "2024-09-10",
      month: "Sep 2024",
      precipitation: 62,
      tempHigh: 32,
      tempAvg: 26,
      tempMin: 20,
      wind: 15,
      highHumidity: 83,
      lowHumidity: 58,
    },
    {
      date: "2024-10-01",
      month: "Oct 2024",
      precipitation: 45,
      tempHigh: 31,
      tempAvg: 25,
      tempMin: 19,
      wind: 14,
      highHumidity: 80,
      lowHumidity: 52,
    },
    {
      date: "2024-10-08",
      month: "Oct 2024",
      precipitation: 42,
      tempHigh: 30,
      tempAvg: 24,
      tempMin: 18,
      wind: 13,
      highHumidity: 78,
      lowHumidity: 50,
    },
    {
      date: "2024-11-05",
      month: "Nov 2024",
      precipitation: 25,
      tempHigh: 29,
      tempAvg: 23,
      tempMin: 17,
      wind: 14,
      highHumidity: 75,
      lowHumidity: 45,
    },
    {
      date: "2024-11-12",
      month: "Nov 2024",
      precipitation: 22,
      tempHigh: 28,
      tempAvg: 22,
      tempMin: 16,
      wind: 13,
      highHumidity: 73,
      lowHumidity: 43,
    },
    {
      date: "2024-12-03",
      month: "Dec 2024",
      precipitation: 18,
      tempHigh: 27,
      tempAvg: 21,
      tempMin: 15,
      wind: 12,
      highHumidity: 70,
      lowHumidity: 40,
    },
    {
      date: "2024-12-10",
      month: "Dec 2024",
      precipitation: 15,
      tempHigh: 26,
      tempAvg: 20,
      tempMin: 14,
      wind: 11,
      highHumidity: 68,
      lowHumidity: 38,
    },
    {
      date: "2025-01-07",
      month: "Jan 2025",
      precipitation: 20,
      tempHigh: 27,
      tempAvg: 21,
      tempMin: 15,
      wind: 13,
      highHumidity: 70,
      lowHumidity: 40,
    },
    {
      date: "2025-01-14",
      month: "Jan 2025",
      precipitation: 18,
      tempHigh: 26,
      tempAvg: 20,
      tempMin: 14,
      wind: 12,
      highHumidity: 68,
      lowHumidity: 38,
    },
  ];

  // Aggregation logic similar to FarmerDashboard
  const aggregateDataByPeriod = (
    data: WeatherData[],
    period: TimePeriod
  ): WeatherData[] => {
    if (period === "daily") {
      if (data.length < 2) return data;
      const sorted = [...data].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      const last = sorted[sorted.length - 1];
      const secondLast = sorted[sorted.length - 2];
      return [secondLast, last];
    }

    if (period === "yearly") {
      // For yearly, show all data points (no aggregation)
      return [...data].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    }

    const groupedData: { [key: string]: WeatherData[] } = {};
    data.forEach((item) => {
      const date = new Date(item.date);
      let key: string;

      switch (period) {
        case "weekly":
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split("T")[0];
          break;
        case "monthly":
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
            2,
            "0"
          )}`;
          break;
        default:
          key = item.date;
      }

      if (!groupedData[key]) {
        groupedData[key] = [];
      }
      groupedData[key].push(item);
    });

    return Object.entries(groupedData)
      .map(([key, items]) => {
        const avgPrecipitation =
          items.reduce((sum, item) => sum + item.precipitation, 0) /
          items.length;
        const avgTempHigh =
          items.reduce((sum, item) => sum + item.tempHigh, 0) / items.length;
        const avgTempAvg =
          items.reduce((sum, item) => sum + item.tempAvg, 0) / items.length;
        const avgTempMin =
          items.reduce((sum, item) => sum + item.tempMin, 0) / items.length;
        const avgWind =
          items.reduce((sum, item) => sum + item.wind, 0) / items.length;
        const avgHighHumidity =
          items.reduce((sum, item) => sum + item.highHumidity, 0) /
          items.length;
        const avgLowHumidity =
          items.reduce((sum, item) => sum + item.lowHumidity, 0) / items.length;

        let displayDate: string;
        if (period === "monthly") {
          const [year, month] = key.split("-");
          displayDate = new Date(
            parseInt(year),
            parseInt(month) - 1
          ).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          });
        } else if (period === "weekly") {
          const date = new Date(key);
          displayDate = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
        } else {
          displayDate = key;
        }

        return {
          date: key,
          month: displayDate,
          precipitation: avgPrecipitation,
          tempHigh: avgTempHigh,
          tempAvg: avgTempAvg,
          tempMin: avgTempMin,
          wind: avgWind,
          highHumidity: avgHighHumidity,
          lowHumidity: avgLowHumidity,
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Process data based on selected time period
  const processedData = useMemo(() => {
    return aggregateDataByPeriod(rawData, timePeriod);
  }, [timePeriod]);

  // Handle legend click - solo mode: show only clicked metric
  const handleLegendClick = (metric: keyof typeof visibleMetrics) => {
    // If the metric is already the only one visible, show all
    const isOnlyVisible =
      visibleMetrics[metric] &&
      Object.entries(visibleMetrics).filter(([key, value]) => value).length ===
        1;

    if (isOnlyVisible) {
      // Show all metrics if only one is currently visible
      setVisibleMetrics({
        precipitation: true,
        tempHigh: true,
        tempAvg: true,
        tempMin: true,
        wind: true,
        highHumidity: true,
        lowHumidity: true,
      });
    } else {
      // Show only the clicked metric
      setVisibleMetrics({
        precipitation: metric === "precipitation",
        tempHigh: metric === "tempHigh",
        tempAvg: metric === "tempAvg",
        tempMin: metric === "tempMin",
        wind: metric === "wind",
        highHumidity: metric === "highHumidity",
        lowHumidity: metric === "lowHumidity",
      });
    }
  };

  return (
    <div className="bg-white p-2 rounded-lg relative items-start justify-start">
      <div className="h-64 ">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={processedData}
            margin={{ top: 10, right: 18, bottom: 0, left: -30 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10 }}
              angle={0}
              textAnchor="middle"
              height={60}
            />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontSize: "12px",
              }}
            />
            {visibleMetrics.precipitation && (
              <Bar
                dataKey="precipitation"
                fill="#3b82f6"
                name="Precipitation"
              />
            )}
            {visibleMetrics.tempHigh && (
              <Line
                type="monotone"
                dataKey="tempHigh"
                stroke="#ef4444"
                strokeWidth={2}
                name="Temp High"
              />
            )}
            {visibleMetrics.tempAvg && (
              <Line
                type="monotone"
                dataKey="tempAvg"
                stroke="#60a5fa"
                strokeWidth={2}
                name="Temp Avg"
              />
            )}
            {visibleMetrics.tempMin && (
              <Line
                type="monotone"
                dataKey="tempMin"
                stroke="#10b981"
                strokeWidth={2}
                name="Temp Min"
              />
            )}
            {visibleMetrics.wind && (
              <Line
                type="monotone"
                dataKey="wind"
                stroke="#6b7280"
                strokeWidth={2}
                name="Wind"
              />
            )}
            {visibleMetrics.highHumidity && (
              <Line
                type="monotone"
                dataKey="highHumidity"
                stroke="#eab308"
                strokeWidth={2}
                name="High Humidity"
              />
            )}
            {visibleMetrics.lowHumidity && (
              <Line
                type="monotone"
                dataKey="lowHumidity"
                stroke="#8b5cf6"
                strokeWidth={2}
                name="Low Humidity"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center mt-5">
        <div className="flex flex-wrap gap-3">
          <div
            className={`flex items-center text-sm cursor-pointer hover:bg-gray-100 rounded px-2 py-1 transition-colors ${
              !visibleMetrics.precipitation ? "opacity-50" : ""
            } ${
              visibleMetrics.precipitation &&
              Object.entries(visibleMetrics).filter(([key, value]) => value)
                .length === 1
                ? "bg-blue-100 ring-1 ring-blue-300"
                : ""
            }`}
            onClick={() => handleLegendClick("precipitation")}
          >
            <div className="w-3.5 h-6 rounded-full bg-blue-500 mr-1"></div>
            <span
              className={`${
                !visibleMetrics.precipitation
                  ? "text-gray-400"
                  : "text-gray-500"
              } ${
                visibleMetrics.precipitation &&
                Object.entries(visibleMetrics).filter(([key, value]) => value)
                  .length === 1
                  ? "font-semibold text-blue-700"
                  : ""
              }`}
            >
              Precipitation
            </span>
          </div>
          <div
            className={`flex items-center text-sm cursor-pointer hover:bg-gray-100 rounded px-2 py-1 transition-colors ${
              !visibleMetrics.tempHigh ? "opacity-50" : ""
            }`}
            onClick={() => handleLegendClick("tempHigh")}
          >
            <div className="w-3.5 h-6 rounded-full bg-red-500 mr-1"></div>
            <span
              className={`${
                !visibleMetrics.tempHigh ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Temp(°C) High
            </span>
          </div>
          <div
            className={`flex items-center text-sm cursor-pointer hover:bg-gray-100 rounded px-2 py-1 transition-colors ${
              !visibleMetrics.tempAvg ? "opacity-50" : ""
            }`}
            onClick={() => handleLegendClick("tempAvg")}
          >
            <div className="w-3.5 h-6 rounded-full bg-blue-400 mr-1"></div>
            <span
              className={`${
                !visibleMetrics.tempAvg ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Temp(°C) Avg
            </span>
          </div>
          <div
            className={`flex items-center text-sm cursor-pointer hover:bg-gray-100 rounded px-2 py-1 transition-colors ${
              !visibleMetrics.tempMin ? "opacity-50" : ""
            }`}
            onClick={() => handleLegendClick("tempMin")}
          >
            <div className="w-3.5 h-6 rounded-full bg-green-500 mr-1"></div>
            <span
              className={`${
                !visibleMetrics.tempMin ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Temp(°C) Min
            </span>
          </div>
          <div
            className={`flex items-center text-sm cursor-pointer hover:bg-gray-100 rounded px-2 py-1 transition-colors ${
              !visibleMetrics.wind ? "opacity-50" : ""
            }`}
            onClick={() => handleLegendClick("wind")}
          >
            <div className="w-3.5 h-6 rounded-full bg-gray-600 mr-1"></div>
            <span
              className={`${
                !visibleMetrics.wind ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Wind(Km/hr)
            </span>
          </div>
          <div
            className={`flex items-center text-sm cursor-pointer hover:bg-gray-100 rounded px-2 py-1 transition-colors ${
              !visibleMetrics.highHumidity ? "opacity-50" : ""
            }`}
            onClick={() => handleLegendClick("highHumidity")}
          >
            <div className="w-3.5 h-6 rounded-full bg-yellow-500 mr-1"></div>
            <span
              className={`${
                !visibleMetrics.highHumidity ? "text-gray-400" : "text-gray-500"
              }`}
            >
              High humidity
            </span>
          </div>
          <div
            className={`flex items-center text-sm cursor-pointer hover:bg-gray-100 rounded px-2 py-1 transition-colors ${
              !visibleMetrics.lowHumidity ? "opacity-50" : ""
            }`}
            onClick={() => handleLegendClick("lowHumidity")}
          >
            <div className="w-3.5 h-6 rounded-full bg-purple-500 mr-1"></div>
            <span
              className={`${
                !visibleMetrics.lowHumidity ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Low humidity
            </span>
          </div>
        </div>
        <div className="flex justify-center mt-3">
          <button
            onClick={() =>
              setVisibleMetrics({
                precipitation: true,
                tempHigh: true,
                tempAvg: true,
                tempMin: true,
                wind: true,
                highHumidity: true,
                lowHumidity: true,
              })
            }
            className="text-xs text-blue-600 hover:text-blue-800 underline cursor-pointer"
          >
            {Object.entries(visibleMetrics).filter(([key, value]) => value)
              .length === 1}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WeatherChart;

import React, { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface RainfallData {
  date: string;
  month: string;
  rainfall: number;
  cumulativeRainfall: number;
  rainyDays: number;
  maxDailyRainfall: number;
  avgRainfall: number;
}

type TimePeriod = "daily" | "weekly" | "monthly" | "yearly";

interface RainfallChartProps {
  timePeriod: TimePeriod;
}

const RainfallChart: React.FC<RainfallChartProps> = ({ timePeriod }) => {
  // Rainfall data with dates for aggregation
  const rawData: RainfallData[] = [
    {
      date: "2024-01-15",
      month: "Jan 2024",
      rainfall: 15,
      cumulativeRainfall: 15,
      rainyDays: 3,
      maxDailyRainfall: 8,
      avgRainfall: 5,
    },
    {
      date: "2024-01-22",
      month: "Jan 2024",
      rainfall: 18,
      cumulativeRainfall: 33,
      rainyDays: 4,
      maxDailyRainfall: 10,
      avgRainfall: 4.5,
    },
    {
      date: "2024-02-05",
      month: "Feb 2024",
      rainfall: 22,
      cumulativeRainfall: 55,
      rainyDays: 5,
      maxDailyRainfall: 12,
      avgRainfall: 4.4,
    },
    {
      date: "2024-02-12",
      month: "Feb 2024",
      rainfall: 20,
      cumulativeRainfall: 75,
      rainyDays: 4,
      maxDailyRainfall: 11,
      avgRainfall: 5,
    },
    {
      date: "2024-03-05",
      month: "Mar 2024",
      rainfall: 25,
      cumulativeRainfall: 100,
      rainyDays: 6,
      maxDailyRainfall: 15,
      avgRainfall: 4.2,
    },
    {
      date: "2024-03-12",
      month: "Mar 2024",
      rainfall: 28,
      cumulativeRainfall: 128,
      rainyDays: 7,
      maxDailyRainfall: 16,
      avgRainfall: 4,
    },
    {
      date: "2024-04-02",
      month: "Apr 2024",
      rainfall: 30,
      cumulativeRainfall: 158,
      rainyDays: 8,
      maxDailyRainfall: 18,
      avgRainfall: 3.8,
    },
    {
      date: "2024-04-09",
      month: "Apr 2024",
      rainfall: 32,
      cumulativeRainfall: 190,
      rainyDays: 8,
      maxDailyRainfall: 19,
      avgRainfall: 4,
    },
    {
      date: "2024-05-07",
      month: "May 2024",
      rainfall: 35,
      cumulativeRainfall: 225,
      rainyDays: 9,
      maxDailyRainfall: 20,
      avgRainfall: 3.9,
    },
    {
      date: "2024-05-14",
      month: "May 2024",
      rainfall: 38,
      cumulativeRainfall: 263,
      rainyDays: 10,
      maxDailyRainfall: 22,
      avgRainfall: 3.8,
    },
    {
      date: "2024-06-04",
      month: "Jun 2024",
      rainfall: 45,
      cumulativeRainfall: 308,
      rainyDays: 12,
      maxDailyRainfall: 25,
      avgRainfall: 3.8,
    },
    {
      date: "2024-06-11",
      month: "Jun 2024",
      rainfall: 50,
      cumulativeRainfall: 358,
      rainyDays: 13,
      maxDailyRainfall: 28,
      avgRainfall: 3.8,
    },
    {
      date: "2024-07-02",
      month: "Jul 2024",
      rainfall: 85,
      cumulativeRainfall: 443,
      rainyDays: 18,
      maxDailyRainfall: 35,
      avgRainfall: 4.7,
    },
    {
      date: "2024-07-09",
      month: "Jul 2024",
      rainfall: 88,
      cumulativeRainfall: 531,
      rainyDays: 19,
      maxDailyRainfall: 38,
      avgRainfall: 4.6,
    },
    {
      date: "2024-08-06",
      month: "Aug 2024",
      rainfall: 75,
      cumulativeRainfall: 606,
      rainyDays: 16,
      maxDailyRainfall: 32,
      avgRainfall: 4.7,
    },
    {
      date: "2024-08-13",
      month: "Aug 2024",
      rainfall: 72,
      cumulativeRainfall: 678,
      rainyDays: 15,
      maxDailyRainfall: 30,
      avgRainfall: 4.8,
    },
    {
      date: "2024-09-03",
      month: "Sep 2024",
      rainfall: 65,
      cumulativeRainfall: 743,
      rainyDays: 14,
      maxDailyRainfall: 28,
      avgRainfall: 4.6,
    },
    {
      date: "2024-09-10",
      month: "Sep 2024",
      rainfall: 62,
      cumulativeRainfall: 805,
      rainyDays: 13,
      maxDailyRainfall: 26,
      avgRainfall: 4.8,
    },
    {
      date: "2024-10-01",
      month: "Oct 2024",
      rainfall: 45,
      cumulativeRainfall: 850,
      rainyDays: 10,
      maxDailyRainfall: 22,
      avgRainfall: 4.5,
    },
    {
      date: "2024-10-08",
      month: "Oct 2024",
      rainfall: 42,
      cumulativeRainfall: 892,
      rainyDays: 9,
      maxDailyRainfall: 20,
      avgRainfall: 4.7,
    },
    {
      date: "2024-11-05",
      month: "Nov 2024",
      rainfall: 25,
      cumulativeRainfall: 917,
      rainyDays: 6,
      maxDailyRainfall: 12,
      avgRainfall: 4.2,
    },
    {
      date: "2024-11-12",
      month: "Nov 2024",
      rainfall: 22,
      cumulativeRainfall: 939,
      rainyDays: 5,
      maxDailyRainfall: 10,
      avgRainfall: 4.4,
    },
    {
      date: "2024-12-03",
      month: "Dec 2024",
      rainfall: 18,
      cumulativeRainfall: 957,
      rainyDays: 4,
      maxDailyRainfall: 8,
      avgRainfall: 4.5,
    },
    {
      date: "2024-12-10",
      month: "Dec 2024",
      rainfall: 15,
      cumulativeRainfall: 972,
      rainyDays: 3,
      maxDailyRainfall: 7,
      avgRainfall: 5,
    },
    {
      date: "2025-01-07",
      month: "Jan 2025",
      rainfall: 20,
      cumulativeRainfall: 992,
      rainyDays: 4,
      maxDailyRainfall: 9,
      avgRainfall: 5,
    },
    {
      date: "2025-01-14",
      month: "Jan 2025",
      rainfall: 18,
      cumulativeRainfall: 1010,
      rainyDays: 3,
      maxDailyRainfall: 8,
      avgRainfall: 6,
    },
  ];

  // Aggregation logic similar to WeatherChart
  const aggregateDataByPeriod = (
    data: RainfallData[],
    period: TimePeriod
  ): RainfallData[] => {
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

    const groupedData: { [key: string]: RainfallData[] } = {};
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
        const avgRainfall =
          items.reduce((sum, item) => sum + item.rainfall, 0) / items.length;
        const totalCumulativeRainfall =
          items[items.length - 1]?.cumulativeRainfall || 0;
        const avgRainyDays =
          items.reduce((sum, item) => sum + item.rainyDays, 0) / items.length;
        const maxDailyRainfall = Math.max(
          ...items.map((item) => item.maxDailyRainfall)
        );
        const avgRainfallPerDay =
          items.reduce((sum, item) => sum + item.avgRainfall, 0) / items.length;

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
          rainfall: avgRainfall,
          cumulativeRainfall: totalCumulativeRainfall,
          rainyDays: avgRainyDays,
          maxDailyRainfall: maxDailyRainfall,
          avgRainfall: avgRainfallPerDay,
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Process data based on selected time period
  const processedData = useMemo(() => {
    return aggregateDataByPeriod(rawData, timePeriod);
  }, [timePeriod]);

  return (
    <div className="bg-white p-4 rounded-lg relative">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={processedData}
            margin={{ top: 10, right: 18, bottom: 0, left: -30 }}
          >
            <defs>
              <linearGradient id="rainfallGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2} />
              </linearGradient>
              <linearGradient
                id="cumulativeGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.2} />
              </linearGradient>
            </defs>
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
              formatter={(value: number, name: string) => [
                `${value.toFixed(1)} mm`,
                name === "rainfall" ? "Rainfall" : "Cumulative Rainfall",
              ]}
            />
            <Area
              type="monotone"
              dataKey="rainfall"
              stroke="#3b82f6"
              fill="url(#rainfallGradient)"
              strokeWidth={2}
              name="Rainfall"
            />
            <Area
              type="monotone"
              dataKey="cumulativeRainfall"
              stroke="#10b981"
              fill="url(#cumulativeGradient)"
              strokeWidth={2}
              name="Cumulative Rainfall"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Rainfall Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4  text-xs">
        <div className="text-center">
          <div className="font-semibold text-blue-600">
            {processedData
              .reduce((sum, item) => sum + item.rainfall, 0)
              .toFixed(1)}{" "}
            mm
          </div>
          <div className="text-gray-500">Total Rainfall</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-green-600">
            {processedData[
              processedData.length - 1
            ]?.cumulativeRainfall.toFixed(1) || 0}{" "}
            mm
          </div>
          <div className="text-gray-500">Cumulative</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-purple-600">
            {Math.max(
              ...processedData.map((item) => item.maxDailyRainfall)
            ).toFixed(1)}{" "}
            mm
          </div>
          <div className="text-gray-500">Max Daily</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-orange-600">
            {(
              processedData.reduce((sum, item) => sum + item.rainyDays, 0) /
              processedData.length
            ).toFixed(1)}
          </div>
          <div className="text-gray-500">Avg Rainy Days</div>
        </div>
      </div>
    </div>
  );
};

export default RainfallChart;

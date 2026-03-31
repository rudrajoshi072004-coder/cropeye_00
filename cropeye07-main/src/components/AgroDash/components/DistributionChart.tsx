import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DistributionData {
  x: number;
  value: number;
}

const DistributionChart: React.FC = () => {
  const data: DistributionData[] = [
    { x: -20, value: 5 },
    { x: -15, value: 15 },
    { x: -10, value: 35 },
    { x: -5, value: 65 },
    { x: 0, value: 95 },
    { x: 5, value: 85 },
    { x: 10, value: 75 },
    { x: 15, value: 55 },
    { x: 20, value: 45 },
    { x: 25, value: 35 },
    { x: 30, value: 25 },
    { x: 35, value: 20 },
    { x: 40, value: 15 },
    { x: 45, value: 12 },
    { x: 50, value: 10 },
    { x: 55, value: 8 },
    { x: 60, value: 6 },
    { x: 65, value: 4 },
    { x: 70, value: 3 },
    { x: 75, value: 2 },
    { x: 80, value: 1 },
  ];

  return (
    <div className="bg-white p-4 rounded-lg ">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-600">1</span>
        <span className="text-xs text-gray-600">677</span>
      </div>

      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <defs>
              <linearGradient
                id="colorDistribution"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="x"
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontSize: "10px",
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorDistribution)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>-20</span>
        <span>0</span>
        <span>20</span>
        <span>40</span>
        <span>60</span>
        <span>80</span>
      </div>
      <div className="text-center mt-2">
        <span className="text-xs text-gray-600">2M</span>
        <div className="mt-1 text-xs text-gray-600">0M</div>
      </div>
    </div>
  );
};

export default DistributionChart;

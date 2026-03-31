import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface GaugeChartProps {
  value: number;
  maxValue: number;
  label: string;
  color?: string;
}

const GaugeChart: React.FC<GaugeChartProps> = ({
  value,
  maxValue,
  label,
  color = "#3b82f6",
}) => {
  const percentage = (value / maxValue) * 100;

  const data = [
    { name: "filled", value: percentage, fill: color },
    { name: "empty", value: 100 - percentage, fill: "#e5e7eb" },
  ];

  return (
    <div className="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm mb-2">
      <h3 className="text-sm font-medium text-gray-700 mb-4">{label}</h3>
      <div className="relative w-44 h-32">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="75%"
              startAngle={180}
              endAngle={0}
              innerRadius={55}
              outerRadius={88}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center" style={{ paddingBottom: '2px' }}>
          <div className="text-center">
            <span className="font-bold text-gray-800 text-3xl block">
              {typeof value === "number" && value % 1 !== 0
                ? value.toFixed(2)
                : value}
            </span>
          </div>
        </div>
      </div>
      <div className="flex justify-evenly w-full text-lg text-gray-500 mt-2">
        <span className="mr-8 font-bold">0</span>
        <span className="ml-8 font-semibold">{maxValue}</span>
      </div>
    </div>
  );
};

export default GaugeChart;

import React from "react";
import { Treemap, ResponsiveContainer, Tooltip } from "recharts";

interface FieldData {
  name: string;
  size: number;
  fill: string;
  plotId: string;
  [key: string]: any;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
}

interface FieldDistributionChartProps {
  plots: Array<{
    id: number;
    plotNo: string;
    area: string;
    status: string;
  }>;
  allPlots?: Array<{
    id: number;
    plotNo: string;
    area: string;
    status: string;
  }>;
  onPlotClick?: (plotId: string) => void;
  selectedPlotId?: string | null;
}

const FieldDistributionChart: React.FC<FieldDistributionChartProps> = ({
  plots,
  allPlots,
  onPlotClick,
  selectedPlotId,
}) => {
  // Generate colors for plots
  const colors = [
    "#ef4444",
    "#3b82f6",
    "#10b981",
    "#eab308",
    "#8b5cf6",
    "#ec4899",
    "#6366f1",
    "#f97316",
    "#06b6d4",
    "#84cc16",
    "#f59e0b",
    "#ef4444",
    "#3b82f6",
    "#10b981",
    "#eab308",
  ];

  // Convert plots to treemap data
  const data: FieldData[] = plots.map((plot, index) => ({
    name: String(plot.plotNo).slice(-3),
    size: parseFloat(plot.area),
    fill:
      selectedPlotId === plot.plotNo
        ? "#f59e0b"
        : colors[index % colors.length],
    plotId: plot.plotNo,
    status: plot.status,
  }));

  const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const plot = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <div className="space-y-1">
            <p className="text-sm  font-semibold text-gray-800">
              {plot.plotId}
            </p>
            <p className="text-xs text-gray-600">
              Area: {plot.size.toFixed(2)} acre
            </p>
            <p className="text-xs text-gray-600">Status: {plot.status}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  const handleClick = (data: any) => {
    if (onPlotClick && data && data.plotId) {
      onPlotClick(data.plotId);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">
          Field Distribution{" "}
          {plots.length !== allPlots?.length &&
            `(${plots.length} of ${allPlots?.length || "all"} plots)`}
        </h3>
        {selectedPlotId && (
          <button
            onClick={() => onPlotClick && onPlotClick("")}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Clear Selection
          </button>
        )}
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={data}
            dataKey="size"
            aspectRatio={4 / 3}
            stroke="none"
            onClick={handleClick}
            style={{ cursor: "pointer" }}
          >
            <Tooltip content={<CustomTooltip />} />
          </Treemap>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FieldDistributionChart;

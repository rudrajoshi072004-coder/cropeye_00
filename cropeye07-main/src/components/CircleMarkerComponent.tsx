// CircleMarkerComponent.tsx
import React from "react";
import { CircleMarker, Tooltip } from "react-leaflet";

const getColor = (indexType: string, value: number): string => {
  if (indexType === "NDVI") {
    if (value <= 0) return "#9CA3AF"; // Grey
    if (value <= 10) return "#FDE68A"; // Yellow
    if (value <= 30) return "#D97706"; // Brown-Green
    if (value <= 60) return "#86EFAC"; // Light Green
    return "#065F46"; // Dark Green
  } else if (indexType === "NDMI") {
    if (value <= 10) return "#DC2626"; // Red
    if (value <= 30) return "#FACC15"; // Yellow
    if (value <= 60) return "#93C5FD"; // Light Blue
    return "#1E3A8A"; // Dark Blue
  }
  return "#000000"; // Default Black
};

interface CircleMarkerProps {
  name: string;
  center: [number, number];
  value: number;
  indexType: string;
}

const CircleMarkerComponent: React.FC<CircleMarkerProps> = ({
  name,
  center,
  value,
  indexType,
}) => {
  const color = getColor(indexType, value);
  return (
    <CircleMarker center={center} radius={20} pathOptions={{ color, fillColor: color, fillOpacity: 0.7 }}>
      <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent>
        <div style={{ textAlign: "center" }}>
          <div>{name}</div>
          <div>{value}%</div>
        </div>
      </Tooltip>
    </CircleMarker>
  );
};

export default CircleMarkerComponent;

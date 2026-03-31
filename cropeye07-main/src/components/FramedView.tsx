// components/FramedView.tsx
import React from "react";

interface FramedViewProps {
  title?: string;
  children: React.ReactNode;
}

const FramedView: React.FC<FramedViewProps> = ({ title, children }) => {
  return (
    <div className="border rounded-2xl shadow-lg bg-white p-6 h-[80vh] overflow-auto">
      {title && <h2 className="text-xl font-semibold mb-4 text-gray-700">{title}</h2>}
      <div>{children}</div>
    </div>
  );
};

export default FramedView;

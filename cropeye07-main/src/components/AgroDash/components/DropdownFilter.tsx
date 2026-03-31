import React from "react";
import { ChevronDown } from "lucide-react";

interface DropdownFilterProps {
  label: string;
  options?: string[];
  value?: string;
  onChange?: (value: string) => void;
}

const DropdownFilter: React.FC<DropdownFilterProps> = ({
  label,
  options = ["All"],
  value = "All",
  onChange,
}) => (
  <div className="mb-3">
    <label className="block text-sm font-medium text-gray-700 px-3 ">
      {label}
    </label>
    <div className="relative w-auto px-3">
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full px-5 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
      >
        {options.map((option, index) => (
          <option key={index} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-5 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
    </div>
  </div>
);

export default DropdownFilter;

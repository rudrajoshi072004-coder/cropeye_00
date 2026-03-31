import React from 'react';
import { BarChart3, Users as TeamConnect, Wheat, Cloud, User, CalendarDays } from 'lucide-react';
import { DashboardNo } from './Dashboardno';

interface OwnerHomeGridProps {
  onMenuClick: (menuTitle: string) => void;
}

const items = [
  { title: 'Farm Crop Status', icon: <BarChart3 size={32} className="text-blue-600" />, bgColor: 'bg-blue-300', hoverColor: 'hover:bg-blue-300' },
  { title: 'Harvesting Planning', icon: <Wheat size={32} className="text-yellow-600" />, bgColor: 'bg-yellow-300', hoverColor: 'hover:bg-yellow-300' },
  { title: 'Agroclimatic', icon: <Cloud size={32} className="text-cyan-600" />, bgColor: 'bg-cyan-300', hoverColor: 'hover:bg-cyan-300' },
  { title: 'Contactuser', icon: <User size={32} className="text-emerald-600" />, bgColor: 'bg-emerald-300', hoverColor: 'hover:bg-emerald-300' },
  { title: 'Team Connect', icon: <TeamConnect size={32} className="text-pink-600" />, bgColor: 'bg-pink-300', hoverColor: 'hover:bg-pink-300' },
  { title: 'Calendar / Schedule', icon: <CalendarDays size={32} className="text-teal-600" />, bgColor: 'bg-teal-300', hoverColor: 'hover:bg-teal-400' },
];

const OwnerHomeGrid: React.FC<OwnerHomeGridProps> = ({ onMenuClick }) => {
  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 mt-4 mx-4">
      {/* Dashboard Statistics: 5 rows, 1 column (left) */}
      <div className="lg:min-w-[280px] xl:min-w-[320px]">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 px-2">Dashboard Statistics</h2>
        <div className="bg-white rounded-xl shadow-md p-4">
          <DashboardNo layout="column" />
        </div>
      </div>

      {/* Action Cards: 3 rows, 2 columns (right) */}
      <div className="flex-1">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 px-2">Quick Actions</h2>
        <div className="grid grid-cols-2 grid-rows-3 gap-3 sm:gap-4 lg:gap-6">
          {items.map((item) => (
            <button
              key={item.title}
              onClick={() => (item.title === 'Calendar / Schedule' ? onMenuClick('CalendarView') : onMenuClick(item.title))}
              className={`${item.bgColor} ${item.hoverColor} p-4 sm:p-6 rounded-xl shadow-sm transition-all duration-300 transform hover:scale-[1.02] min-h-[100px] sm:min-h-[120px] lg:min-h-[140px]`}
            >
              <div className="flex flex-col items-center justify-center space-y-2 sm:space-y-3 h-full">
                <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center">
                  {React.cloneElement(item.icon, {
                    size: undefined,
                    className: item.icon.props.className + ' w-full h-full',
                  })}
                </div>
                <span className="text-sm sm:text-base font-semibold text-gray-800 text-center leading-tight break-words px-1">
                  {item.title}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OwnerHomeGrid;

// ManagerHomeGrid.tsx
import React, { useState } from "react";
import {
  BarChart3,
  Users,
  Calendar,
  Users as TeamConnect,
  Truck,
  Cloud,
  Book,
} from "lucide-react";
import { GiSugarCane } from "react-icons/gi";
import { DashboardNo } from "./Dashboardno";
import TeamList from "./TeamList";
import AddBooking from "./AddBooking";
import HarvestDashboard from "../components/HarvestDashboard";

interface ManagerHomeGridProps {
  onMenuClick: (menuTitle: string) => void;
  onOpenSidebarWithMenu: (menuTitle: string) => void;
}

const menuItems = [
  {
    title: "Farm Crop Status",
    icon: <BarChart3 size={32} className="text-blue-600" />,
    bgColor: "bg-blue-300",
    hoverColor: "hover:bg-blue-300",
  },
  {
    title: "Harvesting Planning",
    icon: <GiSugarCane size={32} className="text-yellow-600" />,
    bgColor: "bg-yellow-300",
    hoverColor: "hover:bg-yellow-300",
  },
  {
    title: "Agroclimatic",
    icon: <Cloud size={32} className="text-cyan-600" />,
    bgColor: "bg-cyan-300",
    hoverColor: "hover:bg-cyan-300",
  },
  {
    title: "User Desk",
    icon: <Users size={32} className="text-purple-600" />,
    bgColor: "bg-purple-300",
    hoverColor: "hover:bg-purple-300",
  },
  {
    title: "MyTask",
    icon: <Calendar size={32} className="text-green-600" />,
    bgColor: "bg-green-300",
    hoverColor: "hover:bg-green-300",
  },
  {
    title: "Team Connect",
    icon: <TeamConnect size={32} className="text-pink-600" />,
    bgColor: "bg-pink-300",
    hoverColor: "hover:bg-pink-300",
  },
  {
    title: "Resources Planning",
    icon: <Truck size={32} className="text-orange-600" />,
    bgColor: "bg-orange-300",
    hoverColor: "hover:bg-orange-300",
  },
  {
    title: "Plan & Book",
    icon: <Book size={32} className="text-indigo-600" />,
    bgColor: "bg-indigo-300",
    hoverColor: "hover:bg-indigo-300",
  },
];

const ManagerHomeGrid: React.FC<ManagerHomeGridProps> = ({
  onMenuClick,
  onOpenSidebarWithMenu,
}) => {
  const [currentPage, setCurrentPage] = useState<string | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);

  // If a specific page is selected, render that page instead of the grid
  if (currentPage === "team-connect") {
    return (
      <div>
        <div className="mb-4 p-4 bg-gray-100 rounded-lg">
          <button
            onClick={() => setCurrentPage(null)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span>Back to Home</span>
          </button>
        </div>
        <TeamList />
      </div>
    );
  }

  if (currentPage === "add-booking") {
    return (
      <div>
        <div className="mb-4 p-4 bg-gray-100 rounded-lg">
          <button
            onClick={() => setCurrentPage(null)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span>Back to Home</span>
          </button>
        </div>
        <AddBooking bookings={bookings} setBookings={setBookings} />
      </div>
    );
  }

  if (currentPage === "harvesting-planning") {
    return (
      <div>
        <div className="mb-4 p-4 bg-gray-100 rounded-lg">
          <button
            onClick={() => setCurrentPage(null)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span>Back to Home</span>
          </button>
        </div>
        <HarvestDashboard />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
        {menuItems.map((item) => (
          <button
            key={item.title}
            onClick={() => {
              // Handle different navigation based on card type
              if (item.title === "User Desk") {
                // Open sidebar and expand User Desk menu
                onOpenSidebarWithMenu("UserDesk");
              } else if (item.title === "Resources Planning") {
                // Open sidebar and expand Resources Planning menu
                onOpenSidebarWithMenu("Resoucres Planning");
              } else if (item.title === "Team Connect") {
                // Open TeamList page in full window
                setCurrentPage("team-connect");
              } else if (item.title === "MyTask") {
                // Open sidebar and expand MyTask menu
                onOpenSidebarWithMenu("MyTask");
              } else if (item.title === "Plan & Book") {
                // Open AddBooking page in full window
                setCurrentPage("add-booking");
              } else if (item.title === "Harvesting Planning") {
                // Open HarvestDashboard page in full window
                setCurrentPage("harvesting-planning");
              } else if (item.title === "Farm Crop Status") {
                onMenuClick("Farm Crop Status");
              } else {
                // Default behavior for other cards
                onMenuClick(item.title);
              }
            }}
            className={`${item.bgColor} ${item.hoverColor} p-4 sm:p-6 lg:p-8 rounded-xl shadow-sm transition-transform transform hover:scale-105 min-h-[120px] sm:min-h-[140px] lg:min-h-[160px]`}
          >
            <div className="flex flex-col items-center justify-center space-y-2 sm:space-y-4 h-full">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 flex items-center justify-center">
                  {React.cloneElement(item.icon, {
                    size: undefined,
                    className: item.icon.props.className + " w-full h-full",
                  })}
                </div>
              </div>
              <span className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 text-center leading-tight break-words px-1">
                {item.title}
              </span>
            </div>
          </button>
        ))}
      </div>
      {/* Dashboard stats row */}
      <div className="mt-6 bg-white rounded-xl shadow-md p-4">
        <DashboardNo />
      </div>
    </div>
  );
};

export default ManagerHomeGrid;

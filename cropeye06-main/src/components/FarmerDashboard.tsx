import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
  ReferenceArea,
  Scatter,
  ComposedChart,
  PieChart,
  Pie,
} from "recharts";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line as ChartLine } from 'react-chartjs-2';
import {
  Calendar,
  TrendingUp,
  Droplets,
  Thermometer,
  Activity,
  Target,
  Leaf,
  LineChart as LineChartIcon,
  Users,
  MapPin,
  Beaker,
} from "lucide-react";
import axios from "axios";
import { getCache, setCache } from "../utils/cache";
import { useFarmerProfile } from "../hooks/useFarmerProfile";
import { useAppContext } from "../context/AppContext";
import CommonSpinner from "./CommanSpinner";
import { getEventsBaseUrl } from "../utils/serviceUrls";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

// Type definitions
interface PieChartWithNeedleProps {
  value: number;
  max: number;
  width?: number;
  height?: number;
  title?: string;
  unit?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

interface CustomStressDotProps {
  cx?: number;
  cy?: number;
  payload?: any;
}

interface LineChartData {
  date: string;
  growth: number;
  stress: number;
  water: number;
  moisture: number;
  stressLevel?: number | null;
  isStressEvent?: boolean;
  stressEventData?: any;
}

interface Metrics {
  brix: number | null;
  brixMin: number | null;
  brixMax: number | null;
  recovery: number | null;
  area: number | null;
  biomass: number | null;
  totalBiomass: number | null;
  stressCount: number | null;
  irrigationEvents: number | null;
  sugarYieldMean: number | null;
  daysToHarvest: number | null;
  growthStage: string | null;
  soilPH: number | null;
  organicCarbonDensity: number | null;
  actualYield: number | null;
  cnRatio: number | null;
  sugarYieldMax: number | null;
  sugarYieldMin: number | null;
}

interface VisibleLines {
  growth: boolean;
  stress: boolean;
  water: boolean;
  moisture: boolean;
}

interface LineStyles {
  [key: string]: {
    color: string;
    label: string;
  };
}

interface StressEvent {
  from_date: string;
  to_date: string;
  stress: number;
}

type TimePeriod = "daily" | "weekly" | "monthly" | "yearly";

// Enhanced PieChartWithNeedle component for gauge-style visualization
const PieChartWithNeedle: React.FC<PieChartWithNeedleProps> = ({
  value,
  max,
  width = 60,
  height = 100,
  title = "Gauge",
  unit = "",
}) => {
  const percent = Math.max(0, Math.min(1, value / max));
  const angle = 180 * percent;
  const cx = width / 2;
  const cy = height * 0.9;
  const r = width * 0.35;
  const needleLength = r * 0.9;
  const needleAngle = 180 - angle;
  const rad = (Math.PI * needleAngle) / 180;
  const x = cx + needleLength * Math.cos(rad);
  const y = cy - needleLength * Math.sin(rad);

  const getColor = (percent: number): string => {
    if (percent < 0.3) return "#ef4444";
    if (percent < 0.6) return "#f97316";
    if (percent < 0.8) return "#eab308";
    return "#800080";
  };

  return (
    <div className="flex flex-col items-center">
      <svg width={width} height={height} className="overflow-visible">
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="6"
        />
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(Math.PI - (angle * Math.PI) / 180)
            } ${cy - r * Math.sin(Math.PI - (angle * Math.PI) / 180)}`}
          fill="none"
          stroke={getColor(percent)}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <line
          x1={cx}
          y1={cy}
          x2={x}
          y2={y}
          stroke="#374151"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="3" fill="#374151" />
        <text
          x={cx}
          y={cy - r - 8}
          textAnchor="middle"
          className="text-sm font-semibold fill-gray-700"
        >
          {value.toFixed(1)}
          {unit}
        </text>
      </svg>
      <p className="text-xs text-gray-600 mt-1 text-center">{title}</p>
    </div>
  );
};

const BASE_URL = getEventsBaseUrl();
const OPTIMAL_BIOMASS = 150;

// API function to fetch Brix Time Series
async function getBrixTimeSeries(plotName: string, pruningDate: string) {
  const url = `${BASE_URL}/grapes/brix-time-series?plot_name=${encodeURIComponent(plotName)}&pruning_date=${encodeURIComponent(pruningDate)}`;

  // Swagger marks this as POST. Do not fall back to GET (it returns 405 and breaks hosted flow).
  try {
    const postResponse = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      // Some backends require a JSON body even when params are in querystring
      body: JSON.stringify({}),
    });

    if (postResponse.ok) {
      return postResponse.json();
    }

    const errorText = await postResponse.text().catch(() => "");
    throw new Error(
      `Failed to fetch brix time series: ${postResponse.status} ${postResponse.statusText}${errorText ? ` - ${errorText}` : ""}`,
    );
  } catch (error: any) {
    throw new Error(error?.message || 'Failed to fetch brix time series');
  }
}

// Overlay Component for chart states
interface OverlayProps {
  message: string;
}

const Overlay: React.FC<OverlayProps> = ({ message }) => (
  <div
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(255,255,255,0.7)',
      fontWeight: '500',
      zIndex: 10,
      borderRadius: '0.5rem',
    }}
  >
    <p className="text-gray-700 font-semibold">{message}</p>
  </div>
);

// Fallback data for when API fails or no data
const fallbackLabels = ['Day 1', 'Day 2', 'Day 3'];
const fallbackDatasets = [
  {
    label: 'pH',
    data: [0, 0, 0],
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76,175,80,0.2)',
    tension: 0.4,
    fill: true,
  },
  {
    label: 'Brix',
    data: [0, 0, 0],
    borderColor: '#FF9800',
    backgroundColor: 'rgba(255,152,0,0.2)',
    tension: 0.4,
    fill: true,
  },
  {
    label: 'TA',
    data: [0, 0, 0],
    borderColor: '#2196F3',
    backgroundColor: 'rgba(33,150,243,0.2)',
    tension: 0.4,
    fill: true,
  },
];

// Brix Time Series Chart Component
interface BrixTimeSeriesChartProps {
  data: Array<{
    date: string;
    brix: number;
    ph: number;
    ta: number;
  }>;
  isLoading?: boolean;
  error?: string | null;
}

const BrixTimeSeriesChart: React.FC<BrixTimeSeriesChartProps> = ({ data, isLoading, error }) => {
  const chartData = useMemo(() => {
    // Use fallback data if no real data available
    if (!data || data.length === 0) {
      return {
        labels: fallbackLabels,
        datasets: fallbackDatasets,
      };
    }

    const labels = data.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const toNum = (v: any) => {
      const n = typeof v === "number" ? v : Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    return {
      labels,
      datasets: [
        {
          label: 'pH',
          data: data.map(item => toNum(item.ph)),
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76,175,80,0.2)',
          tension: 0.4,
          fill: true,
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
        {
          label: 'Brix',
          data: data.map(item => toNum(item.brix)),
          borderColor: '#FF9800',
          backgroundColor: 'rgba(255,152,0,0.2)',
          tension: 0.4,
          fill: true,
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
        {
          label: 'TA',
          data: data.map(item => toNum(item.ta)),
          borderColor: '#2196F3',
          backgroundColor: 'rgba(33,150,243,0.2)',
          tension: 0.4,
          fill: true,
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
      ],
    };
  }, [data]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animations: {
      y: {
        easing: 'easeInOutElastic' as const,
        from: (ctx: any) => {
          if (ctx.type === 'data') {
            if (ctx.mode === 'default' && !ctx.dropped) {
              ctx.dropped = true;
              return 0;
            }
          }
        },
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date',
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          autoSkip: true,
          // Approx 10-day interval (adaptive)
          callback: function (_value: any, index: number) {
            const labels = (this as any)?.chart?.data?.labels || [];
            const n = labels.length || 1;
            const step = Math.max(1, Math.round(n / 6)); // show ~6 ticks
            return index % step === 0 ? labels[index] : "";
          },
        },
      },
      y: {
        title: {
          display: true,
          text: 'Values (pH, Brix, TA)',
        },
        ticks: {
          padding: 6,
        },
      },
    },
  } as any), []);

  return (
    <div style={{ height: '320px', position: 'relative' }}>
      <ChartLine data={chartData} options={options} />

      {isLoading && <Overlay message="Loading data..." />}
      {error && !isLoading && <Overlay message={`Failed to load data: ${error}`} />}
      {!isLoading && !error && (!data || data.length === 0) && (
        <Overlay message="No data available" />
      )}
    </div>
  );
};

const OTHER_FARMERS_RECOVERY = {
  regional_average: 7.85,
  top_quartile: 8.52,
  bottom_quartile: 6.58,
  similar_farms: 7.63,
};

const FarmerDashboard: React.FC = () => {
  const {
    profile,
    loading: profileLoading,
    getFarmerFullName,
  } = useFarmerProfile();
  const { selectedPlotName, setSelectedPlotName, getApiData, setApiData, hasApiData } = useAppContext();

  const [currentPlotId, setCurrentPlotId] = useState<string | null>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [lineChartData, setLineChartData] = useState<LineChartData[]>([]);
  // Track if data has already been loaded for current plot to prevent re-fetching
  const dataLoadedRef = useRef<{ [plotId: string]: boolean }>({});
  const [visibleLines, setVisibleLines] = useState<VisibleLines>({
    growth: true,
    stress: true,
    water: true,
    moisture: true,
  });

  const [metrics, setMetrics] = useState<Metrics>({
    brix: null,
    brixMin: null,
    brixMax: null,
    recovery: null,
    area: null,
    biomass: null,
    totalBiomass: null,
    stressCount: null,
    irrigationEvents: null,
    sugarYieldMean: null,
    daysToHarvest: null,
    growthStage: null,
    soilPH: null,
    organicCarbonDensity: null,
    actualYield: null,
    cnRatio: null,
    sugarYieldMax: null,
    sugarYieldMin: null,
  });

  // Mobile layout flag for charts
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 640);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const [stressEvents, setStressEvents] = useState<StressEvent[]>([]);
  const [showStressEvents] = useState<boolean>(false);
  const [ndreStressEvents, setNdreStressEvents] = useState<StressEvent[]>([]);
  const [showNDREEvents, setShowNDREEvents] = useState<boolean>(false);
  const [brixTimeSeriesData, setBrixTimeSeriesData] = useState<any[]>([]);
  const [brixTimeSeriesLoading, setBrixTimeSeriesLoading] = useState<boolean>(false);
  const [brixTimeSeriesError, setBrixTimeSeriesError] = useState<string | null>(null);
  const [combinedChartData, setCombinedChartData] = useState<LineChartData[]>(
    []
  );
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("yearly");
  const [aggregatedData, setAggregatedData] = useState<LineChartData[]>([]);

  const lineStyles: LineStyles = {
    growth: { color: "#22c55e", label: "Growth Index" },
    stress: { color: "#ef4444", label: "Stress Index" },
    water: { color: "#3b82f6", label: "Water Index" },
    moisture: { color: "#f59e0b", label: "Moisture Index" },
  };

  useEffect(() => {
    if (!profile || profileLoading) {
      return;
    }

    const plotNames = profile.plots?.map((plot) => plot.fastapi_plot_id) || [];
    const defaultPlot = plotNames.length > 0 ? plotNames[0] : null;

    console.log("📊 FarmerDashboard: Available plots:", plotNames);
    console.log("📊 FarmerDashboard: Selected plot:", defaultPlot);

    if (defaultPlot) {
      setCurrentPlotId(defaultPlot);
      localStorage.setItem("selectedPlot", defaultPlot);
      console.log("✅ FarmerDashboard: Using plot ID:", defaultPlot);
    }
  }, [profile, profileLoading]);

  useEffect(() => {
    if (currentPlotId && !profileLoading) {
      // Check if data already exists in component state (already loaded)
      if (lineChartData.length > 0 && metrics.area !== null) {
        console.log('✅ Data already exists in component state for plot:', currentPlotId, '- skipping fetch');
        return;
      }

      // Check if data has already been loaded for this plot (prevent re-fetch on remount)
      if (dataLoadedRef.current[currentPlotId]) {
        console.log('✅ Data already loaded for plot:', currentPlotId, '- skipping fetch');
        return;
      }

      // Check if data is already in context (preloaded)
      const preloadedAgroStats = getApiData('agroStats', currentPlotId);
      const preloadedIndices = getApiData('indices', currentPlotId);

      // Also check cache as fallback - use consistent cache key format
      const tzOffsetMs = new Date().getTimezoneOffset() * 60000;
      const endDate = new Date(Date.now() - tzOffsetMs).toISOString().slice(0, 10);
      const indicesCacheKey = `indices_${currentPlotId}`;
      const cachedIndices = getCache(indicesCacheKey);
      // Try both cache key formats for compatibility
      const agroStatsCacheKeyV3 = `agroStats_v3_${currentPlotId}_${endDate}`;
      const agroStatsCacheKey = `agroStats_${currentPlotId}_${endDate}`;
      const cachedAgroStats = getCache(agroStatsCacheKeyV3) || getCache(agroStatsCacheKey);

      const hasData = (preloadedAgroStats || cachedAgroStats) && (preloadedIndices || cachedIndices);

      if (hasData) {
        console.log('✅ Using preloaded/cached data from context for plot:', currentPlotId);
        // Use preloaded data directly
        const indicesToUse = preloadedIndices || cachedIndices || [];
        setLineChartData(indicesToUse);

        // Extract metrics from preloaded agroStats
        // agroStats response is an object where keys are plot IDs and values are plot data
        // e.g., { "13D_13": { brix_sugar: {...}, soil: {...}, ... }, ... }
        let currentPlotData = null;
        if (preloadedAgroStats) {
          // Check if preloadedAgroStats is the full response (object with plot IDs as keys) or plot-specific data
          if (typeof preloadedAgroStats === 'object' && !Array.isArray(preloadedAgroStats)) {
            // If it has the current plot ID as a key, it's the full response
            if (preloadedAgroStats[currentPlotId] || preloadedAgroStats[`"${currentPlotId}"`]) {
              currentPlotData = preloadedAgroStats[currentPlotId] || preloadedAgroStats[`"${currentPlotId}"`];
            } else {
              // Otherwise, it might be plot-specific data already
              currentPlotData = preloadedAgroStats;
            }
          } else {
            currentPlotData = preloadedAgroStats;
          }
        } else if (cachedAgroStats) {
          // Cache might contain full response (object with plot IDs) or plot-specific data
          if (typeof cachedAgroStats === 'object' && !Array.isArray(cachedAgroStats)) {
            // Try to extract plot-specific data from full response
            currentPlotData = cachedAgroStats[currentPlotId] ||
              cachedAgroStats[`"${currentPlotId}"`] ||
              null;
            // If not found, check if it's already plot-specific data (has brix_sugar, soil, etc.)
            if (!currentPlotData && (cachedAgroStats.brix_sugar || cachedAgroStats.soil || cachedAgroStats.area_acres)) {
              currentPlotData = cachedAgroStats;
            }
          }
        }

        if (currentPlotData) {
          const sugarYieldMeanValue = currentPlotData?.brix_sugar?.sugar_yield?.mean ?? null;
          let calculatedBiomass = null;
          let totalBiomassForMetric = null;
          if (sugarYieldMeanValue !== null) {
            const totalBiomass = sugarYieldMeanValue * 1.27;
            const underGroundBiomassInTons = totalBiomass * 0.12;
            calculatedBiomass = underGroundBiomassInTons;
            totalBiomassForMetric = totalBiomass;
          }
          const newMetrics = {
            brix: currentPlotData?.brix_sugar?.brix?.mean ?? null,
            brixMin: currentPlotData?.brix_sugar?.brix?.min ?? null,
            brixMax: currentPlotData?.brix_sugar?.brix?.max ?? null,
            recovery: currentPlotData?.brix_sugar?.recovery?.mean ?? null,
            area: currentPlotData?.area_acres ?? null,
            biomass: calculatedBiomass,
            totalBiomass: totalBiomassForMetric,
            daysToHarvest: currentPlotData?.days_to_harvest ?? null,
            growthStage: currentPlotData?.harvest_status ||
              currentPlotData?.Sugarcane_Status ||
              currentPlotData?.growth_stage ||
              currentPlotData?.crop_status ||
              null,
            soilPH: currentPlotData?.soil?.phh2o ?? null,
            organicCarbonDensity:
              currentPlotData?.soil?.organic_carbon_stock ??
              currentPlotData?.organic_carbon_stock ??
              null,
            actualYield: currentPlotData?.brix_sugar?.sugar_yield?.mean ?? null,
            stressCount: currentPlotData?.stress_events ??
              currentPlotData?.stress_count ??
              0,
            irrigationEvents: currentPlotData?.irrigation_events ??
              currentPlotData?.irrigation_count ??
              null,
            sugarYieldMean: sugarYieldMeanValue,
            cnRatio: null,
            sugarYieldMax: currentPlotData?.brix_sugar?.sugar_yield?.max ?? null,
            sugarYieldMin: currentPlotData?.brix_sugar?.sugar_yield?.min ?? null,
          };
          setMetrics(newMetrics);
        }
        // Mark as loaded to prevent re-fetching
        dataLoadedRef.current[currentPlotId] = true;
      } else {
        // Data not preloaded, fetch it
        console.log('📡 Data not in context/cache, fetching for plot:', currentPlotId);
        fetchAllData().then(() => {
          // Mark as loaded after successful fetch
          dataLoadedRef.current[currentPlotId] = true;
        }).catch(() => {
          // Don't mark as loaded if fetch failed, so it can retry
        });
      }
    }
  }, [currentPlotId, profileLoading, getApiData, lineChartData.length, metrics.area]);

  useEffect(() => {
    if (lineChartData.length > 0) {
      const aggregated = aggregateDataByPeriod(lineChartData, timePeriod);
      setAggregatedData(aggregated);
    }
  }, [lineChartData, timePeriod]);

  const aggregateDataByPeriod = (
    data: LineChartData[],
    period: TimePeriod
  ): LineChartData[] => {
    if (period === "daily") {
      // Filter to last 1 day for daily period
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Set to midnight for accurate date comparison
      const today = new Date(now);

      let filteredData = data.filter((item) => {
        const itemDate = new Date(item.date);
        itemDate.setHours(0, 0, 0, 0); // Set to midnight for accurate comparison
        return itemDate.getTime() === today.getTime();
      });

      if (filteredData.length === 0) {
        // If no data for today, get the most recent day
        const sorted = [...data].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        if (sorted.length > 0) {
          const mostRecentDate = new Date(sorted[0].date);
          mostRecentDate.setHours(0, 0, 0, 0);
          filteredData = data.filter((item) => {
            const itemDate = new Date(item.date);
            itemDate.setHours(0, 0, 0, 0);
            return itemDate.getTime() === mostRecentDate.getTime();
          });
        }
      }

      // If only one data point, duplicate it to create a line representation
      if (filteredData.length === 1) {
        const singlePoint = filteredData[0];
        // Create a second point with the same values to render as a horizontal line
        const secondPoint = {
          ...singlePoint,
          date: singlePoint.date, // Same date to create a horizontal line
        };
        return [singlePoint, secondPoint];
      }

      return filteredData;
    }

    // Weekly = show last 7 days trend (no week-bucketing; avoids collapsing into 1 point)
    if (period === "weekly") {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 6); // include today = 7 days total

      const weeklyData = data
        .filter((item) => {
          const itemDate = new Date(item.date);
          itemDate.setHours(0, 0, 0, 0);
          return itemDate >= sevenDaysAgo && itemDate <= now;
        })
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

      if (weeklyData.length === 1) {
        return [weeklyData[0], { ...weeklyData[0] }];
      }

      if (weeklyData.length === 0) {
        const sorted = [...data].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        const recent = sorted.slice(0, 7).reverse();
        if (recent.length === 1) return [recent[0], { ...recent[0] }];
        return recent;
      }

      return weeklyData;
    }

    let filteredData = data;

    const groupedData: { [key: string]: LineChartData[] } = {};

    filteredData.forEach((item) => {
      const date = new Date(item.date);
      let key: string;

      switch (period) {
        case "weekly":
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          // Use local date parts (avoid `toISOString()` UTC shifting by timezone)
          key = `${weekStart.getFullYear()}-${String(
            weekStart.getMonth() + 1
          ).padStart(2, "0")}-${String(weekStart.getDate()).padStart(2, "0")}`;
          break;
        case "monthly":
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
            2,
            "0"
          )}`;
          break;
        case "yearly":
          return;
        default:
          key = item.date;
      }

      if (!groupedData[key]) {
        groupedData[key] = [];
      }
      groupedData[key].push(item);
    });

    if (period === "yearly") {
      return [...data].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    }

    const result = Object.entries(groupedData)
      .map(([key, items]) => {
        const avgGrowth =
          items.reduce((sum, item) => sum + item.growth, 0) / items.length;
        const avgStress =
          items.reduce((sum, item) => sum + item.stress, 0) / items.length;
        const avgWater =
          items.reduce((sum, item) => sum + item.water, 0) / items.length;
        const avgMoisture =
          items.reduce((sum, item) => sum + item.moisture, 0) / items.length;

        let displayDate: string;
        if (period === "monthly") {
          const [year, month] = key.split("-");
          displayDate = new Date(
            parseInt(year),
            parseInt(month) - 1
          ).toLocaleDateString("en-US", { month: "short", year: "numeric" });
        } else {
          displayDate = key;
        }

        return {
          date: key,
          displayDate,
          growth: avgGrowth,
          stress: avgStress,
          water: avgWater,
          moisture: avgMoisture,
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return result;
  };

  const fetchAllData = async (): Promise<void> => {
    console.log(`🚀 fetchAllData called with currentPlotId: ${currentPlotId}`);

    if (!currentPlotId) {
      console.warn("⚠️ FarmerDashboard: No plot ID available");
      return;
    }

    // Check if data already exists in cache before fetching
    const tzOffsetMs = new Date().getTimezoneOffset() * 60000;
    const endDate = new Date(Date.now() - tzOffsetMs)
      .toISOString()
      .slice(0, 10);
    const indicesCacheKey = `indices_${currentPlotId}`;
    const agroStatsCacheKey = `agroStats_v3_${currentPlotId}_${endDate}`;

    const hasAgroStats = hasApiData('agroStats', currentPlotId);
    const hasIndices = hasApiData('indices', currentPlotId);
    const cachedIndices = getCache(indicesCacheKey);
    const cachedAgroStats = getCache(agroStatsCacheKey);

    // If both data exist in cache, skip fetching
    if ((hasAgroStats || cachedAgroStats) && (hasIndices || cachedIndices)) {
      console.log('✅ FarmerDashboard: Data already exists in cache, loading from cache');
      // Load cached data into state
      const indicesToUse = getApiData('indices', currentPlotId) || cachedIndices || [];
      setLineChartData(indicesToUse);

      const agroStatsToUse = getApiData('agroStats', currentPlotId) || cachedAgroStats;
      let currentPlotData = null;
      if (agroStatsToUse) {
        currentPlotData = agroStatsToUse[currentPlotId] ||
          agroStatsToUse[`"${currentPlotId}"`] ||
          (typeof agroStatsToUse === 'object' && !Array.isArray(agroStatsToUse) && !agroStatsToUse[currentPlotId] ? agroStatsToUse : null);
      }

      if (currentPlotData) {
        const sugarYieldMeanValue = currentPlotData?.brix_sugar?.sugar_yield?.mean ?? null;
        let calculatedBiomass = null;
        let totalBiomassForMetric = null;
        if (sugarYieldMeanValue !== null) {
          const totalBiomass = sugarYieldMeanValue * 1.27;
          const underGroundBiomassInTons = totalBiomass * 0.12;
          calculatedBiomass = underGroundBiomassInTons;
          totalBiomassForMetric = totalBiomass;
        }
        const newMetrics = {
          brix: currentPlotData?.brix_sugar?.brix?.mean ?? null,
          brixMin: currentPlotData?.brix_sugar?.brix?.min ?? null,
          brixMax: currentPlotData?.brix_sugar?.brix?.max ?? null,
          recovery: currentPlotData?.brix_sugar?.recovery?.mean ?? null,
          area: currentPlotData?.area_acres ?? null,
          biomass: calculatedBiomass,
          totalBiomass: totalBiomassForMetric,
          daysToHarvest: currentPlotData?.days_to_harvest ?? null,
          growthStage: currentPlotData?.harvest_status ||
            currentPlotData?.Sugarcane_Status ||
            currentPlotData?.growth_stage ||
            currentPlotData?.crop_status ||
            null,
          soilPH: currentPlotData?.soil?.phh2o ?? null,
          organicCarbonDensity:
            currentPlotData?.soil?.organic_carbon_stock ??
            currentPlotData?.organic_carbon_stock ??
            null,
          actualYield: currentPlotData?.brix_sugar?.sugar_yield?.mean ?? null,
          stressCount: currentPlotData?.stress_events ??
            currentPlotData?.stress_count ??
            0,
          irrigationEvents: currentPlotData?.irrigation_events ??
            currentPlotData?.irrigation_count ??
            null,
          sugarYieldMean: sugarYieldMeanValue,
          cnRatio: null,
          sugarYieldMax: currentPlotData?.brix_sugar?.sugar_yield?.max ?? null,
          sugarYieldMin: currentPlotData?.brix_sugar?.sugar_yield?.min ?? null,
        };
        setMetrics(newMetrics);
      }
      dataLoadedRef.current[currentPlotId] = true;
      return; // Exit early, don't fetch
    }

    try {
      console.log(`📅 Calculating end date...`);
      const tzOffsetMs = new Date().getTimezoneOffset() * 60000;
      const endDate = new Date(Date.now() - tzOffsetMs)
        .toISOString()
        .slice(0, 10);
      console.log(`📅 End date calculated: ${endDate}`);

      const indicesCacheKey = `indices_${currentPlotId}`;
      let rawIndices = getCache(indicesCacheKey);

      if (!rawIndices) {
        const indicesRes = await axios.get(
          `${BASE_URL}/plots/${currentPlotId}/indices`,
          { timeout: 300000 } // 5 minutes timeout
        );
        rawIndices = indicesRes.data.map((item: any) => ({
          date: new Date(item.date).toISOString().split("T")[0],
          growth: item.NDVI,
          stress: item.NDMI,
          water: item.NDWI,
          moisture: item.NDRE,
        }));
        setCache(indicesCacheKey, rawIndices);
      }

      setLineChartData(rawIndices);

      // Store in context for future use
      setApiData('indices', currentPlotId, rawIndices);

      // Stress data - try to get from cache, but all data should come from agroStats
      const stressCacheKey = `stress_${currentPlotId}_NDMI_0.15`;
      let stressData = getCache(stressCacheKey);

      if (!stressData) {
        try {
          const stressRes = await axios.get(
            `${BASE_URL}/plots/${currentPlotId}/stress?index_type=NDRE&threshold=0.15`,
            { timeout: 300000 } // 5 minutes timeout
          );
          stressData = stressRes.data;
          setCache(stressCacheKey, stressData);
        } catch (stressErr) {
          console.warn("⚠️ Error fetching stress data (non-critical, using agroStats):", stressErr);
          stressData = { total_events: 0, events: [] };
        }
      }

      setStressEvents(stressData?.events ?? []);

      const irrigationCacheKey = `irrigation_${currentPlotId}`;
      let irrigationData = getCache(irrigationCacheKey);

      if (!irrigationData) {
        try {
          const irrigationRes = await axios.get(
            `${BASE_URL}/plots/${currentPlotId}/irrigation?threshold_ndmi=0.05&threshold_ndwi=0.05&min_days_between_events=10`,
            { timeout: 300000 } // 5 minutes timeout
          );
          irrigationData = irrigationRes.data;
          setCache(irrigationCacheKey, irrigationData);
        } catch (irrErr) {
          console.warn("⚠️ Error fetching irrigation data (non-critical):", irrErr);
          irrigationData = { total_events: null };
        }
      }

      // All data comes from agroStats - no need for separate harvest endpoint
      // Use end_date for fetching agroStats data
      const yieldDataDate = endDate;
      // Use versioned cache key to ensure fresh data structure
      const agroStatsCacheKey = `agroStats_v3_${currentPlotId}_${yieldDataDate}`;
      // API endpoint: /plots/agroStats with end_date query parameter
      const agroStatsUrl = `${BASE_URL}/plots/agroStats?end_date=${yieldDataDate}`;

      console.log(`🔍 Checking agroStats cache for key: ${agroStatsCacheKey}`);
      console.log(`🌐 BASE_URL: ${BASE_URL}`);
      console.log(`🌐 AgroStats URL: ${agroStatsUrl}`);
      console.log(`📅 Using date: ${yieldDataDate}`);
      console.log(`📋 Plot ID: ${currentPlotId}`);

      let allPlotsData = getCache(agroStatsCacheKey);

      if (!allPlotsData) {
        try {
          console.log(`📊 Fetching agroStats from: ${agroStatsUrl}`);
          console.log(`⏳ Making GET request to agroStats endpoint...`);

          const agroStatsRes = await axios.get(agroStatsUrl, {
            timeout: 300000, // 5 minutes timeout to prevent session timeout
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            }
          });

          console.log(`✅ AgroStats API Response Status: ${agroStatsRes.status}`);
          console.log(`✅ AgroStats API Response Headers:`, agroStatsRes.headers);
          console.log(`✅ AgroStats API Response Data Type:`, typeof agroStatsRes.data);
          console.log(`✅ AgroStats API Response Data:`, agroStatsRes.data);

          // Handle different response formats
          if (agroStatsRes.data) {
            allPlotsData = agroStatsRes.data;
            // Cache the full response (all plots data)
            setCache(agroStatsCacheKey, allPlotsData);
            // Also cache with v3 format for compatibility
            setCache(`agroStats_v3_${currentPlotId}_${yieldDataDate}`, allPlotsData);
            // Store full response in context for future use (so extraction logic can work)
            setApiData('agroStats', currentPlotId, allPlotsData);
            console.log(`✅ Successfully fetched and cached agroStats for plot: ${currentPlotId}`);
            console.log(`📦 Response contains ${Object.keys(allPlotsData || {}).length} plot(s)`);
            console.log(`📋 Available plot IDs in response:`, Object.keys(allPlotsData || {}).slice(0, 10));
          } else {
            console.warn(`⚠️ AgroStats API returned empty response`);
            allPlotsData = null;
          }
        } catch (err) {
          console.error("❌ Error fetching agroStats:", err);
          if (axios.isAxiosError(err)) {
            console.error("❌ Error Response Status:", err.response?.status);
            console.error("❌ Error Response Status Text:", err.response?.statusText);
            console.error("❌ Error Response Data:", err.response?.data);
            console.error("❌ Error Request URL:", err.config?.url);
            console.error("❌ Error Request Method:", err.config?.method?.toUpperCase());
            console.error("❌ Error Request Headers:", err.config?.headers);
            console.error("❌ Error Message:", err.message);
            console.error("❌ Error Code:", err.code);
          } else {
            console.error("❌ Unknown error:", err);
          }
          allPlotsData = null;
        }
      } else {
        console.log(`✅ Using cached agroStats for plot: ${currentPlotId}`);
        console.log(`📦 Cached data keys:`, Object.keys(allPlotsData || {}));
      }

      // Extract plot data from response - agroStats returns object with plot IDs as keys
      // Response format: { "13D_13": { brix_sugar: {...}, soil: {...}, area_acres: ... }, ... }
      let currentPlotData = null;

      if (allPlotsData) {
        // The response is an object where keys are plot IDs (may be quoted or unquoted)
        // Try direct access with plot ID (unquoted)
        currentPlotData = allPlotsData[currentPlotId] || null;

        // Try with quoted plot ID (some APIs return keys as quoted strings)
        if (!currentPlotData) {
          const quotedPlotId = `"${currentPlotId}"`;
          currentPlotData = allPlotsData[quotedPlotId] || null;
        }

        // Try with underscore replaced (in case plot ID format differs)
        if (!currentPlotData && currentPlotId.includes('_')) {
          const altPlotId = currentPlotId.replace('_', '"_"');
          currentPlotData = allPlotsData[altPlotId] || null;
        }

        // Try if response is an array (unlikely but handle it)
        if (!currentPlotData && Array.isArray(allPlotsData)) {
          currentPlotData = allPlotsData.find((plot: any) =>
            plot.plot_id === currentPlotId ||
            plot.fastapi_plot_id === currentPlotId ||
            plot.id === currentPlotId ||
            plot.plot_name === currentPlotId
          ) || null;
        }

        // Try if response has a 'data' or 'plots' property (nested response)
        if (!currentPlotData && typeof allPlotsData === 'object' && !Array.isArray(allPlotsData)) {
          const dataProperty = allPlotsData.data || allPlotsData.plots || allPlotsData.results;
          if (dataProperty) {
            if (Array.isArray(dataProperty)) {
              currentPlotData = dataProperty.find((plot: any) =>
                plot.plot_id === currentPlotId ||
                plot.fastapi_plot_id === currentPlotId ||
                plot.id === currentPlotId ||
                plot.plot_name === currentPlotId
              ) || null;
            } else if (typeof dataProperty === 'object') {
              currentPlotData = dataProperty[currentPlotId] ||
                dataProperty[`"${currentPlotId}"`] ||
                null;
            }
          }
        }
      }

      // Log data extraction results
      if (!currentPlotData && allPlotsData) {
        console.warn(`⚠️ Plot data not found for ${currentPlotId} in agroStats response`);
        console.log(`📦 Response structure:`, {
          type: Array.isArray(allPlotsData) ? 'array' : typeof allPlotsData,
          keys: Array.isArray(allPlotsData) ? `Array with ${allPlotsData.length} items` : Object.keys(allPlotsData || {}),
          sample: Array.isArray(allPlotsData) ? allPlotsData[0] : Object.keys(allPlotsData || {}).slice(0, 5)
        });
      } else if (!allPlotsData) {
        console.error(`❌ No agroStats data available for plot: ${currentPlotId}`);
      } else {
        console.log(`✅ Found plot data for: ${currentPlotId}`);
        console.log(`📊 Plot data structure:`, {
          hasBrixSugar: !!currentPlotData?.brix_sugar,
          hasSoil: !!currentPlotData?.soil,
          hasArea: currentPlotData?.area_acres !== undefined,
          keys: Object.keys(currentPlotData || {})
        });
      }

      // All data now comes from agroStats, no need for separate soil analyze endpoint
      const sugarYieldMeanValue =
        currentPlotData?.brix_sugar?.sugar_yield?.mean ?? null;

      let calculatedBiomass = null;
      let totalBiomassForMetric = null;

      if (sugarYieldMeanValue !== null) {
        const totalBiomass = sugarYieldMeanValue * 1.27;
        const underGroundBiomassInTons = totalBiomass * 0.12;
        calculatedBiomass = underGroundBiomassInTons;
        totalBiomassForMetric = totalBiomass;
      }

      // Extract all metrics from agroStats data only
      // All data comes from agroStats endpoint - no separate API calls needed
      const newMetrics = {
        brix: currentPlotData?.brix_sugar?.brix?.mean ?? null,
        brixMin: currentPlotData?.brix_sugar?.brix?.min ?? null,
        brixMax: currentPlotData?.brix_sugar?.brix?.max ?? null,
        recovery: currentPlotData?.brix_sugar?.recovery?.mean ?? null,
        area: currentPlotData?.area_acres ?? null,
        biomass: calculatedBiomass,
        totalBiomass: totalBiomassForMetric,
        daysToHarvest: currentPlotData?.days_to_harvest ?? null,
        growthStage: currentPlotData?.harvest_status ||
          currentPlotData?.Sugarcane_Status ||
          currentPlotData?.growth_stage ||
          currentPlotData?.crop_status ||
          null,
        soilPH: currentPlotData?.soil?.phh2o ?? null,
        // Organic carbon stock from agroStats response (keep the exact value from backend)
        organicCarbonDensity:
          currentPlotData?.soil?.organic_carbon_stock ??
          currentPlotData?.organic_carbon_stock ??
          null,
        actualYield: currentPlotData?.brix_sugar?.sugar_yield?.mean ?? null,
        stressCount: currentPlotData?.stress_events ??
          currentPlotData?.stress_count ??
          stressData?.total_events ??
          0,
        irrigationEvents: currentPlotData?.irrigation_events ??
          currentPlotData?.irrigation_count ??
          irrigationData?.total_events ??
          null,
        sugarYieldMean: sugarYieldMeanValue,
        cnRatio: null,
        sugarYieldMax: currentPlotData?.brix_sugar?.sugar_yield?.max ?? null,
        sugarYieldMin: currentPlotData?.brix_sugar?.sugar_yield?.min ?? null,
      };

      console.log(`📊 Metrics extracted from agroStats:`, {
        plotId: currentPlotId,
        hasData: !!currentPlotData,
        metrics: newMetrics
      });

      setMetrics(newMetrics);

      // Mark data as loaded to prevent re-fetching
      dataLoadedRef.current[currentPlotId] = true;
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  const fetchNDREStressEvents = async (): Promise<void> => {
    if (!currentPlotId) {
      console.warn(
        "⚠️ FarmerDashboard: No plot ID available for NDRE stress events"
      );
      return;
    }

    try {
      const res = await axios.get(
        `${BASE_URL}/plots/${currentPlotId}/stress?index_type=NDRE&threshold=0.15`,
        { timeout: 300000 } // 5 minutes timeout
      );
      const data = res.data;
      setNdreStressEvents(data.events ?? []);
      setShowNDREEvents(true);
    } catch (err) {
      console.error("Error fetching NDRE stress events:", err);
    }
  };

  useEffect(() => {
    if (aggregatedData.length > 0) {
      const combined = aggregatedData.map((point) => {
        const stressEvent = showNDREEvents
          ? ndreStressEvents.find((event) => {
            const eventStart = new Date(event.from_date);
            const eventEnd = new Date(event.to_date);
            const pointDate = new Date(point.date);
            return pointDate >= eventStart && pointDate <= eventEnd;
          })
          : null;

        return {
          ...point,
          stressLevel: stressEvent ? stressEvent.stress : null,
          isStressEvent: !!stressEvent,
          stressEventData: stressEvent,
        };
      });

      setCombinedChartData(combined);
    }
  }, [aggregatedData, ndreStressEvents, showNDREEvents]);

  // Fetch Brix Time Series data
  useEffect(() => {
    const fetchBrixTimeSeries = async () => {
      if (!currentPlotId || !profile || profileLoading) {
        return;
      }

      // Get the selected plot
      const selectedPlot = profile.plots?.find(
        (plot) => plot.fastapi_plot_id === currentPlotId
      );

      if (!selectedPlot?.farms || selectedPlot.farms.length === 0) {
        return;
      }

      // Get pruning date from first farm (prefer foundation_pruning_date, fallback to fruit_pruning_date)
      const firstFarm = selectedPlot.farms[0] as any;
      const pruningDate = firstFarm?.foundation_pruning_date ||
        firstFarm?.fruit_pruning_date ||
        firstFarm?.plantation_date;

      if (!pruningDate) {
        console.warn('⚠️ No pruning date found for plot:', currentPlotId);
        setBrixTimeSeriesError('No pruning date available');
        return;
      }

      // Format pruning date to YYYY-MM-DD
      const formattedPruningDate = pruningDate.split('T')[0];

      // Check cache first
      const cacheKey = `brixTimeSeries_${currentPlotId}_${formattedPruningDate}`;
      const cached = getCache(cacheKey);
      if (cached && cached.time_series) {
        console.log('✅ Using cached brix time series data');
        setBrixTimeSeriesData(cached.time_series || []);
        setBrixTimeSeriesLoading(false);
        setBrixTimeSeriesError(null);
        return;
      }

      // Check global context
      const contextData = getApiData('brixTimeSeries', currentPlotId);
      if (contextData && contextData.time_series) {
        console.log('✅ Using brix time series data from context');
        setBrixTimeSeriesData(contextData.time_series);
        setBrixTimeSeriesLoading(false);
        setBrixTimeSeriesError(null);
        return;
      }

      // Fetch from API
      setBrixTimeSeriesLoading(true);
      setBrixTimeSeriesError(null);

      try {
        console.log('🌱 Fetching brix time series for plot:', currentPlotId, 'pruning_date:', formattedPruningDate);
        const data = await getBrixTimeSeries(currentPlotId, formattedPruningDate);

        const timeSeries = data?.time_series || [];
        setBrixTimeSeriesData(timeSeries);

        // Cache the data
        setCache(cacheKey, data);
        setApiData('brixTimeSeries', currentPlotId, data);

        setBrixTimeSeriesError(null);
      } catch (error: any) {
        console.error('❌ Error fetching brix time series:', error);
        setBrixTimeSeriesError(error?.message || 'Failed to load data');
        setBrixTimeSeriesData([]);
      } finally {
        setBrixTimeSeriesLoading(false);
      }
    };

    fetchBrixTimeSeries();
  }, [currentPlotId, profile, profileLoading, getCache, setCache, getApiData, setApiData]);

  const toggleLine = (key: string): void => {
    const isOnlyThis = Object.keys(visibleLines).every((k) =>
      k === key
        ? visibleLines[k as keyof VisibleLines]
        : !visibleLines[k as keyof VisibleLines]
    );

    if (isOnlyThis) {
      setVisibleLines({
        growth: true,
        stress: true,
        water: true,
        moisture: true,
      });
    } else {
      setVisibleLines({
        growth: key === "growth",
        stress: key === "stress",
        water: key === "water",
        moisture: key === "moisture",
      });
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStressColor = (stress: number): string => {
    if (stress < 0.1) return "#dc2626";
    if (stress < 0.15) return "#f97316";
    return "#eab308";
  };

  const getStressSeverityLabel = (stress: number): string => {
    if (stress < 0.1) return "High";
    if (stress < 0.15) return "Medium";
    return "Low";
  };

  const CustomStressDot: React.FC<CustomStressDotProps> = (props) => {
    const { cx, cy, payload } = props;

    if (!payload || !payload.isStressEvent) return null;

    const color = getStressColor(payload.stressLevel);
    const radius =
      payload.stressLevel < 0.1 ? 10 : payload.stressLevel < 0.15 ? 8 : 6;

    return (
      <g>
        <circle
          cx={cx}
          cy={cy}
          r={radius + 1}
          fill="white"
          stroke={color}
          strokeWidth={2}
          fillOpacity={0.9}
        />
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill={color}
          fillOpacity={0.8}
          stroke={color}
          strokeWidth={1}
        />
      </g>
    );
  };

  const CustomTooltip: React.FC<CustomTooltipProps> = ({
    active,
    payload,
    label,
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 rounded-lg shadow-lg backdrop-blur-sm">
          <p className="text-xs font-semibold text-gray-800 mb-1">
            {timePeriod === "monthly" ? label : formatDate(label || "")}
          </p>
          {payload.map((entry, index) => {
            let displayValue = "";
            let displayLabel = "";

            if (
              entry.dataKey === "stressLevel" &&
              entry.payload?.isStressEvent
            ) {
              displayValue = `${Number(entry.value).toFixed(
                4
              )} (${getStressSeverityLabel(entry.value)})`;
              displayLabel = "NDRE Stress Level";
            } else if (lineStyles[entry.dataKey as keyof LineStyles]) {
              const value = entry.value;
              const numericValue =
                typeof value === "number" ? value : parseFloat(value);
              displayValue = !isNaN(numericValue)
                ? numericValue.toFixed(4)
                : "N/A";
              displayLabel =
                lineStyles[entry.dataKey as keyof LineStyles]?.label ||
                entry.dataKey;
            } else {
              return null;
            }

            return (
              <div key={index} className="flex items-center gap-1 mb-1">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-gray-600">
                  {displayLabel}: {displayValue}
                </span>
              </div>
            );
          })}
        </div>
      );
    }

    return null;
  };

  const TimePeriodToggle: React.FC = () => (
    <div className="flex flex-wrap gap-1 mb-3">
      {(["daily", "weekly", "monthly", "yearly"] as TimePeriod[]).map(
        (period) => (
          <button
            key={period}
            onClick={() => setTimePeriod(period)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${timePeriod === period
              ? "bg-blue-500 text-white shadow-md transform scale-105"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm"
              }`}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </button>
        )
      )}
    </div>
  );

  const ChartLegend: React.FC = () => (
    <div className="flex flex-wrap gap-1 text-xs font-medium mb-2">
      {Object.entries(lineStyles).map(([key, { color, label }]) => (
        <button
          key={key}
          onClick={() => toggleLine(key)}
          className={`flex items-center gap-1 px-2 py-1 rounded-full transition-all duration-200 ${visibleLines[key as keyof VisibleLines]
            ? "bg-white shadow-sm transform scale-105"
            : "bg-gray-100 opacity-50 hover:opacity-75"
            }`}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-gray-700 text-xs">{label}</span>
        </button>
      ))}
      {showNDREEvents && (
        <div className="flex items-center gap-1 ml-1 px-2 py-1 bg-orange-100 rounded-md border border-orange-300">
          <div className="w-2 h-2 rounded-full bg-orange-500 border border-orange-600"></div>
          <span className="text-orange-800 font-semibold text-xs">Stress</span>
        </div>
      )}
    </div>
  );

  const currentBiomass = metrics.biomass || 0;
  const totalBiomass = metrics.totalBiomass || 0;

  const biomassData = [
    {
      name: "Total Biomass",
      value: totalBiomass,
      fill: "#3b82f6",
    },
    {
      name: "Underground Biomass",
      value: currentBiomass,
      fill: "#10b981",
    },
  ];

  const recoveryComparisonData = [
    {
      name: "Your Farm",
      value: metrics.recovery || 0,
      fill: "#10b981",
      label: "Your Recovery Rate",
    },
    {
      name: "Regional Average",
      value: OTHER_FARMERS_RECOVERY.regional_average,
      fill: "#3b82f6",
      label: "Regional Average",
    },
    {
      name: "Top 25%",
      value: OTHER_FARMERS_RECOVERY.top_quartile,
      fill: "#22c55e",
      label: "Top Quartile",
    },
    {
      name: "Similar Farms",
      value: OTHER_FARMERS_RECOVERY.similar_farms,
      fill: "#f59e0b",
      label: "Similar Farms",
    },
  ];

  if (profileLoading) {
    return (
      <div className="min-h-screen dashboard-bg flex items-center justify-center">
        <CommonSpinner />
      </div>
    );
  }

  if (!currentPlotId) {
    return (
      <div className="min-h-screen dashboard-bg p-3 flex items-center justify-center">
        <div className="text-center bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-8 max-w-md">
          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            No Plots Found
          </h3>
          <p className="text-gray-600">
            No farm plots are registered to your account. Please contact your
            field officer to register your farm plot.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dashboard-bg p-3" style={{
      width: '100%',
      maxWidth: '100vw',
      overflowX: 'hidden',
      boxSizing: 'border-box',
      margin: '0 auto',
      display: 'flex',
      justifyContent: 'center'
    }}>
      <div className="max-w-7xl space-y-4" style={{
        width: '100%',
        maxWidth: '1280px',
        minWidth: '320px',
        boxSizing: 'border-box',
        margin: '0 auto',
        padding: '0'
      }}>
        {/* Plot Selector */}
        {profile && !profileLoading && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <div className="flex items-center gap-4">
              <label className="font-semibold text-gray-700 whitespace-nowrap">Select Plot:</label>
              <select
                value={selectedPlotName || ""}
                onChange={(e) => {
                  setSelectedPlotName(e.target.value);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px] w-auto max-w-xs"
              >
                {profile.plots?.map(plot => {
                  let displayName = '';

                  if (plot.gat_number && plot.plot_number &&
                    plot.gat_number.trim() !== "" && plot.plot_number.trim() !== "" &&
                    !plot.gat_number.startsWith('GAT_') && !plot.plot_number.startsWith('PLOT_')) {
                    displayName = `${plot.gat_number}_${plot.plot_number}`;
                  } else if (plot.gat_number && plot.gat_number.trim() !== "" && !plot.gat_number.startsWith('GAT_')) {
                    displayName = plot.gat_number;
                  } else if (plot.plot_number && plot.plot_number.trim() !== "" && !plot.plot_number.startsWith('PLOT_')) {
                    displayName = plot.plot_number;
                  } else {
                    const village = plot.address?.village;
                    const taluka = plot.address?.taluka;

                    if (village) {
                      displayName = `Plot in ${village}`;
                      if (taluka) displayName += `, ${taluka}`;
                    } else {
                      displayName = 'Plot (No GAT/Plot Number)';
                    }
                  }

                  return (
                    <option key={plot.fastapi_plot_id} value={plot.fastapi_plot_id}>
                      {displayName}
                    </option>
                  );
                }) || []}
              </select>
            </div>
          </div>
        )}

        {/* Debug Info Panel */}
        {showDebugInfo && (
          <div className="bg-gray-900 rounded-xl shadow-lg p-4 border border-gray-700">
            <h3 className="text-sm font-bold text-green-400 mb-2 flex items-center gap-2">
              <Activity className="w-6 h-6 sm:w-7 sm:h-7" />
              Debug Information - API Response
            </h3>
            <div className="bg-black rounded-lg p-3 overflow-auto max-h-96">
              <pre className="text-xs text-green-300 font-mono">
                {JSON.stringify(
                  {
                    farmerProfile: profile,
                    extractedPlotId: currentPlotId,
                    plotIdType: typeof currentPlotId,
                    availablePlots:
                      profile?.plots?.map((p) => p.fastapi_plot_id) || [],
                    timestamp: new Date().toISOString(),
                  },
                  null,
                  2
                )}
              </pre>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              💡 Check the browser console for detailed extraction logs
            </p>
          </div>
        )}

        {/* Top Priority Metrics - 4 Key Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
          <div className="rounded-xl p-5 hover:shadow-md transition-all duration-300" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)', width: '100%', maxWidth: '100%', boxSizing: 'border-box', backgroundColor: '#eff2e7' }}>
            <div className="flex items-center justify-between mb-2">
              <img src="/Image/crop images/Fields.png" alt="Field Area" className="w-14 h-14 sm:w-16 sm:h-16 object-contain" style={{ backgroundColor: 'transparent', mixBlendMode: 'normal' }} />
              <div className="text-right">
                <div className="text-2xl font-bold" style={{ color: '#212121', fontFamily: 'Inter, Poppins, sans-serif' }}>
                  {metrics.area?.toFixed(2) || "-"}
                </div>
                <div className="text-sm font-semibold" style={{ color: '#6bb043' }}>
                  acre
                </div>
              </div>
            </div>
            <p className="text-xs font-medium mt-3" style={{ color: '#616161', lineHeight: '1.2' }}>Field Area</p>
          </div>

          <div className="rounded-xl p-5 hover:shadow-md transition-all duration-300" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)', width: '100%', maxWidth: '100%', boxSizing: 'border-box', backgroundColor: '#f5f1e1' }}>
            <div className="flex items-center justify-between mb-2">
              <img src="/Image/crop images/Crop Status.png" alt="Crop Status" className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-lg" style={{ maxWidth: '100%', height: 'auto', marginLeft: '-8px' }} />
              <div className="text-right">
                <div className="text-2xl font-bold" style={{ color: '#212121', fontFamily: 'Inter, Poppins, sans-serif' }}>
                  {metrics.growthStage || "-"}
                </div>
                <div className="text-sm font-semibold" style={{ color: '#6bb043', visibility: 'hidden' }}>
                  &nbsp;
                </div>
              </div>
            </div>
            <p className="text-xs font-medium mt-3" style={{ color: '#616161', lineHeight: '1.2' }}>Crop Status</p>
          </div>

          <div className="rounded-xl p-5 hover:shadow-md transition-all duration-300" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)', width: '100%', maxWidth: '100%', boxSizing: 'border-box', backgroundColor: '#f3f5e9' }}>
            <div className="flex items-center justify-between mb-2">
              <img src="/Image/crop images/Time.png" alt="Time" className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-lg" style={{ maxWidth: '100%', height: 'auto' }} />
              <div className="text-right">
                <div className="text-2xl font-bold" style={{ color: '#212121', fontFamily: 'Inter, Poppins, sans-serif' }}>
                  {metrics.daysToHarvest !== null ? metrics.daysToHarvest : "-"}
                </div>
                <div className="text-sm font-semibold" style={{ color: '#6bb043' }}>
                  Days
                </div>
              </div>
            </div>
            <p className="text-xs font-medium mt-3" style={{ color: '#616161', lineHeight: '1.2' }}>Time to Harvest</p>
          </div>

          <div className="rounded-xl p-5 hover:shadow-md transition-all duration-300" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)', width: '100%', maxWidth: '100%', boxSizing: 'border-box', backgroundColor: '#f5f1e1' }}>
            <div className="flex items-center justify-between mb-2">
              <img src="/Image/crop images/yield.png" alt="Sugar Content" className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-lg" style={{ maxWidth: '100%', height: 'auto' }} />
              <div className="text-right">
                <div className="text-2xl font-bold" style={{ color: '#212121', fontFamily: 'Inter, Poppins, sans-serif' }}>
                  {metrics.brix !== null && metrics.brix !== undefined ? (metrics.brix === 0 ? "0" : metrics.brix) : "-"}
                </div>
                <div className="text-sm font-semibold" style={{ color: '#6bb043' }}>
                  °Brix
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
              <span className="text-xs font-medium" style={{ color: '#616161' }}>Sugar Content</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold" style={{ color: '#ef4444' }}>Min:</span>
                  <span className="text-xs font-bold" style={{ color: '#212121' }}>
                    {metrics.brixMin !== null && metrics.brixMin !== undefined ? (metrics.brixMin === 0 ? "0" : metrics.brixMin) : "-"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold" style={{ color: '#22c55e' }}>Max:</span>
                  <span className="text-xs font-bold" style={{ color: '#212121' }}>
                    {metrics.brixMax !== null && metrics.brixMax !== undefined ? (metrics.brixMax === 0 ? "0" : metrics.brixMax) : "-"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Field Indices Analysis Chart */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-2 sm:p-4" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-3">
            <div className="flex items-center gap-2 mb-2 lg:mb-0">
              <LineChartIcon className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" />
              <h3 className="text-lg font-bold text-gray-800">
                Field Indices Analysis
              </h3>
            </div>
            <TimePeriodToggle />
          </div>

          <ChartLegend />

          <div className="h-80 sm:h-96 md:h-[28rem] bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg px-0 sm:px-3 -mx-2 sm:mx-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={combinedChartData}
                margin={{ top: 10, right: 6, left: 9, bottom: 10 }}
                layout={isMobile ? "vertical" : "horizontal"}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                {isMobile ? (
                  <>
                    <XAxis
                      type="number"
                      domain={[-0.75, 0.8]}
                      stroke="#6b7280"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      type="category"
                      dataKey={
                        timePeriod === "monthly" ? "displayDate" : "date"
                      }
                      tickFormatter={(tick: string) => {
                        if (timePeriod === "monthly") return tick;
                        if (timePeriod === "daily") {
                          const d = new Date(tick);
                          return d.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          });
                        }
                        const d = new Date(tick);
                        const yy = d.getFullYear().toString().slice(-2);
                        return `${d.toLocaleString("default", {
                          month: "short",
                        })}-${yy}`;
                      }}
                      stroke="#6b7280"
                      tick={{ fontSize: 12 }}
                    />
                  </>
                ) : (
                  <>
                    <XAxis
                      dataKey={
                        timePeriod === "monthly" ? "displayDate" : "date"
                      }
                      tickFormatter={(tick: string) => {
                        if (timePeriod === "monthly") return tick;
                        if (timePeriod === "daily") {
                          const d = new Date(tick);
                          return d.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          });
                        }
                        const d = new Date(tick);
                        const yy = d.getFullYear().toString().slice(-2);
                        return `${d.toLocaleString("default", {
                          month: "short",
                        })}-${yy}`;
                      }}
                      stroke="#6b7280"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      domain={[-0.75, 0.8]}
                      stroke="#6b7280"
                      tick={{ fontSize: 12 }}
                    />
                  </>
                )}
                <Tooltip content={<CustomTooltip />} />

                {(() => {
                  const indexRanges = {
                    water: { good: [0.4, 0.8], bad: [-0.3, -0.75] },
                    moisture: { good: [-0.25, 0.8], bad: [-0.6, -0.75] },
                    growth: { good: [0.2, 0.8], bad: [0.15, -0.75] },
                    stress: { good: [0.35, 0.8], bad: [0.2, -0.75] },
                  };

                  const visibleCount = Object.values(visibleLines).filter(
                    (v) => v
                  ).length;

                  let goodRange: [number, number] = [0.3, 0.6];
                  let badRange: [number, number] = [-0.1, 0.1];
                  let labelText = "Average";

                  if (visibleCount === 1) {
                    const selectedIndex = Object.keys(visibleLines).find(
                      (key) => visibleLines[key as keyof VisibleLines]
                    );

                    if (
                      selectedIndex &&
                      indexRanges[selectedIndex as keyof typeof indexRanges]
                    ) {
                      const range =
                        indexRanges[selectedIndex as keyof typeof indexRanges];
                      goodRange = range.good as [number, number];
                      badRange = range.bad as [number, number];
                      labelText =
                        selectedIndex.charAt(0).toUpperCase() +
                        selectedIndex.slice(1);
                    }
                  } else {
                    const allGoodRanges = Object.values(indexRanges).map(
                      (r) => r.good
                    );
                    const allBadRanges = Object.values(indexRanges).map(
                      (r) => r.bad
                    );

                    const avgGoodMin =
                      allGoodRanges.reduce((sum, [min]) => sum + min, 0) /
                      allGoodRanges.length;
                    const avgGoodMax =
                      allGoodRanges.reduce((sum, [, max]) => sum + max, 0) /
                      allGoodRanges.length;
                    const avgBadMin =
                      allBadRanges.reduce((sum, [min]) => sum + min, 0) /
                      allBadRanges.length;
                    const avgBadMax =
                      allBadRanges.reduce((sum, [, max]) => sum + max, 0) /
                      allBadRanges.length;

                    goodRange = [avgGoodMin, avgGoodMax] as [number, number];
                    badRange = [avgBadMin, avgBadMax] as [number, number];
                    labelText = "Average";
                  }

                  return (
                    <>
                      {isMobile ? (
                        <>
                          <ReferenceArea
                            x1={goodRange[0]}
                            x2={goodRange[1]}
                            fill="#1ad3e8"
                            fillOpacity={0.7}
                            stroke="none"
                          />
                          <ReferenceArea
                            x1={badRange[0]}
                            x2={badRange[1]}
                            fill="#dae81a"
                            fillOpacity={0.7}
                            stroke="none"
                          />
                        </>
                      ) : (
                        <>
                          <ReferenceArea
                            y1={goodRange[0]}
                            y2={goodRange[1]}
                            fill="#1ad3e8"
                            fillOpacity={0.7}
                            stroke="none"
                          />
                          <ReferenceArea
                            y1={badRange[0]}
                            y2={badRange[1]}
                            fill="#dae81a"
                            fillOpacity={0.7}
                            stroke="none"
                          />
                        </>
                      )}
                      {isMobile ? (
                        <>
                          {/* Mobile: two-line labels using tspans */}
                          <text
                            x="79"
                            y="25%"
                            textAnchor="middle"
                            className="text-xs font-left fill-green-600"
                            style={{ fontSize: "10px" }}
                          >
                            <tspan x="79%" dy="0">
                              Average
                            </tspan>
                            <tspan x="79%" dy="12">
                              Good ({goodRange[0].toFixed(2)} -{" "}
                              {goodRange[1].toFixed(2)})
                            </tspan>
                          </text>
                          <text
                            x="79%"
                            y="35%"
                            textAnchor="middle"
                            className="text-xs font-right fill-red-600"
                            style={{ fontSize: "10px" }}
                          >
                            <tspan x="30%" dy="0">
                              Average
                            </tspan>
                            <tspan x="35%" dy="12">
                              Bad ({badRange[0].toFixed(2)} -{" "}
                              {badRange[1].toFixed(2)})
                            </tspan>
                          </text>
                        </>
                      ) : (
                        <>
                          <text
                            x="95%"
                            y="25%"
                            textAnchor="end"
                            className="text-xs font-medium fill-green-600"
                            style={{ fontSize: "10px" }}
                          >
                            {labelText} Good ({goodRange[0].toFixed(2)} -{" "}
                            {goodRange[1].toFixed(2)})
                          </text>
                          <text
                            x="95%"
                            y="75%"
                            textAnchor="end"
                            className="text-xs font-medium fill-red-600"
                            style={{ fontSize: "10px" }}
                          >
                            {labelText} Bad ({badRange[0].toFixed(2)} -{" "}
                            {badRange[1].toFixed(2)})
                          </text>
                        </>
                      )}
                    </>
                  );
                })()}

                {showStressEvents &&
                  stressEvents.map((event, index) => (
                    <React.Fragment key={index}>
                      <ReferenceLine
                        {...(isMobile
                          ? { y: event.from_date }
                          : { x: event.from_date })}
                        stroke="#dc2626"
                        strokeDasharray="5 5"
                        strokeWidth={1}
                        label={{
                          value: `Start: ${formatDate(event.from_date)}`,
                          position: "top",
                          fontSize: 8,
                          fill: "#dc2626",
                        }}
                      />
                      <ReferenceLine
                        {...(isMobile
                          ? { y: event.to_date }
                          : { x: event.to_date })}
                        stroke="#dc2626"
                        strokeDasharray="5 5"
                        strokeWidth={1}
                        label={{
                          value: `End: ${formatDate(event.to_date)}`,
                          position: "top",
                          fontSize: 8,
                          fill: "#dc2626",
                        }}
                      />
                      {isMobile ? (
                        <ReferenceArea
                          y1={event.from_date}
                          y2={event.to_date}
                          fill="#dc2626"
                          fillOpacity={0.1}
                        />
                      ) : (
                        <ReferenceArea
                          x1={event.from_date}
                          x2={event.to_date}
                          fill="#dc2626"
                          fillOpacity={0.1}
                        />
                      )}
                    </React.Fragment>
                  ))}

                {visibleLines.growth && (
                  <Line
                    type="monotone"
                    dataKey="growth"
                    stroke={lineStyles.growth.color}
                    strokeWidth={2}
                    dot={{ r: 3, fill: lineStyles.growth.color }}
                    activeDot={{ r: 4, fill: lineStyles.growth.color }}
                  />
                )}
                {visibleLines.stress && (
                  <Line
                    type="monotone"
                    dataKey="stress"
                    stroke={lineStyles.stress.color}
                    strokeWidth={2}
                    dot={{ r: 3, fill: lineStyles.stress.color }}
                    activeDot={{ r: 4, fill: lineStyles.stress.color }}
                  />
                )}
                {visibleLines.water && (
                  <Line
                    type="monotone"
                    dataKey="water"
                    stroke={lineStyles.water.color}
                    strokeWidth={2}
                    dot={{ r: 3, fill: lineStyles.water.color }}
                    activeDot={{ r: 4, fill: lineStyles.water.color }}
                  />
                )}
                {visibleLines.moisture && (
                  <Line
                    type="monotone"
                    dataKey="moisture"
                    stroke={lineStyles.moisture.color}
                    strokeWidth={2}
                    dot={{ r: 3, fill: lineStyles.moisture.color }}
                    activeDot={{ r: 4, fill: lineStyles.moisture.color }}
                  />
                )}

                {showNDREEvents && (
                  <Scatter
                    dataKey="stressLevel"
                    fill="#f97316"
                    shape={<CustomStressDot />}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Acidity & Sugar Analysis Chart */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-2 sm:p-4 mt-4" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
          <div className="flex items-center gap-2 mb-3">
            <Beaker className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-800">
              Acidity & Sugar Analysis
            </h3>
          </div>

          {/* Chart always renders with fallback data and overlay messages */}
          <BrixTimeSeriesChart
            data={brixTimeSeriesData}
            isLoading={brixTimeSeriesLoading}
            error={brixTimeSeriesError}
          />
        </div>

        {/* Secondary Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-4 sm:p-5 border border-emerald-200 hover:shadow-xl transition-all duration-300 flex flex-col" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', minHeight: '140px', height: '100%' }}>
            <div className="flex items-start justify-between mb-2">
              <img src="/Image/crop images/Organic Carbon.png" alt="Organic Carbon" className="w-16 h-16 sm:w-20 sm:h-20 object-contain" style={{ flexShrink: 0 }} />
              <div className="text-right">
                <div className="text-lg font-bold text-gray-800">
                  {metrics.organicCarbonDensity !== null && metrics.organicCarbonDensity !== undefined
                    ? metrics.organicCarbonDensity === 0
                      ? "0"
                      : metrics.organicCarbonDensity
                    : "-"}
                </div>
                <div className="text-xs font-semibold text-emerald-600">
                  g/cm{"\u00B3"}
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-auto">Organic Carbon Density</p>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-4 sm:p-5 border border-purple-200 hover:shadow-xl transition-all duration-300 flex flex-col" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', minHeight: '140px', height: '100%' }}>
            <div className="flex items-start justify-between mb-2">
              <img src="/Image/crop images/Biomass.png" alt="Biomass" className="w-20 h-20 sm:w-24 sm:h-24 object-contain" style={{ maxWidth: '100%', height: 'auto', flexShrink: 0 }} />
              <div className="text-right">
                <div className="text-lg font-bold text-gray-800">
                  {totalBiomass?.toFixed(1) || "-"}
                </div>
                <div className="text-xs font-semibold text-purple-600">
                  T/acre
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-auto">Total Biomass</p>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-4 sm:p-5 border border-yellow-200 hover:shadow-xl transition-all duration-300 flex flex-col" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', minHeight: '140px', height: '100%' }}>
            <div className="flex items-start justify-between mb-2">
              <img src="/Image/crop images/Organic Carbon.png" alt="Soil pH" className="w-16 h-16 sm:w-20 sm:h-20 object-contain" style={{ maxWidth: '100%', height: 'auto', flexShrink: 0 }} />
              <div className="text-right">
                <div className="text-lg font-bold text-gray-800">
                  {metrics.soilPH?.toFixed(2) || "-"}
                </div>
                <div className="text-xs font-semibold text-yellow-600">pH</div>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-auto">Soil pH Level</p>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-4 sm:p-5 border border-green-200 hover:shadow-xl transition-all duration-300 flex flex-col" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', minHeight: '140px', height: '100%' }}>
            <div className="flex items-start justify-between mb-2">
              <img src="/Image/crop images/yield.png" alt="Recovery Rate" className="w-16 h-16 sm:w-20 sm:h-20 object-contain" style={{ maxWidth: '100%', height: 'auto', flexShrink: 0 }} />
              <div className="text-right">
                <div className="text-lg font-bold text-gray-800">
                  {metrics.recovery?.toFixed(1) || "-"}
                </div>
                <div className="text-xs font-semibold text-green-600">%</div>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-auto">Recovery Rate</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
          {/* Expected Yield Comparison */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-5 sm:p-6 flex flex-col" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden', minHeight: '300px' }}>
            <div className="flex items-center gap-2 mb-4">
              <img src="/Image/crop images/yield.png" alt="Yield Projection" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                Grapes Yield Projection
              </h3>
            </div>
            <div className="flex flex-col items-center mt-auto">
              <div className="w-full max-w-full overflow-hidden">
                <PieChartWithNeedle
                  value={metrics.sugarYieldMean || 0}
                  max={metrics.sugarYieldMax || 400}
                  title="Grapes Yield Forecast"
                  unit=" T/acre"
                  width={Math.min(300, typeof window !== 'undefined' ? window.innerWidth * 0.8 : 300)}
                  height={150}
                />
              </div>
              <div className="mt-2 text-center">
                <div className="flex items-center justify-center gap-2 text-sm sm:text-base flex-wrap">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded bg-red-500"></div>
                    <span className="text-red-700 font-semibold">
                      min: {(metrics.sugarYieldMin || 0).toFixed(1)} T/acre
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded bg-purple-500"></div>
                    <span className="text-purple-700 font-semibold">
                      mean: {(metrics.sugarYieldMean || 0).toFixed(1)}{" "}
                      T/acre
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded bg-green-500"></div>
                    <span className="text-green-700 font-semibold">
                      max: {(metrics.sugarYieldMax || 0).toFixed(1)} T/acre
                    </span>
                  </div>
                </div>
                <div className="mt-1 text-sm sm:text-base text-gray-500">
                  Performance:{" "}
                  {metrics.sugarYieldMax
                    ? (((metrics.sugarYieldMean || 0) / metrics.sugarYieldMax) * 100).toFixed(1)
                    : "0.0"}
                  % of optimal yield
                </div>
              </div>
            </div>
          </div>

          {/* Biomass Performance */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-5 sm:p-6" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-6 h-6 sm:w-7 sm:h-7 text-green-600" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                Biomass Performance
              </h3>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="h-40 sm:h-48 md:h-52 flex flex-col items-center justify-center relative w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={biomassData}
                      cx="50%"
                      cy="80%"
                      startAngle={180}
                      endAngle={0}
                      outerRadius={110}
                      innerRadius={70}
                      dataKey="value"
                      labelLine={false}
                    >
                      {biomassData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      wrapperStyle={{ zIndex: 50 }}
                      contentStyle={{ fontSize: "12px" }}
                      formatter={(value: number, name: string) => [
                        `${value.toFixed(1)} T/acre`,
                        name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Total Biomass Value Display Below Chart */}
              <div className="-mt-4 mb-1">
                <p className="text-base sm:text-lg font-semibold text-blue-600 text-center">
                  {totalBiomass.toFixed(1)} T/acre
                </p>
              </div>
              <p className="text-sm sm:text-base text-gray-700 font-medium text-center mb-3">
                Biomass Distribution Chart
              </p>
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 text-sm sm:text-base flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-blue-500"></div>
                    <span className="text-blue-700 font-semibold">
                      Total: {totalBiomass.toFixed(1)} T/acre
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-green-500"></div>
                    <span className="text-green-700 font-semibold">
                      Underground: {currentBiomass.toFixed(1)} T/acre
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recovery Rate Comparison */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-5 sm:p-6 flex flex-col" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden', minHeight: '220px' }}>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                Recovery Rate Comparison
              </h3>
            </div>
            <div className="mt-auto">
              <div className="h-48 flex items-center justify-center -mt-8">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={recoveryComparisonData}
                    margin={{ top: 1, right: 5, left: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="2 2" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} height={10} />
                    <YAxis tick={{ fontSize: 10, fill: '#374151' }} domain={[0, 10]} width={35} />
                    <Tooltip
                      formatter={(value: number) => [
                        `${value.toFixed(1)}%`,
                        "Recovery Rate",
                      ]}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[3, 3, 0, 0]}>
                      {recoveryComparisonData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-center text-sm sm:text-base text-gray-600">
                <span className="font-semibold text-green-700">
                  Your Farm: {(metrics.recovery || 0).toFixed(1)}%
                </span>
                {" vs "}
                <span className="font-semibold text-blue-700">
                  Regional Avg:{" "}
                  {OTHER_FARMERS_RECOVERY.regional_average.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmerDashboard;

import React, { useState, useEffect, useRef } from "react";
import { useFarmerProfile } from "../hooks/useFarmerProfile";
import { useAppContext } from "../context/AppContext";
import { getGrapesAdminBaseUrl } from "../utils/serviceUrls";
import budData from "./bud.json";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface FertilizerEntry {
  date: string;
  stage: string;
  days: string;
  N_kg_acre: string;
  P_kg_acre: string;
  K_kg_acre: string;
  fertilizers?: {
    Urea_N_kg_per_acre: number;
    SuperPhosphate_P_kg_per_acre: number;
    Potash_K_kg_per_acre: number;
  };
  organic_inputs?: string[];
  /** Grapes admin JSON schedule (issue / nutrient / recommendation / organic / type) */
  issue?: string;
  recommendation?: string;
  organicDetail?: string;
  nutrient?: string;
  scheduleType?: string;
}

type GrapesScheduleMeta = {
  plot?: string;
  foundation_pruning_date?: string;
  fruit_pruning_date?: string;
  today?: Record<string, unknown>;
};

function isGrapesScheduleV2Rows(parsed: unknown, next: unknown[]): boolean {
  if (parsed && typeof parsed === "object" && "today" in (parsed as object)) {
    return true;
  }
  const first = next[0];
  if (first && typeof first === "object") {
    const o = first as Record<string, unknown>;
    if (typeof o.type === "string" && ("day" in o || "nutrient" in o)) {
      return true;
    }
  }
  return false;
}

function extractGrapesScheduleMeta(parsed: unknown): GrapesScheduleMeta | null {
  if (!parsed || typeof parsed !== "object") return null;
  const p = parsed as Record<string, unknown>;
  const str = (v: unknown) =>
    typeof v === "string" && v.length > 0 ? v : undefined;
  const today =
    p.today && typeof p.today === "object" && !Array.isArray(p.today)
      ? (p.today as Record<string, unknown>)
      : undefined;
  const hasMeta =
    str(p.plot) ||
    str(p.foundation_pruning_date) ||
    str(p.fruit_pruning_date) ||
    today;
  if (!hasMeta) return null;
  return {
    plot: str(p.plot),
    foundation_pruning_date: str(p.foundation_pruning_date),
    fruit_pruning_date: str(p.fruit_pruning_date),
    today,
  };
}

/** Pull the 7-day schedule list from admin API JSON (handles alternate key names). */
function extractScheduleDaysArray(raw: unknown): unknown[] | undefined {
  if (raw === null || raw === undefined) return undefined;
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const keys = [
    "next_7_days",
    "next7_days",
    "next7Days",
    "next_seven_days",
    "schedule",
  ] as const;
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(o, k)) {
      const v = o[k];
      if (v === null) return [];
      if (Array.isArray(v)) return v;
      return undefined;
    }
  }
  const nested = o.data;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    const d = nested as Record<string, unknown>;
    for (const k of keys) {
      if (Object.prototype.hasOwnProperty.call(d, k)) {
        const v = d[k];
        if (v === null) return [];
        if (Array.isArray(v)) return v;
        return undefined;
      }
    }
  }
  return undefined;
}

function scheduleCellText(v: string | undefined | null): string {
  const t = v?.trim();
  return t ? t : "—";
}

function mapGrapesScheduleNext7ToEntries(
  items: unknown[],
  useV2: boolean
): FertilizerEntry[] {
  if (!Array.isArray(items)) return [];
  if (useV2) {
    return items.map((raw) => {
      const item = raw as Record<string, unknown>;
      const str = (v: unknown) => (v == null ? "" : String(v));
      return {
        date: str(item.date),
        stage: str(item.stage),
        days: item.day != null ? String(item.day) : "",
        N_kg_acre: "",
        P_kg_acre: "",
        K_kg_acre: "",
        issue: str(item.issue),
        recommendation: str(item.recommendation),
        organicDetail: str(item.organic),
        nutrient: str(item.nutrient),
        scheduleType: str(item.type),
      };
    });
  }
  return items.map((raw) => {
    const item = raw as Record<string, unknown>;
    const fertilizersRaw = item.fertilizers ?? item.fertilizer;
    const organicRaw = item.organic_inputs ?? item.organicInputs ?? item.organic;
    let fertilizers: FertilizerEntry["fertilizers"];
    if (
      fertilizersRaw &&
      typeof fertilizersRaw === "object" &&
      !Array.isArray(fertilizersRaw)
    ) {
      const f = fertilizersRaw as Record<string, unknown>;
      fertilizers = {
        Urea_N_kg_per_acre: Number(f.Urea_N_kg_per_acre ?? f.urea_n_kg_per_acre ?? 0),
        SuperPhosphate_P_kg_per_acre: Number(
          f.SuperPhosphate_P_kg_per_acre ?? f.superphosphate_p_kg_per_acre ?? 0
        ),
        Potash_K_kg_per_acre: Number(
          f.Potash_K_kg_per_acre ?? f.potash_k_kg_per_acre ?? 0
        ),
      };
    }
    let organic_inputs: string[] | undefined;
    if (Array.isArray(organicRaw)) {
      organic_inputs = organicRaw.map((x) => String(x));
    } else if (organicRaw != null && organicRaw !== "") {
      organic_inputs = [String(organicRaw)];
    }
    const str = (v: unknown) => (v == null ? "" : String(v));
    return {
      date: str(item.date ?? item.day ?? item.schedule_date),
      stage: str(item.stage ?? item.crop_stage ?? item.stage_name),
      days: str(item.days ?? item.day_number ?? item.days_since_planting),
      N_kg_acre: str(item.N_kg_acre ?? item.n_kg_acre ?? item.N ?? item.n),
      P_kg_acre: str(item.P_kg_acre ?? item.p_kg_acre ?? item.P ?? item.p),
      K_kg_acre: str(item.K_kg_acre ?? item.k_kg_acre ?? item.K ?? item.k),
      fertilizers,
      organic_inputs,
    };
  });
}

// Plantation type to months mapping
const PLANTATION_TYPE_MONTHS: Record<string, number> = {
  Suru: 10,
  Adsali: 14,
  Preseasonal: 12,
  Ratoon: 9,
};

const FertilizerTable: React.FC = () => {
  const [data, setData] = useState<FertilizerEntry[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [plantationType, setPlantationType] = useState<string | null>(null);
  const [monthsCompleted, setMonthsCompleted] = useState<number | null>(null);
  const [noFertilizerRequired, setNoFertilizerRequired] =
    useState<boolean>(false);
  /** Admin API returned 200 with empty/null next_7_days — show success, not planting-method error. */
  const [apiScheduleCompleted, setApiScheduleCompleted] =
    useState<boolean>(false);
  const [scheduleFetchLoading, setScheduleFetchLoading] =
    useState<boolean>(false);
  const [grapesScheduleMeta, setGrapesScheduleMeta] =
    useState<GrapesScheduleMeta | null>(null);
  const [grapesScheduleV2, setGrapesScheduleV2] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const {
    profile,
    loading: profileLoading,
    error: profileError,
  } = useFarmerProfile();
  const { getCached, selectedPlotName, setCached } = useAppContext();

  // Helper function to calculate months since plantation
  const calculateMonthsSincePlantation = (plantationDate: string): number => {
    let plantation: Date;

    plantation = new Date(plantationDate);

    if (isNaN(plantation.getTime())) {
      const parts = plantationDate.split("-");
      if (parts.length === 3) {
        plantation = new Date(
          parseInt(parts[0]),
          parseInt(parts[1]) - 1,
          parseInt(parts[2])
        );
      } else {
        const parts2 = plantationDate.split("/");
        if (parts2.length === 3) {
          plantation = new Date(
            parseInt(parts2[2]),
            parseInt(parts2[1]) - 1,
            parseInt(parts2[0])
          );
        }
      }
    }

    if (isNaN(plantation.getTime())) {
      console.error("Invalid plantation date:", plantationDate);
      return 0;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    plantation.setHours(0, 0, 0, 0);

    const yearsDiff = today.getFullYear() - plantation.getFullYear();
    const monthsDiff = today.getMonth() - plantation.getMonth();
    const daysDiff = today.getDate() - plantation.getDate();

    let totalMonths = yearsDiff * 12 + monthsDiff;

    if (daysDiff < 0) {
      totalMonths = totalMonths - 1;
    }

    return Math.max(0, totalMonths);
  };

  // Helper function to calculate days since plantation
  const calculateDaysSincePlantation = (plantationDate: string): number => {
    // Try different date parsing methods
    let plantation: Date;

    // Method 1: Direct parsing
    plantation = new Date(plantationDate);

    // Method 2: Handle different date formats
    if (isNaN(plantation.getTime())) {
      // Try parsing as YYYY-MM-DD format
      const parts = plantationDate.split("-");
      if (parts.length === 3) {
        plantation = new Date(
          parseInt(parts[0]),
          parseInt(parts[1]) - 1,
          parseInt(parts[2])
        );
      } else {
        // Try parsing as DD/MM/YYYY format
        const parts2 = plantationDate.split("/");
        if (parts2.length === 3) {
          plantation = new Date(
            parseInt(parts2[2]),
            parseInt(parts2[1]) - 1,
            parseInt(parts2[0])
          );
        }
      }
    }

    const today = new Date();
    const diffTime = today.getTime() - plantation.getTime();
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return days;
  };

  // Helper function to get current stage based on days
  const getCurrentStage = (days: number, stages: any[]): any => {
    for (const stage of stages) {
      // Handle both en-dash (–) and regular hyphen (-) in the days range
      const daysRange = stage.days.replace(/[–-]/g, "-"); // Normalize to regular hyphen
      const [minDays, maxDays] = daysRange
        .split("-")
        .map((d: string) => parseInt(d.trim()));

      if (days >= minDays && days <= maxDays) {
        return stage;
      }
    }

    // Return the last stage if no match found
    return stages[stages.length - 1];
  };

  // Helper function to generate 7 days of data
  const generateSevenDaysData = (
    plantationDate: string,
    plantingMethod: string
  ): FertilizerEntry[] => {
    // Normalize the planting method to match bud.json format
    // Handle various formats: "2-bud", "2_bud", "2 bud", "2bud", "3-bud", etc.
    const normalizedMethod = plantingMethod
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/_/g, "-") // Replace underscores with hyphens
      .replace(/[^a-z0-9-]/g, "") // Remove special characters
      .replace(/-+/g, "-") // Replace multiple hyphens with single
      .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens

    console.log("FertilizerTable: Normalizing planting method", {
      original: plantingMethod,
      normalized: normalizedMethod,
      availableMethods: budData.fertilizer_schedule.map((s) => s.method),
    });

    // Find the fertilizer schedule for this planting method
    const fertilizerSchedule = budData.fertilizer_schedule.find((schedule) => {
      const scheduleMethod = schedule.method
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/_/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      return scheduleMethod === normalizedMethod;
    });

    if (!fertilizerSchedule) {
      console.error("FertilizerTable: No matching schedule found", {
        normalizedMethod,
        originalMethod: plantingMethod,
        availableMethods: budData.fertilizer_schedule.map((s) => s.method),
      });

      // Throw error instead of using fallback schedule
      throw new Error(
        `No fertilizer schedule found for planting method "${plantingMethod}" (normalized: "${normalizedMethod}"). Available methods: ${budData.fertilizer_schedule
          .map((s) => s.method)
          .join(", ")}`
      );
    }

    console.log(
      "FertilizerTable: Found matching schedule",
      fertilizerSchedule.method
    );
    return generateSevenDaysDataWithSchedule(
      plantationDate,
      fertilizerSchedule
    );
  };

  // Helper function to generate data with a specific schedule
  const generateSevenDaysDataWithSchedule = (
    plantationDate: string,
    fertilizerSchedule: any
  ): FertilizerEntry[] => {
    const daysSincePlantation = calculateDaysSincePlantation(plantationDate);

    const sevenDaysData: FertilizerEntry[] = [];
    const currentDate = new Date();

    for (let i = 0; i < 7; i++) {
      const targetDate = new Date(currentDate);
      targetDate.setDate(currentDate.getDate() + i);

      // Calculate days from plantation for this specific day
      const targetDays = daysSincePlantation + i;

      const currentStage = getCurrentStage(
        targetDays,
        fertilizerSchedule.stages
      );

      sevenDaysData.push({
        date: targetDate.toLocaleDateString("en-GB"),
        stage: currentStage.stage,
        days: `${targetDays}`,
        N_kg_acre: currentStage.N_kg_acre,
        P_kg_acre: currentStage.P_kg_acre,
        K_kg_acre: currentStage.K_kg_acre,
        fertilizers: currentStage.fertilizers,
        organic_inputs: currentStage.organic_inputs,
      });
    }

    return sevenDaysData;
  };

  const applyScheduleResponse = (parsed: unknown): boolean => {
    const next = extractScheduleDaysArray(parsed);
    if (next === undefined) {
      return false;
    }

    if (next.length === 0) {
      setApiScheduleCompleted(true);
      setData([]);
      setGrapesScheduleMeta(null);
      setGrapesScheduleV2(false);
      setLocalError(null);
      setNoFertilizerRequired(false);
      setPlantationType(null);
      setMonthsCompleted(null);
      return true;
    }

    const v2 = isGrapesScheduleV2Rows(parsed, next);
    setGrapesScheduleV2(v2);
    setGrapesScheduleMeta(v2 ? extractGrapesScheduleMeta(parsed) : null);
    setApiScheduleCompleted(false);
    setData(mapGrapesScheduleNext7ToEntries(next, v2));
    setLocalError(null);
    setNoFertilizerRequired(false);
    return true;
  };

  useEffect(() => {
    // Wait for profile to load
    if (profileLoading) {
      return;
    }

    // Determine which plot to use: selectedPlotName > first plot from profile
    let plotToUse = selectedPlotName;
    
    // Fallback to first plot if no selection
    if (!plotToUse && profile?.plots && profile.plots.length > 0) {
      const firstPlot = profile.plots[0];
      plotToUse = firstPlot.fastapi_plot_id || 
                  `${firstPlot.gat_number}_${firstPlot.plot_number}`;
      console.log('FertilizerTable: No plot selected, using first plot:', plotToUse);
    }

    // Wait for plot selection (either from context or fallback)
    if (!plotToUse) {
      setData([]);
      setLocalError(null);
      setPlantationType(null);
      setMonthsCompleted(null);
      setNoFertilizerRequired(false);
      setApiScheduleCompleted(false);
      setScheduleFetchLoading(false);
      setGrapesScheduleMeta(null);
      setGrapesScheduleV2(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setScheduleFetchLoading(true);
      setApiScheduleCompleted(false);
      setLocalError(null);
      setNoFertilizerRequired(false);

      try {
        const scheduleCacheKey = `grapesSchedule_${String(plotToUse)}`;
        const cachedSchedule = getCached(scheduleCacheKey);
        if (cachedSchedule !== undefined && applyScheduleResponse(cachedSchedule)) {
          if (!cancelled) {
            setScheduleFetchLoading(false);
          }
          return;
        }

        const base = getGrapesAdminBaseUrl();
        const url = `${base.replace(/\/+$/, "")}/grapes-schedule/${encodeURIComponent(String(plotToUse))}`;
        const controller = new AbortController();
        const scheduleTimeoutMs = 120000;
        const timeoutId = window.setTimeout(
          () => controller.abort(),
          scheduleTimeoutMs
        );
        let res: Response;
        try {
          res = await fetch(url, {
            method: "GET",
            headers: { Accept: "application/json" },
            signal: controller.signal,
          });
        } finally {
          window.clearTimeout(timeoutId);
        }
        if (cancelled) {
          setScheduleFetchLoading(false);
          return;
        }

        if (res.ok) {
          let parsed: unknown;
          try {
            parsed = await res.json();
            setCached(scheduleCacheKey, parsed);
          } catch {
            console.warn(
              "FertilizerTable: grapes-schedule returned non-JSON body, using legacy bud.json"
            );
            parsed = undefined;
          }
          if (applyScheduleResponse(parsed)) {
            if (!cancelled) {
              setScheduleFetchLoading(false);
            }
            return;
          }
          console.warn(
            "FertilizerTable: grapes-schedule 200 but no schedule array in response; keys:",
            parsed && typeof parsed === "object"
              ? Object.keys(parsed as object)
              : typeof parsed
          );
        } else {
          console.warn(
            "FertilizerTable: grapes-schedule HTTP",
            res.status,
            res.statusText,
            "— trying legacy bud.json"
          );
        }
      } catch (e) {
        console.warn(
          "FertilizerTable: grapes-schedule request failed, using legacy bud.json",
          e
        );
      }

      if (cancelled) {
        setScheduleFetchLoading(false);
        return;
      }

      try {
        setLocalError(null);

      // Check if profile exists and has plots
      if (!profile || !profile.plots || profile.plots.length === 0) {
        throw new Error("No plots found in farmer profile");
      }

      // Get the selected plot by fastapi_plot_id (primary matching method)
      // API response structure: plots[].fastapi_plot_id (e.g., "258_25")
      let selectedPlot = profile.plots.find(
        (p) => p.fastapi_plot_id === plotToUse
      );

      // If not found by fastapi_plot_id, try matching by constructed plot ID
      if (!selectedPlot) {
        selectedPlot = profile.plots.find((p) => {
          const plotId =
            p.fastapi_plot_id || `${p.gat_number}_${p.plot_number}`;
          return plotId === plotToUse;
        });
      }

      // If still not found, try matching by gat_number and plot_number
      if (!selectedPlot) {
        const [gatNum, plotNum] = plotToUse.split("_");
        selectedPlot = profile.plots.find(
          (p) => p.gat_number === gatNum && p.plot_number === plotNum
        );
      }

      if (!selectedPlot) {
        console.error("FertilizerTable: Selected plot not found", {
          plotToUse,
          availablePlots: profile.plots.map((p) => ({
            fastapi_plot_id: p.fastapi_plot_id,
            gat_number: p.gat_number,
            plot_number: p.plot_number,
          })),
        });
        throw new Error(
          `Selected plot "${plotToUse}" not found in farmer profile`
        );
      }

      console.log("FertilizerTable: Found plot by fastapi_plot_id", {
        plotToUse,
        foundPlot: {
          fastapi_plot_id: selectedPlot.fastapi_plot_id,
          gat_number: selectedPlot.gat_number,
          plot_number: selectedPlot.plot_number,
          farms_count: selectedPlot.farms?.length || 0,
        },
      });

      // Check if plot has farms
      if (
        !selectedPlot.farms ||
        !Array.isArray(selectedPlot.farms) ||
        selectedPlot.farms.length === 0
      ) {
        throw new Error("No farms found for the current plot");
      }

      const getFarmPlantingMethod = (farm: any): string | undefined => {
        return (
          farm?.crop_type?.planting_method ||
          farm?.crop_type?.planting_method_display ||
          farm?.planting_method ||
          farm?.planting_method_display
        );
      };

      // Prefer a farm that has both plantation date and planting method.
      // Some plots can have multiple farms and the first one may be incomplete.
      const firstFarm = selectedPlot.farms?.[0];
      const farmForSchedule =
        selectedPlot.farms.find(
          (farm: any) => farm?.plantation_date && getFarmPlantingMethod(farm)
        ) ||
        selectedPlot.farms.find((farm: any) => farm?.plantation_date) ||
        firstFarm;

      if (!farmForSchedule) {
        throw new Error("No farm data found for the selected plot");
      }

      // Extract data from API response structure:
      // API path: plots[].farms[].plantation_date (e.g., "2025-12-01")
      // API path: plots[].farms[].crop_type.plantation_type (e.g., "ratoon")
      // API path: plots[].farms[].crop_type.planting_method (e.g., "2_bud")

      // Extract plantation_date - primary location from API response
      // No fallback - must have actual plantation_date from API
      const plantationDate = farmForSchedule.plantation_date; // Primary: farms[].plantation_date

      // Extract plantation_type from crop_type - primary location from API response
      const plantationTypeValue =
        farmForSchedule.crop_type?.plantation_type || // Primary: farms[].crop_type.plantation_type (e.g., "ratoon")
        farmForSchedule.crop_type?.plantation_type_display; // Alternative: farms[].crop_type.plantation_type_display (e.g., "Ratoon")

      console.log("FertilizerTable: Extracted farm data from API response", {
        fastapi_plot_id: selectedPlot.fastapi_plot_id,
        selected_farm_id: farmForSchedule.id,
        selected_farm_uid: farmForSchedule.farm_uid,
        plantation_date: farmForSchedule.plantation_date,
        plantationDate: plantationDate,
        plantation_type: farmForSchedule.crop_type?.plantation_type,
        plantation_type_display: farmForSchedule.crop_type?.plantation_type_display,
        plantationTypeValue: plantationTypeValue,
        planting_method: farmForSchedule.crop_type?.planting_method,
        planting_method_display: farmForSchedule.crop_type?.planting_method_display,
        crop_type_object: farmForSchedule.crop_type,
        fullFarmData: farmForSchedule,
      });

      setPlantationType(plantationTypeValue || null);

      if (!plantationDate) {
        console.error("FertilizerTable: Plantation date not found", {
          farmData: farmForSchedule,
          availableFields: Object.keys(farmForSchedule),
        });
        throw new Error(
          "Plantation date not found in farm data. Please ensure plantation date is set for this farm."
        );
      }

      // Calculate months since plantation
      const monthsSincePlantation =
        calculateMonthsSincePlantation(plantationDate);
      setMonthsCompleted(monthsSincePlantation);

      console.log("FertilizerTable: Checking plantation type and months", {
        plantationTypeValue: plantationTypeValue,
        monthsSincePlantation: monthsSincePlantation,
        plantationDate: plantationDate,
      });

      // Check plantation type and months BEFORE requiring planting method
      // This allows us to show "No fertilizer required" even if planting method is missing
      if (plantationTypeValue) {
        // Normalize plantation type for matching (case-insensitive, remove hyphens/spaces)
        const normalizedPlantationType = plantationTypeValue
          .trim()
          .toLowerCase()
          .replace(/-/g, "") // Remove hyphens (pre-seasonal -> preseasonal)
          .replace(/\s+/g, ""); // Remove spaces

        console.log("FertilizerTable: Normalized plantation type", {
          original: plantationTypeValue,
          normalized: normalizedPlantationType,
          availableKeys: Object.keys(PLANTATION_TYPE_MONTHS),
        });

        // Try to find matching plantation type (case-insensitive, ignore hyphens/spaces)
        const matchingKey = Object.keys(PLANTATION_TYPE_MONTHS).find(
          (key) =>
            key.toLowerCase().replace(/-/g, "").replace(/\s+/g, "") ===
            normalizedPlantationType
        );

        const requiredMonths = matchingKey
          ? PLANTATION_TYPE_MONTHS[matchingKey]
          : null;

        console.log("FertilizerTable: Matching result", {
          matchingKey: matchingKey,
          requiredMonths: requiredMonths,
          monthsSincePlantation: monthsSincePlantation,
          shouldHide:
            requiredMonths !== null && monthsSincePlantation >= requiredMonths,
        });

        if (
          requiredMonths !== null &&
          monthsSincePlantation >= requiredMonths
        ) {
          setNoFertilizerRequired(true);
          setGrapesScheduleMeta(null);
          setGrapesScheduleV2(false);
          setData([]);
          setLocalError(null); // Clear any previous errors
          console.log(
            "✅ FertilizerTable: No fertilizer required - HIDING TABLE",
            {
              plantationType: plantationTypeValue,
              matchingKey: matchingKey,
              monthsCompleted: monthsSincePlantation,
              requiredMonths: requiredMonths,
              plantationDate: plantationDate,
            }
          );
          return; // Exit early - don't check planting method or generate fertilizer data
        } else {
          setNoFertilizerRequired(false);
          console.log("❌ FertilizerTable: Fertilizer still required", {
            monthsSincePlantation: monthsSincePlantation,
            requiredMonths: requiredMonths,
            matchingKey: matchingKey,
          });
        }
      } else {
        setNoFertilizerRequired(false);
        console.log("⚠️ FertilizerTable: No plantation type found");
      }

      // Extract planting_method from crop_type (only needed if fertilizer is still required)
      // API path: plots[].farms[].crop_type.planting_method (e.g., "2_bud")
      const plantingMethod = getFarmPlantingMethod(farmForSchedule);

      if (!plantingMethod) {
        console.error(
          "FertilizerTable: Planting method not found in API response",
          {
            fastapi_plot_id: selectedPlot.fastapi_plot_id,
            farm_id: farmForSchedule.id,
            farm_uid: farmForSchedule.farm_uid,
            crop_type: farmForSchedule.crop_type,
            availableFields: Object.keys(farmForSchedule),
            farms_inspected: selectedPlot.farms.map((farm: any) => ({
              farm_id: farm?.id,
              farm_uid: farm?.farm_uid,
              has_plantation_date: Boolean(farm?.plantation_date),
              has_planting_method: Boolean(getFarmPlantingMethod(farm)),
            })),
          }
        );
        throw new Error(
          `Planting method not found in farm data for plot "${plotToUse}". Please ensure planting method is set for this farm in the backend.`
        );
      }

      console.log("FertilizerTable: Extracted planting method", {
        planting_method: farmForSchedule.crop_type?.planting_method,
        planting_method_display: farmForSchedule.crop_type?.planting_method_display,
        extractedMethod: plantingMethod,
      });

      console.log("FertilizerTable: Generating fertilizer schedule", {
        fastapi_plot_id: selectedPlot.fastapi_plot_id,
        plotToUse,
        plantationDate,
        plantingMethod,
        plantationType: plantationTypeValue,
        monthsCompleted: monthsSincePlantation,
        farmData: {
          farm_id: farmForSchedule.id,
          farm_uid: farmForSchedule.farm_uid,
          plantation_date: farmForSchedule.plantation_date,
          crop_type: farmForSchedule.crop_type,
        },
      });

      // Generate fertilizer data using plantation_date and planting_method with bud.json
      try {
        const fertilizerData = generateSevenDaysData(
          plantationDate,
          plantingMethod
        );
        setGrapesScheduleMeta(null);
        setGrapesScheduleV2(false);
        setData(fertilizerData);
        console.log(
          "FertilizerTable: Generated fertilizer data",
          fertilizerData.length,
          "entries"
        );
      } catch (genError: any) {
        console.error(
          "FertilizerTable: Error generating fertilizer data",
          genError
        );
        throw new Error(
          `Failed to generate fertilizer schedule: ${
            genError.message || "Unknown error"
          }. Please check if planting method "${plantingMethod}" is supported.`
        );
      }
      } catch (error: any) {
        console.error(
          "FertilizerTable: Error loading fertilizer data:",
          error?.message || error
        );

        setLocalError(
          `Failed to fetch data: ${error?.message || "Unknown error occurred"}`
        );
        setData([]);
        setGrapesScheduleMeta(null);
        setGrapesScheduleV2(false);
        setPlantationType(null);
        setMonthsCompleted(null);
        setNoFertilizerRequired(false);
      } finally {
        if (!cancelled) setScheduleFetchLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [profile, profileLoading, profileError, selectedPlotName]);

  const handleDownloadPDF = async () => {
    if (tableRef.current) {
      const canvas = await html2canvas(tableRef.current);
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("l", "mm", "a4"); // landscape
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 10, width, height);
      pdf.save("fertilizer_table.pdf");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Fertilizer Schedule
        </h2>
        <button
          onClick={handleDownloadPDF}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </button>
      </div>

      {/* {farmData && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Farm Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">Farm ID:</span>
              <span className="ml-2 text-gray-800">{farmData.farm_uid}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Plantation Date:</span>
              <span className="ml-2 text-gray-800">{new Date(farmData.created_at).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Planting Method:</span>
              <span className="ml-2 text-gray-800">{farmData.planting_method}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Plantation Type:</span>
              <span className="ml-2 text-gray-800">{farmData.plantation_type}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Crop Type:</span>
              <span className="ml-2 text-gray-800">{farmData.crop_type_name}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Area Size:</span>
              <span className="ml-2 text-gray-800">{farmData.area_size} acres</span>
            </div>
          </div>
        </div>
      )} */}

      {/* No Fertilizer Required Message */}
      {(() => {
        // Re-check the conditions in render to ensure message shows
        if (!plantationType || monthsCompleted === null) {
          return null;
        }

        const normalizedPlantationType = plantationType
          .trim()
          .toLowerCase()
          .replace(/-/g, "")
          .replace(/\s+/g, "");

        const matchingKey = Object.keys(PLANTATION_TYPE_MONTHS).find(
          (key) =>
            key.toLowerCase().replace(/-/g, "").replace(/\s+/g, "") ===
            normalizedPlantationType
        );
        const requiredMonths = matchingKey
          ? PLANTATION_TYPE_MONTHS[matchingKey]
          : null;

        // Check if months completed >= required months (direct check in render)
        const shouldShowMessage =
          noFertilizerRequired ||
          (requiredMonths !== null && monthsCompleted >= requiredMonths);

        if (shouldShowMessage) {
          return (
            <div className="mb-4 p-6 bg-green-50 border border-green-200 rounded-lg text-center">
              <svg
                className="w-12 h-12 text-green-600 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-lg font-bold text-green-800 mb-2">
                Fertilizer schedule completed
              </p>
              <p className="text-lg font-bold text-green-800 mb-2">
                No Fertilizer required
              </p>
              <p className="text-sm text-green-700">
                {/* The <strong>{plantationType}</strong> plantation has completed <strong>{monthsCompleted}</strong> months  */}
                {/* {requiredMonths !== null && ` (required: ${requiredMonths} months)`}.  */}
                {/* No fertilizer application is needed at this time. */}
              </p>
            </div>
          );
        }

        return null;
      })()}

      {apiScheduleCompleted && (
        <div className="mb-4 p-6 bg-green-50 border border-green-200 rounded-lg text-center">
          <svg
            className="w-12 h-12 text-green-600 mx-auto mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-lg font-bold text-green-800 mb-2">
            Fertilizer Schedule Completed
          </p>
          <p className="text-sm text-green-700">
            No upcoming fertilizer applications in the next 7 days for this plot.
          </p>
        </div>
      )}

      {(localError || profileError) && !noFertilizerRequired && !apiScheduleCompleted && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-yellow-600 mt-0.5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-yellow-800">
                {localError || profileError}
              </p>
            </div>
          </div>
        </div>
      )}

      {profileLoading || scheduleFetchLoading ? (
        <div className="flex items-center justify-center py-8">
          {/* <Satellite className="w-8 h-8 animate-spin text-blue-500" /> */}
          <span className="ml-2 text-gray-600">Loading fertilizer data...</span>
        </div>
      ) : (
        (() => {
          // Re-check if fertilizer should be hidden (safety check in render)
          if (plantationType && monthsCompleted !== null) {
            const normalizedPlantationType = plantationType
              .trim()
              .toLowerCase()
              .replace(/-/g, "")
              .replace(/\s+/g, "");

            const matchingKey = Object.keys(PLANTATION_TYPE_MONTHS).find(
              (key) =>
                key.toLowerCase().replace(/-/g, "").replace(/\s+/g, "") ===
                normalizedPlantationType
            );
            const requiredMonths = matchingKey
              ? PLANTATION_TYPE_MONTHS[matchingKey]
              : null;

            if (requiredMonths !== null && monthsCompleted >= requiredMonths) {
              // No fertilizer required - message already shown above, table is completely hidden
              return null;
            }
          }

          // Show error or table only if fertilizer is still required
          if (noFertilizerRequired) {
            return null;
          }

          if (apiScheduleCompleted) {
            return null;
          }

          // Show loading state if profile is still loading
          if (profileLoading || scheduleFetchLoading) {
            return (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-sm text-gray-600">
                    Loading fertilizer data...
                  </p>
                </div>
              </div>
            );
          }

          // Show error or empty state (not when API says schedule is complete)
          if (
            (localError || profileError || data.length === 0) &&
            !apiScheduleCompleted
          ) {
            // Provide more helpful error messages
            let errorMessage =
              localError ||
              profileError ||
              "No fertilizer data available.";

            // Generic empty state: schedule API + legacy path left no rows (see console: FertilizerTable)
            if (!localError && !profileError) {
              errorMessage +=
                " Check Network for grapes-schedule, and that the farm has plantation_date and a planting method supported by the schedule (or bud.json fallback).";
            }

            // Add helpful suggestions based on the error
            if (errorMessage.includes("Planting method")) {
              errorMessage +=
                ". Please check if the planting method is set correctly in farm data.";
            } else if (errorMessage.includes("Plantation date")) {
              errorMessage +=
                ". Please ensure the plantation date is set for this farm.";
            } else if (errorMessage.includes("not found")) {
              errorMessage += ". Please select a valid plot from the dropdown.";
            } else if (!selectedPlotName && (!profile?.plots || profile.plots.length === 0)) {
              errorMessage =
                "Please select a plot to view fertilizer schedule.";
            }

            return (
              <div className="flex items-center justify-center py-12">
                <div className="text-center max-w-md">
                  <svg
                    className="w-16 h-16 text-yellow-500 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <p className="text-lg font-semibold text-gray-800 mb-2">
                    Unable to Load Fertilizer Schedule
                  </p>
                  <p className="text-sm text-gray-600 mb-4">{errorMessage}</p>
                  {!selectedPlotName && (!profile?.plots || profile.plots.length === 0) && (
                    <p className="text-xs text-gray-500 mt-2">
                      Tip: Make sure you have selected a plot from the dropdown
                      above.
                    </p>
                  )}
                </div>
              </div>
            );
          }

          return grapesScheduleV2 ? (
            <div ref={tableRef} className="overflow-x-auto space-y-4">
              {grapesScheduleMeta && (
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs sm:text-sm text-gray-700 border-b border-gray-200 pb-3">
                  {grapesScheduleMeta.plot && (
                    <span>
                      <span className="font-semibold text-gray-800">Plot: </span>
                      {grapesScheduleMeta.plot}
                    </span>
                  )}
                  {grapesScheduleMeta.foundation_pruning_date && (
                    <span>
                      <span className="font-semibold text-gray-800">
                        Foundation pruning:{" "}
                      </span>
                      {grapesScheduleMeta.foundation_pruning_date}
                    </span>
                  )}
                  {grapesScheduleMeta.fruit_pruning_date && (
                    <span>
                      <span className="font-semibold text-gray-800">
                        Fruit pruning:{" "}
                      </span>
                      {grapesScheduleMeta.fruit_pruning_date}
                    </span>
                  )}
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Next days schedule
                </h3>
                {/* Mobile: readable cards */}
                <div className="grid grid-cols-1 gap-3 sm:hidden">
                  {data.map((row, idx) => (
                    <div
                      key={`${row.date}-${idx}`}
                      className="rounded-lg border border-gray-200 bg-white p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {scheduleCellText(row.date)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Day: {scheduleCellText(row.days)} • {scheduleCellText(row.stage)}
                          </div>
                        </div>
                        <div className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-800 capitalize whitespace-nowrap">
                          {scheduleCellText(row.scheduleType)}
                        </div>
                      </div>

                      <div className="mt-3 space-y-2 text-xs">
                        <div>
                          <div className="text-gray-500 mb-0.5">Issue</div>
                          <div className="text-gray-900 whitespace-pre-wrap break-words">
                            {scheduleCellText(row.issue)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 mb-0.5">Nutrient</div>
                          <div className="text-gray-900 whitespace-pre-wrap break-words">
                            {scheduleCellText(row.nutrient)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 mb-0.5">Recommendation</div>
                          <div className="text-gray-900 whitespace-pre-wrap break-words">
                            {scheduleCellText(row.recommendation)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 mb-0.5">Organic</div>
                          <div className="text-gray-900 whitespace-pre-wrap break-words">
                            {scheduleCellText(row.organicDetail)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop/tablet: wide table with proper widths + wrapping (scroll horizontally if needed) */}
                <div className="hidden sm:block rounded-lg border border-gray-200 overflow-x-auto">
                  <table className="w-full min-w-[1100px] table-fixed text-left text-xs sm:text-sm">
                    <thead className="bg-green-100 text-gray-800 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 font-semibold border-b border-gray-200 w-[110px]">
                          Date
                        </th>
                        <th className="px-3 py-2 font-semibold border-b border-gray-200 w-[70px]">
                          Day
                        </th>
                        <th className="px-3 py-2 font-semibold border-b border-gray-200 w-[140px]">
                          Stage
                        </th>
                        <th className="px-3 py-2 font-semibold border-b border-gray-200 w-[110px]">
                          Type
                        </th>
                        <th className="px-3 py-2 font-semibold border-b border-gray-200 w-[170px]">
                          Issue
                        </th>
                        <th className="px-3 py-2 font-semibold border-b border-gray-200 w-[140px]">
                          Nutrient
                        </th>
                        <th className="px-3 py-2 font-semibold border-b border-gray-200 w-[260px]">
                          Recommendation
                        </th>
                        <th className="px-3 py-2 font-semibold border-b border-gray-200 w-[260px]">
                          Organic
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((row, idx) => (
                        <tr
                          key={`${row.date}-${idx}`}
                          className="bg-white odd:bg-gray-50/80 border-t border-gray-100"
                        >
                          <td className="px-3 py-2 align-top whitespace-nowrap text-gray-900">
                            {scheduleCellText(row.date)}
                          </td>
                          <td className="px-3 py-2 align-top text-gray-900">
                            {scheduleCellText(row.days)}
                          </td>
                          <td className="px-3 py-2 align-top text-gray-900">
                            {scheduleCellText(row.stage)}
                          </td>
                          <td className="px-3 py-2 align-top text-gray-900 capitalize">
                            {scheduleCellText(row.scheduleType)}
                          </td>
                          <td className="px-3 py-2 align-top text-gray-900 whitespace-pre-wrap break-words">
                            {scheduleCellText(row.issue)}
                          </td>
                          <td className="px-3 py-2 align-top text-gray-900 whitespace-pre-wrap break-words">
                            {scheduleCellText(row.nutrient)}
                          </td>
                          <td className="px-3 py-2 align-top text-gray-900 whitespace-pre-wrap break-words">
                            {scheduleCellText(row.recommendation)}
                          </td>
                          <td className="px-3 py-2 align-top text-gray-900 whitespace-pre-wrap break-words">
                            {scheduleCellText(row.organicDetail)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div ref={tableRef} className="overflow-x-auto">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Next 7 Days Fertilizer Schedule
                </h3>
                {/* <p className="text-sm text-gray-600">Showing first and last day (same values for all 7 days)</p> */}
              </div>
              <div className="rounded-lg border border-gray-200 overflow-x-auto">
                <table className="w-full min-w-[980px] table-fixed text-left text-xs sm:text-sm">
                  <thead className="bg-green-200">
                    <tr>
                      <th className="px-3 py-2 font-semibold text-gray-900 border-b w-[110px]">
                        Date
                      </th>
                      <th className="px-3 py-2 font-semibold text-gray-900 border-b w-[160px]">
                        Stage
                      </th>
                      <th className="px-3 py-2 font-semibold text-gray-900 border-b w-[170px]">
                        Nutrients (kg/acre)
                      </th>
                      <th className="px-3 py-2 font-semibold text-gray-900 border-b w-[260px]">
                        Chemical Inputs
                      </th>
                      <th className="px-3 py-2 font-semibold text-gray-900 border-b w-[260px]">
                        Organic Inputs
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {data.map((row, idx) => (
                      <tr
                        key={`${row.date}-${idx}`}
                        className="odd:bg-white even:bg-gray-50/70 border-t border-gray-100"
                      >
                        <td className="px-3 py-2 align-top whitespace-nowrap text-gray-900">
                          {scheduleCellText(row.date)}
                        </td>
                        <td className="px-3 py-2 align-top text-gray-900">
                          {scheduleCellText(row.stage)}
                        </td>
                        <td className="px-3 py-2 align-top text-gray-900 whitespace-pre-wrap break-words">
                          <div>N: {scheduleCellText(row.N_kg_acre)}</div>
                          <div>P: {scheduleCellText(row.P_kg_acre)}</div>
                          <div>K: {scheduleCellText(row.K_kg_acre)}</div>
                        </td>
                        <td className="px-3 py-2 align-top text-gray-900 whitespace-pre-wrap break-words">
                          {row.fertilizers ? (
                            <>
                              <div>Urea: {row.fertilizers.Urea_N_kg_per_acre} kg</div>
                              <div>
                                SuperPhosphate: {row.fertilizers.SuperPhosphate_P_kg_per_acre} kg
                              </div>
                              <div>Potash: {row.fertilizers.Potash_K_kg_per_acre} kg</div>
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-3 py-2 align-top text-gray-900 whitespace-pre-wrap break-words">
                          {row.organic_inputs && row.organic_inputs.length > 0
                            ? row.organic_inputs.join("\n")
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
};

export default FertilizerTable;

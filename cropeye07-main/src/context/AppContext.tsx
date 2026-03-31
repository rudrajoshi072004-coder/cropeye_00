import React, { createContext, useContext, useState } from "react";
import { getCache, setCache, clearAllAppCache } from "../components/utils/cache";

// Define a generic cache type
interface GlobalCache {
  [key: string]: any;
}

// Example of extensible global state (add more as needed)
interface AppState {
  weatherData?: any;
  soilAnalysis?: any;
  fieldScore?: any;
  selectedPlotName?: string | null;
  [key: string]: any;
}

interface AppContextType {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  globalCache: GlobalCache;
  setGlobalCache: React.Dispatch<React.SetStateAction<GlobalCache>>;
  getCached: (key: string, maxAgeMs?: number) => any;
  setCached: (key: string, data: any) => void;
  selectedPlotName: string | null;
  setSelectedPlotName: (plotName: string | null) => void;
  /** Clear all app state and cache (call on logout so next user sees no previous data) */
  clearAppStateOnLogout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [appState, setAppState] = useState<AppState>(() => {
    // Initialize from localStorage if available
    const savedPlot = localStorage.getItem('selectedPlot');
    return {
      selectedPlotName: savedPlot || null,
    };
  });
  const [globalCache, setGlobalCache] = useState<GlobalCache>({});

  // Helper to get from cache (context first, then localStorage)
  const getCached = (key: string, maxAgeMs?: number) => {
    if (globalCache[key]) return globalCache[key];
    return getCache(key, maxAgeMs);
  };

  // Helper to set cache (context and localStorage)
  const setCached = (key: string, data: any) => {
    setGlobalCache((prev) => ({ ...prev, [key]: data }));
    setCache(key, data);
  };

  // Global plot selection handler
  const setSelectedPlotName = (plotName: string | null) => {
    setAppState((prev) => ({ ...prev, selectedPlotName: plotName }));
    if (plotName) {
      localStorage.setItem('selectedPlot', plotName);
    } else {
      localStorage.removeItem('selectedPlot');
    }
  };

  // Clear all in-memory state and cache (used on logout so Soil Analysis, Fertilizer, etc. don't show previous user's data)
  const clearAppStateOnLogout = () => {
    setAppState({ selectedPlotName: null });
    setGlobalCache({});
    clearAllAppCache();
  };

  return (
    <AppContext.Provider
      value={{
        appState,
        setAppState,
        globalCache,
        setGlobalCache,
        getCached,
        setCached,
        selectedPlotName: appState.selectedPlotName || null,
        setSelectedPlotName,
        clearAppStateOnLogout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context)
    throw new Error("useAppContext must be used within an AppProvider");
  return context;
};

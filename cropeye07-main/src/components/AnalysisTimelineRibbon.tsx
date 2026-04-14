import React, { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  fetchAnalysisTimeline,
  sortedRebinDatesForLayer,
  type AnalysisTimelineResponse,
  type MapAnalysisLayer,
} from "../services/analysisTimeline";

export type { AnalysisTimelineResponse, TimelineBucket } from "../services/analysisTimeline";

/** Full date for rebin cells, e.g. "26 May 2025" (from API YYYY-MM-DD). */
function formatRibbonLabel(iso: string): string {
  const dt = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(dt.getTime())) return iso;
  return dt.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export interface AnalysisTimelineRibbonProps {
  plotName: string;
  activeLayer: MapAnalysisLayer;
  selectedDate: string;
  onSelectDate: (iso: string) => void;
  /**
   * When set, Map owns fetching and passes data here (avoids duplicate GET).
   * Omit to fetch inside the ribbon (standalone).
   */
  externalTimeline?: { payload: AnalysisTimelineResponse | null; loading: boolean; error?: string | null };
}

export const AnalysisTimelineRibbon: React.FC<AnalysisTimelineRibbonProps> = ({
  plotName,
  activeLayer,
  selectedDate,
  onSelectDate,
  externalTimeline,
}) => {
  const [localPayload, setLocalPayload] = useState<AnalysisTimelineResponse | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement | null>(null);

  const controlled = externalTimeline != null;
  const payload = controlled ? externalTimeline.payload : localPayload;
  const loading = controlled ? externalTimeline.loading : localLoading;

  useEffect(() => {
    if (controlled || !plotName?.trim()) {
      if (!controlled && !plotName?.trim()) setLocalPayload(null);
      return;
    }
    let cancelled = false;
    setLocalLoading(true);
    fetchAnalysisTimeline(plotName.trim())
      .then((data) => {
        if (!cancelled) setLocalPayload(data);
      })
      .finally(() => {
        if (!cancelled) setLocalLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [plotName, controlled]);

  const days = useMemo(() => {
    if (!payload?.timeline?.length) return [] as string[];
    return sortedRebinDatesForLayer(payload.timeline, activeLayer);
  }, [payload, activeLayer]);

  useEffect(() => {
    if (!selectedRef.current || !scrollRef.current) return;
    selectedRef.current.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: "smooth",
    });
  }, [selectedDate, days.length, activeLayer]);

  if (!plotName?.trim()) return null;

  if (loading && !payload) {
    return (
      <div className="analysis-timeline-ribbon-wrap">
        <div className="analysis-timeline-ribbon analysis-timeline-ribbon--loading" role="status">
          <Loader2 className="analysis-timeline-ribbon__spinner" aria-hidden />
          <span className="analysis-timeline-ribbon__loading-text">Loading timeline…</span>
        </div>
      </div>
    );
  }

  const timelineError = controlled ? externalTimeline?.error : null;
  if (timelineError) {
    return (
      <div className="analysis-timeline-ribbon-wrap">
        <div className="analysis-timeline-ribbon analysis-timeline-ribbon--loading" role="status">
          <span className="analysis-timeline-ribbon__loading-text">
            Timeline unavailable: {timelineError}
          </span>
        </div>
      </div>
    );
  }

  if (!days.length) {
    return (
      <div className="analysis-timeline-ribbon-wrap">
        <div className="analysis-timeline-ribbon analysis-timeline-ribbon--loading" role="status">
          <span className="analysis-timeline-ribbon__loading-text">
            No rebin dates available for this layer.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="analysis-timeline-ribbon-wrap">
      <div className="analysis-timeline-ribbon" ref={scrollRef}>
        {days.map((iso) => {
          const isSel = iso === selectedDate;
          return (
            <button
              key={iso}
              type="button"
              ref={isSel ? selectedRef : undefined}
              data-timeline-date={iso}
              className={`analysis-timeline-cell${isSel ? " analysis-timeline-cell--selected" : ""}`}
              onClick={() => onSelectDate(iso)}
              title={iso}
            >
              <span className="analysis-timeline-cell__label">{formatRibbonLabel(iso)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFarmerProfile } from '../hooks/useFarmerProfile';
import './FarmerInfoBar.css';
import { getAuthToken } from '../utils/auth';
import { getNotificationsBaseUrl } from '../utils/serviceUrls';
import {
  fetchForecastCurrentWeather,
  type ForecastCurrentWeather,
  type ForecastPeriodPrediction,
} from '../services/weatherService';

type NotificationRow = {
  id: number;
  message: string;
  is_read: boolean;
  created_at: string;
  task_id: number | null;
  task_title: string | null;
  notification_type: string;
  metadata: Record<string, unknown>;
};

type ToastItem = {
  id: number;
  message: string;
  created_at: string;
  title?: string;
};

function isFromFieldOfficer(n: NotificationRow): boolean {
  const t = String(n.notification_type || "").toLowerCase();
  if (t.includes("fieldofficer") || t.includes("field_officer") || t.includes("field officer")) return true;
  const m: any = n.metadata || {};
  const candidates: Array<any> = [
    m.sender_role,
    m.from_role,
    m.actor_role,
    m.created_by_role,
    m.sender?.role,
    m.from?.role,
    m.actor?.role,
    m.created_by?.role,
    m.sender?.user_role,
    m.from?.user_role,
    m.actor?.user_role,
    m.created_by?.user_role,
  ];
  return candidates
    .map((v) => String(v || "").toLowerCase())
    .some((v) => v === "fieldofficer" || v === "field_officer" || v === "field officer");
}

function isTaskFromFieldOfficer(n: NotificationRow): boolean {
  if (!isFromFieldOfficer(n)) return false;
  // Prefer explicit task_id (present in our NotificationRow type)
  if (typeof n.task_id === "number" && n.task_id > 0) return true;
  const t = String(n.notification_type || "").toLowerCase();
  if (t.includes("task")) return true;
  const m: any = n.metadata || {};
  if (m.task_id || m.task || m.task_title) return true;
  // Fallback: many notifications only carry a text message
  if (String(n.message || "").toLowerCase().includes("task")) return true;
  return false;
}

function isTaskLikeNotification(n: NotificationRow): boolean {
  if (typeof n.task_id === "number" && n.task_id > 0) return true;
  const t = String(n.notification_type || "").toLowerCase();
  if (t.includes("task")) return true;
  const msg = String(n.message || "").toLowerCase();
  if (msg.includes("assigned a new task")) return true;
  if (msg.startsWith("task") || msg.includes("task:")) return true;
  const m: any = n.metadata || {};
  if (m.task_id || m.task || m.task_title) return true;
  return false;
}

function getFirstPlotLatLon(
  plots: Array<{ coordinates?: { location?: { coordinates?: [number, number]; latitude?: number; longitude?: number } } }> | undefined
): { lat: number; lon: number } | null {
  if (!plots?.length) return null;
  for (const plot of plots) {
    const loc = plot.coordinates?.location;
    if (!loc) continue;
    if (Array.isArray(loc.coordinates) && loc.coordinates.length === 2) {
      const [lon, lat] = loc.coordinates;
      if (typeof lat === 'number' && typeof lon === 'number' && !isNaN(lat) && !isNaN(lon)) {
        return { lat, lon };
      }
    }
    if (typeof loc.latitude === 'number' && typeof loc.longitude === 'number') {
      return { lat: loc.latitude, lon: loc.longitude };
    }
  }
  return null;
}

/** Used when no plot has coordinates (same order as API: lat, lon). */
const DEFAULT_FORECAST_LAT = 20.014422865162672;
const DEFAULT_FORECAST_LON = 73.73769671983223;

function temperatureStressLabel(temp: number | undefined): string {
  if (temp === undefined || isNaN(temp)) return '—';
  const heat = temp >= 35;
  const frost = temp <= 2;
  if (heat && frost) return 'Heat stress · Frost risk';
  if (heat) return 'Heat stress';
  if (frost) return 'Frost risk';
  return 'No heat or frost stress';
}

function playNotificationSound(audioCtxRef: React.MutableRefObject<AudioContext | null>) {
  try {
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as
      | typeof AudioContext
      | undefined;
    if (Ctx) {
      const ctx = audioCtxRef.current ?? new Ctx();
      audioCtxRef.current = ctx;
      void ctx.resume?.();
      const now = ctx.currentTime;

      const playBeep = (startAt: number, freq: number) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'square';
        o.frequency.value = freq;
        g.gain.value = 0.0001;
        o.connect(g);
        g.connect(ctx.destination);
        g.gain.setValueAtTime(0.0001, startAt);
        g.gain.exponentialRampToValueAtTime(0.25, startAt + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.30);
        o.start(startAt);
        o.stop(startAt + 0.32);
      };

      playBeep(now, 880);
      playBeep(now + 0.38, 988);
    }
  } catch {
    // ignore
  }
}

function isBrowserNotificationSupported(): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  // Browser notifications are only allowed on secure origins in production.
  return window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

async function ensureNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isBrowserNotificationSupported()) return 'unsupported';
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission;
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

function ForecastPeriodRows({
  title,
  prediction,
}: {
  title: string;
  prediction: ForecastCurrentWeather['next_24h_prediction'];
}) {
  if (!prediction) return null;
  const periods: { key: keyof NonNullable<typeof prediction>; label: string }[] = [
    { key: 'morning', label: 'Morning' },
    { key: 'afternoon', label: 'Afternoon' },
    { key: 'night', label: 'Night' },
  ];
  const rows = periods
    .map(({ key, label }) => {
      const p = prediction[key] as ForecastPeriodPrediction | undefined;
      if (!p?.rain_alert && !p?.rain_probability) return null;
      return (
        <div key={key} className="notif-forecast-period">
          <span className="notif-forecast-period-label">{label}</span>
          <span className="notif-forecast-period-text">
            {p.rain_alert ?? '—'}
            {p.rain_probability ? ` · ${p.rain_probability}` : ''}
          </span>
        </div>
      );
    })
    .filter(Boolean);
  if (rows.length === 0) return null;
  return (
    <div className="notif-forecast-block">
      <div className="notif-forecast-block-title">{title}</div>
      {rows}
    </div>
  );
}

const FarmerInfoBar: React.FC = () => {
  const { profile, getFarmerName, getTotalPlots } = useFarmerProfile();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [forecast, setForecast] = useState<ForecastCurrentWeather | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastError, setForecastError] = useState<string | null>(null);
  const [showAlerts, setShowAlerts] = useState(false);
  const panelWrapRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Format current date
  const getCurrentDate = () => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    };
    return today.toLocaleDateString('en-US', options);
  };

  // Get farmer name
  const farmerName = profile ? getFarmerName() : 'Loading...';
  
  // Get total plots count - use agricultural_summary first, fallback to plots array length
  const totalPlots = profile 
    ? (getTotalPlots() || profile.plots?.length || 0)
    : 0;

  const displayItems = useMemo(() => {
    const fieldOfficerOnly = items.filter(isFromFieldOfficer);
    // If backend provides role metadata, use it. Otherwise, show all (avoid empty dropdown).
    return fieldOfficerOnly.length > 0 ? fieldOfficerOnly : items;
  }, [items]);

  const unreadCount = useMemo(
    () => displayItems.filter((n) => !n.is_read).length,
    [displayItems]
  );
  
  const forecastLatLon = useMemo(
    () =>
      getFirstPlotLatLon(profile?.plots) ?? {
        lat: DEFAULT_FORECAST_LAT,
        lon: DEFAULT_FORECAST_LON,
      },
    [profile?.plots]
  );

  // Initial alert notification on login
  const alertTriggeredRef = useRef(false);
  const permissionPromptAttachedRef = useRef(false);

  const showLoginAlert = (title: string, message: string) => {
    const alertId = Date.now();
    playNotificationSound(audioCtxRef);

    try {
      if (isBrowserNotificationSupported() && Notification.permission === 'granted') {
        const n = new Notification(title, {
          body: message,
          tag: `notif-${alertId}`,
          silent: true,
        });
        window.setTimeout(() => n.close(), 6000);
      }
    } catch {
      // ignore notification failures
    }

    setToasts((prev) => {
      const next: ToastItem[] = [
        { id: alertId, message, created_at: new Date().toISOString(), title },
        ...prev,
      ].slice(0, 3);
      return next;
    });

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== alertId));
    }, 8000);
  };

  // Ask notification permission on first user interaction (works better in deployed browsers).
  useEffect(() => {
    if (permissionPromptAttachedRef.current) return;
    if (!isBrowserNotificationSupported()) return;
    if (Notification.permission !== 'default') return;

    permissionPromptAttachedRef.current = true;
    const askPermissionOnce = () => {
      void ensureNotificationPermission();
      document.removeEventListener('click', askPermissionOnce);
      document.removeEventListener('keydown', askPermissionOnce);
      permissionPromptAttachedRef.current = false;
    };

    document.addEventListener('click', askPermissionOnce, { once: true });
    document.addEventListener('keydown', askPermissionOnce, { once: true });

    return () => {
      document.removeEventListener('click', askPermissionOnce);
      document.removeEventListener('keydown', askPermissionOnce);
      permissionPromptAttachedRef.current = false;
    };
  }, []);
  
  useEffect(() => {
    if (alertTriggeredRef.current) return;

    let cancelled = false;
    
    fetchForecastCurrentWeather(forecastLatLon.lat, forecastLatLon.lon)
      .then((data) => {
        if (cancelled) return;
        alertTriggeredRef.current = true;
        
        let alertMsg = `Today's Weather: ${data.temperature_c ?? '--'}°C, Humidity: ${data.humidity ?? '--'}%. Click to view.`;
        
        if (data.rain_alert || data.next_24h_prediction?.morning?.rain_alert) {
          alertMsg = `Rain Expected! Temp: ${data.temperature_c ?? '--'}°C, Humidity: ${data.humidity ?? '--'}%. Click to view.`;
        } else if ((data.temperature_c && data.temperature_c >= 35) || (data.temperature_c && data.temperature_c <= 2) || (data.humidity && data.humidity > 80)) {
          alertMsg = `Extreme Weather (${data.temperature_c ?? '--'}°C, ${data.humidity ?? '--'}%). Click to view.`;
        }
        
        showLoginAlert("Weather Alert", alertMsg);
      })
      .catch(() => {
        if (cancelled) return;
        alertTriggeredRef.current = true;
        showLoginAlert(
          "Weather Alert",
          "Weather update is temporarily unavailable. Open alerts to view latest notifications."
        );
      });
      
    return () => {
      cancelled = true;
    };
  }, [forecastLatLon.lat, forecastLatLon.lon]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const base = getNotificationsBaseUrl();
      const res = await fetch(`${base.replace(/\/+$/, '')}/api/notifications/`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data: any = await res.json();
      const rows: NotificationRow[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
          ? data.results
          : [];
      setItems(rows);
    } catch (e) {
      // keep silent; dropdown will show empty
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      const token = getAuthToken();
      const base = getNotificationsBaseUrl();
      const res = await fetch(
        `${base.replace(/\/+$/, '')}/api/notifications/mark-all-read/`,
        {
          method: 'PATCH',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({}),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // optimistic UI update
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // ignore failures (keep UI as-is)
    }
  };

  const pushIncomingNotification = (notif: NotificationRow) => {
    // Sound
    playNotificationSound(audioCtxRef);

    // Native browser notification (permission required)
    try {
      if (isBrowserNotificationSupported() && Notification.permission === 'granted') {
        const title = notif.task_title ? `Task assigned: ${notif.task_title}` : 'New notification';
        const n = new Notification(title, {
          body: notif.message,
          tag: `notif-${notif.id}`,
          silent: true, // we play our own sound
        });
        window.setTimeout(() => n.close(), 6000);
      }
    } catch {
      // ignore notification failures
    }

    // Prepend + de-dup by id
    setItems((prev) => {
      const byId = new Map<number, NotificationRow>();
      [notif, ...prev].forEach((n) => byId.set(n.id, n));
      return Array.from(byId.values());
    });

    // Show on-screen toast like a browser notification
    setToasts((prev) => {
      const next: ToastItem[] = [
        { id: notif.id, message: notif.message, created_at: notif.created_at },
        ...prev,
      ].slice(0, 3);
      return next;
    });

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== notif.id));
    }, 5000);
  };

  useEffect(() => {
    if (!open) return;
    void fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) {
      setForecast(null);
      setForecastError(null);
      setShowAlerts(false);
      return;
    }
    let cancelled = false;
    setForecastLoading(true);
    setForecastError(null);
    void fetchForecastCurrentWeather(forecastLatLon.lat, forecastLatLon.lon)
      .then((data) => {
        if (!cancelled) setForecast(data);
      })
      .catch(() => {
        if (!cancelled) {
          setForecast(null);
          setForecastError('Weather alerts unavailable');
        }
      })
      .finally(() => {
        if (!cancelled) setForecastLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, forecastLatLon.lat, forecastLatLon.lon]);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    const base = getNotificationsBaseUrl();
    const wsBase = base.startsWith('https://')
      ? base.replace(/^https:\/\//, 'wss://')
      : base.startsWith('http://')
        ? base.replace(/^http:\/\//, 'ws://')
        : base;
    const wsUrl = `${wsBase.replace(/\/+$/, '')}/ws/notifications/?token=${encodeURIComponent(token)}`;

    let cancelled = false;
    let attempt = 0;

    const cleanup = () => {
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {
          // ignore
        }
        wsRef.current = null;
      }
    };

    const connect = () => {
      if (cancelled) return;
      cleanup();

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          attempt = 0;
        };

        ws.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data);
            const notif = msg?.notification as NotificationRow | undefined;
            if (notif && typeof notif.id === 'number' && typeof notif.message === 'string') {
              pushIncomingNotification(notif);
            }
          } catch {
            // ignore bad payloads
          }
        };

        ws.onclose = (_ev) => {
          if (cancelled) return;
          // reconnect with backoff (max ~30s)
          attempt += 1;
          const delay = Math.min(30000, 1000 * Math.pow(2, Math.min(5, attempt)));
          reconnectTimerRef.current = window.setTimeout(connect, delay);
        };

        ws.onerror = () => {
          // allow onclose to handle reconnect
        };
      } catch {
        // schedule reconnect
        attempt += 1;
        const delay = Math.min(30000, 1000 * Math.pow(2, Math.min(5, attempt)));
        reconnectTimerRef.current = window.setTimeout(connect, delay);
      }
    };

    connect();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  useEffect(() => {
    const onDocDown = (ev: MouseEvent) => {
      if (!open) return;
      const el = panelWrapRef.current;
      if (!el) return;
      if (ev.target instanceof Node && !el.contains(ev.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, [open]);

  // Don't render until profile is available (keep hooks above to avoid order issues)
  if (!profile) {
    return null;
  }

  return (
    <div className="farmer-info-bar">
      {toasts.length > 0 ? (
        <div className="notif-toasts" aria-live="polite" aria-atomic="true">
          {toasts.map((t) => (
            <button
              key={t.id}
              type="button"
              className="notif-toast notif-toast-click"
              onClick={() => {
                setOpen(true);
                setShowAlerts(true);
              }}
              title="Open alerts"
            >
              <div className="notif-toast-top">
                <div className="notif-toast-title">{t.title || 'New message'}</div>
                <div className="notif-toast-cta">View</div>
              </div>
              <div className="notif-toast-msg">{t.message}</div>
              <div className="notif-toast-meta">{new Date(t.created_at).toLocaleString()}</div>
            </button>
          ))}
        </div>
      ) : null}
      <div className="farmer-info-container">
        {/* Left: Farmer Name */}
        <div className="farmer-info-section farmer-info-left">
          <span className="farmer-name">{farmerName}</span>
        </div>

        {/* Center: Current Date */}
        <div className="farmer-info-section farmer-info-center">
          <span className="farmer-date">{getCurrentDate()}</span>
        </div>

        {/* Right: Total Plots */}
        <div className="farmer-info-section farmer-info-right">
          <span className="farmer-plots">Total Plots: {totalPlots}</span>
          <div ref={panelWrapRef} style={{ position: 'relative' }}>
            <button
              type="button"
              className="notif-btn"
              title="Notifications"
              onClick={async () => {
                await ensureNotificationPermission();
                setOpen((p) => !p);
              }}
              aria-haspopup="dialog"
              aria-expanded={open}
            >
              <span className="material-icons" style={{ fontSize: 20 }}>
                notifications
              </span>
              {unreadCount > 0 ? (
                <span className="notif-badge">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              ) : null}
            </button>

            {open ? (
              <div className="notif-panel" role="dialog" aria-label="Notifications">
                <div className="notif-panel-header">
                  <div className="notif-panel-header-main">
                    <div className="notif-panel-header-title-row">
                      <div className="notif-panel-header-title">Notifications</div>
                      <button
                        type="button"
                        className="notif-alert-btn"
                        onClick={() => setShowAlerts((p) => !p)}
                        aria-expanded={showAlerts}
                        aria-controls="notif-alerts"
                        title="Alerts"
                      >
                        Alert
                      </button>
                    </div>
                  </div>
                  <div className="notif-panel-actions">
                    <button
                      type="button"
                      className="notif-markall"
                      onClick={markAllRead}
                      disabled={items.length === 0 || unreadCount === 0}
                      title="Mark all as read"
                    >
                      Mark all read
                    </button>
                    <button
                      type="button"
                      className="notif-close"
                      onClick={() => setOpen(false)}
                      title="Close"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {showAlerts ? (
                  <div id="notif-alerts" className="notif-alerts-panel" aria-label="Alerts">
                    <div className="notif-weather-alerts" aria-label="Weather alerts">
                      {forecastLoading ? (
                        <div className="notif-weather-alerts-muted">Loading alerts…</div>
                      ) : forecastError ? (
                        <div className="notif-weather-alerts-muted">{forecastError}</div>
                      ) : forecast ? (
                        <>
                          <div className="notif-weather-pill notif-weather-pill-rain">
                            <span className="notif-weather-pill-label">Rain</span>
                            <span className="notif-weather-pill-value">
                              {forecast.rain_alert ?? '—'}
                              {forecast.rain_probability ? ` (${forecast.rain_probability})` : ''}
                            </span>
                          </div>
                          <ForecastPeriodRows title="24 hrs prediction" prediction={forecast.next_24h_prediction} />
                          <ForecastPeriodRows title="48 hrs prediction" prediction={forecast.next_48h_prediction} />
                          {typeof forecast.humidity === 'number' ? (
                            <div className={`notif-weather-pill ${forecast.humidity > 80 ? 'notif-weather-pill-warn' : ''}`}>
                              <span className="notif-weather-pill-label">Humidity</span>
                              <span className="notif-weather-pill-value">{forecast.humidity}% {forecast.humidity > 80 ? '(High)' : ''}</span>
                            </div>
                          ) : null}
                          {typeof forecast.temperature_c === 'number' ? (
                            <div className={temperatureStressLabel(forecast.temperature_c) === 'No heat or frost stress' ? "notif-weather-pill notif-weather-pill-temp" : "notif-weather-pill notif-weather-pill-warn"}>
                              <span className="notif-weather-pill-label">Temperature</span>
                              <span className="notif-weather-pill-value">
                                {forecast.temperature_c}°C ({temperatureStressLabel(forecast.temperature_c)})
                              </span>
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <div className="notif-weather-alerts-muted">No alerts</div>
                      )}
                    </div>
                  </div>
                ) : null}

                <div className="notif-list">
                  {loading ? (
                    <div className="notif-empty">Loading…</div>
                  ) : displayItems.length === 0 ? (
                    <div className="notif-empty">No notifications</div>
                  ) : (
                    displayItems.map((n) => {
                      const shouldNavigate =
                        isTaskLikeNotification(n) || isTaskFromFieldOfficer(n);
                      return (
                        <button
                          key={n.id}
                          type="button"
                          className="notif-item notif-item-click"
                          onClick={() => {
                            if (!shouldNavigate) return;
                            window.dispatchEvent(
                              new CustomEvent("cropeye:navigate", {
                                detail: { menu: "ViewList" },
                              })
                            );
                            setOpen(false);
                          }}
                          title={shouldNavigate ? "Open My Task Checklist" : undefined}
                        >
                          <div className="notif-item-msg">{n.message}</div>
                          <div className="notif-item-meta">
                            {new Date(n.created_at).toLocaleString()}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmerInfoBar;

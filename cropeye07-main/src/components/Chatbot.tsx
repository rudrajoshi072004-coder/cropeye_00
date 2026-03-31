import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageCircle, X, Mic, MicOff, Send, Loader2,
  Minimize2, Play, Pause, Trash2, FileText, Globe, RefreshCw,
} from "lucide-react";
import {
  getChatbotResponse,
  detectLanguage,
  type Language,
  type UserRole,
} from "../services/ruleBasedChatbot";
import { useAppContext } from "../context/AppContext";
import { getUserRole, getUserData } from "../utils/auth";

// ── Backend API ────────────────────────────────────────────────────────────────
const CHATBOT_API_URL = "https://cropeye-chatbot.up.railway.app";

type ChatLanguage = "en" | "hi" | "mr";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  language?: Language;
}

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: UserRole;
}

// ── Component ──────────────────────────────────────────────────────────────────
const Chatbot: React.FC<ChatbotProps> = ({ isOpen, onClose, userRole }) => {
  const { selectedPlotName } = useAppContext();

  // ── State ──────────────────────────────────────────────────────────────────
  const [messages, setMessages]           = useState<Message[]>([]);
  const [inputText, setInputText]         = useState("");
  const [isLoading, setIsLoading]         = useState(false);
  const [isRecording, setIsRecording]     = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isAudioPaused, setIsAudioPaused] = useState(false);
  const [hasAutoWelcomed, setHasAutoWelcomed] = useState(false);
  const [isMinimized, setIsMinimized]     = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // API-specific state
  const [isInitialized, setIsInitialized]   = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initError, setInitError]           = useState<string | null>(null);
  const [chatLanguage, setChatLanguage]     = useState<ChatLanguage>("mr");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showReportModal, setShowReportModal]       = useState(false);
  const [reportContent, setReportContent]           = useState<string>("");
  const [reportLanguage, setReportLanguage]         = useState<ChatLanguage>("mr");

  // ── Refs ───────────────────────────────────────────────────────────────────
  const messagesEndRef        = useRef<HTMLDivElement>(null);
  const recognitionRef        = useRef<any>(null);
  const autoWelcomeTimerRef   = useRef<NodeJS.Timeout | null>(null);
  const lastBotMessageRef     = useRef<string>("");
  const mediaRecorderRef      = useRef<MediaRecorder | null>(null);
  const backendAudioRef       = useRef<HTMLAudioElement | null>(null);
  // Tracks which plotId was last successfully initialized so we don't
  // call /initialize-plot again when the chatbot is simply closed & reopened
  const initializedPlotRef    = useRef<string | null>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────
  // Use same role detection as the auth system:
  // prop takes precedence; if not provided fall back to localStorage ('role' key)
  const activeRole = (userRole || getUserRole() || "farmer") as UserRole;

  const isFarmerRole       = activeRole === "farmer";
  const isFieldOfficerRole = activeRole === "fieldofficer";
  const isManagerRole      = activeRole === "manager";

  // Per-role chat endpoint routing
  const getChatEndpoint = (): string => {
    if (isFarmerRole)       return "/chat/farmer";
    if (isFieldOfficerRole) return "/chat/field_officer";
    if (isManagerRole)      return "/chat/manager";
    return "/chat/field_officer"; // owner fallback
  };

  // Fall back to localStorage so the chatbot finds the plot even if context
  // hasn't been populated yet (profile still loading in FarmerDashboard)
  const plotId = selectedPlotName || localStorage.getItem("selectedPlot") || null;

  // ── Add message ────────────────────────────────────────────────────────────
  const addMessage = useCallback((text: string, isUser: boolean, language?: Language) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString() + Math.random(), text, isUser, timestamp: new Date(), language },
    ]);
  }, []);

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Load voices ────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = () => setAvailableVoices(window.speechSynthesis.getVoices());
    if ("speechSynthesis" in window) {
      load();
      window.speechSynthesis.onvoiceschanged = load;
    }
    return () => {
      recognitionRef.current?.stop();
      autoWelcomeTimerRef.current && clearTimeout(autoWelcomeTimerRef.current);
      window.speechSynthesis.cancel();
    };
  }, []);

  // ── Auto-initialize ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    if (!isFarmerRole) {
      setIsInitialized(true);
      return;
    }

    const currentPlot = plotId || "__no_plot__";

    if (initializedPlotRef.current === currentPlot) {
      // Same plot already initialized in a previous open — skip API call
      setIsInitialized(true);
      return;
    }

    // New plot or first open — call the API
    if (!isInitializing) {
      setIsInitialized(false);
      initializePlot();
    }
  }, [isOpen, isFarmerRole, plotId]);

  // ── Reset on close ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      setHasAutoWelcomed(false);
      // Do NOT reset isInitialized — the ref already tracks which plot is
      // initialized so the next open will skip the API call for the same plot
      setInitError(null);
    }
  }, [isOpen]);

  // ── Auto-welcome ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen && !hasAutoWelcomed && !isMinimized && isInitialized) {
      autoWelcomeTimerRef.current = setTimeout(async () => {
        const welcome = getChatbotResponse("hello", activeRole);
        addMessage(welcome.text, false, "marathi");
        await speakText(welcome.text);
        setHasAutoWelcomed(true);
      }, 3000);
    }
    return () => { autoWelcomeTimerRef.current && clearTimeout(autoWelcomeTimerRef.current); };
  }, [isOpen, hasAutoWelcomed, isMinimized, isInitialized]);

  // ── Plot Initialization (farmer only) ─────────────────────────────────────
  const initializePlot = async () => {
    const currentPlot = plotId || "__no_plot__";

    if (!plotId) {
      // No plot available — open in static fallback mode so farmer can still chat
      initializedPlotRef.current = currentPlot;
      setIsInitialized(true);
      return;
    }
    setIsInitializing(true);
    setInitError(null);
    try {
      const res = await fetch(`${CHATBOT_API_URL}/initialize-plot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plot_id: plotId }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      initializedPlotRef.current = currentPlot; // remember — skip next time
      setIsInitialized(true);
    } catch (err: any) {
      console.error("[Chatbot] Init failed:", err);
      setInitError(err.message || "Initialization failed. Please try again.");
      // Still let farmer chat using static fallback; mark as initialized
      initializedPlotRef.current = currentPlot;
      setIsInitialized(true);
    } finally {
      setIsInitializing(false);
    }
  };

  // ── Backend Audio Playback ─────────────────────────────────────────────────
  const playBackendAudio = (audioBase64: string) => {
    try {
      const byteStr = atob(audioBase64);
      const arr = new Uint8Array(byteStr.length);
      for (let i = 0; i < byteStr.length; i++) arr[i] = byteStr.charCodeAt(i);
      const blob = new Blob([arr], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      backendAudioRef.current = audio;
      setIsPlayingAudio(true);
      audio.play().catch(() => {
        console.warn("[Chatbot] Backend audio failed, falling back to TTS");
        setIsPlayingAudio(false);
      });
      audio.addEventListener("ended", () => {
        URL.revokeObjectURL(url);
        setIsPlayingAudio(false);
        backendAudioRef.current = null;
      });
    } catch (err) {
      console.error("[Chatbot] Backend audio error:", err);
      setIsPlayingAudio(false);
    }
  };

  // ── TTS (browser fallback) ─────────────────────────────────────────────────
  const cleanTextForTTS = (text: string): string => {
    return text
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "$1")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/^[\s]*[•\-\*]\s+/gm, "")
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, "")
      .replace(/[\u{2600}-\u{26FF}]/gu, "")
      .replace(/[\u{2700}-\u{27BF}]/gu, "")
      .replace(/\n{2,}/g, " ")
      .replace(/\n/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
  };

  const speakText = async (text: string): Promise<void> => {
    if (!text?.trim() || !("speechSynthesis" in window)) return;
    const cleaned = cleanTextForTTS(text);
    if (!cleaned) return;

    return new Promise<void>((resolve) => {
      window.speechSynthesis.cancel();
      setIsAudioPaused(false);
      lastBotMessageRef.current = text.trim();

      const voices = availableVoices.length ? availableVoices : window.speechSynthesis.getVoices();
      const utterance = new SpeechSynthesisUtterance(cleaned);

      let voice =
        voices.find((v) => v.lang === "mr-IN") ||
        voices.find((v) => v.lang.startsWith("mr-")) ||
        voices.find((v) => v.lang === "hi-IN") ||
        voices.find((v) => v.lang.includes("-IN"));

      if (voice) { utterance.voice = voice; utterance.lang = voice.lang; }
      else utterance.lang = "mr-IN";

      utterance.rate = 0.85;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      setIsPlayingAudio(true);
      utterance.onend = () => { setIsPlayingAudio(false); setIsAudioPaused(false); resolve(); };
      utterance.onerror = () => { setIsPlayingAudio(false); setIsAudioPaused(false); resolve(); };

      setTimeout(() => window.speechSynthesis.speak(utterance), 100);
    });
  };

  const pauseAudio = () => {
    backendAudioRef.current?.pause();
    window.speechSynthesis.cancel();
    setIsPlayingAudio(false);
    setIsAudioPaused(true);
  };

  const playAudio = () => {
    if (lastBotMessageRef.current) {
      setIsAudioPaused(false);
      speakText(lastBotMessageRef.current);
    }
  };

  // ── Send text message via API ──────────────────────────────────────────────
  const sendTextMessageWithText = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const detectedLang = detectLanguage(message);
    addMessage(message, true, detectedLang);
    setIsLoading(true);

    // user_id is required by field_officer endpoints
    const userData = getUserData();
    const userId: number | undefined = userData?.id;

    try {
      const endpoint = getChatEndpoint();

      // Build payload per-role based on the API schema
      let payload: Record<string, any>;
      if (isFieldOfficerRole || isManagerRole) {
        // POST /chat/field_officer  →  { message, user_id, plot_id }
        // POST /chat/manager        →  { message, user_id, plot_id }
        payload = { message };
        if (userId)  payload.user_id = userId;
        if (plotId)  payload.plot_id = plotId;
      } else {
        // POST /chat/farmer  →  { message, plot_id, language }
        payload = { message, language: chatLanguage };
        if (plotId) payload.plot_id = plotId;
      }

      const res = await fetch(`${CHATBOT_API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`API ${res.status}`);

      // Response types differ per role:
      //   farmer        → JSON object: { response, final_output, audio_base64, status }
      //   field_officer → JSON object: { response, intent }
      //   manager       → plain string
      const rawData = await res.text();
      let botText: string;
      try {
        const data = JSON.parse(rawData);
        if (data.error) throw new Error(data.error);

        // Handle "still loading" status (farmer only)
        if (isFarmerRole && data.status && data.status !== "ready") {
          addMessage(data.message || "Plot data still loading. Please wait a moment...", false, "english");
          return;
        }

        botText = data.response || data.final_output || rawData || "No response received.";
      } catch {
        // Plain string response (manager)
        botText = rawData.replace(/^"|"$/g, "") || "No response received.";
      }

      // ── Show message first, then speak ──────────────────────────────────
      addMessage(botText, false);
      lastBotMessageRef.current = botText;

      // Small delay so React renders the bubble before TTS/audio starts
      await new Promise((r) => setTimeout(r, 150));

      try {
        const data = JSON.parse(rawData);
        if (data.audio_base64) {
          playBackendAudio(data.audio_base64);
        } else {
          await speakText(botText);
        }
      } catch {
        await speakText(botText);
      }
    } catch (err: any) {
      console.warn("[Chatbot] API failed, using static fallback:", err.message);
      const fallback = getChatbotResponse(message, activeRole);
      addMessage(fallback.text, false, fallback.language);
      await speakText(fallback.text);
    } finally {
      setIsLoading(false);
    }
  };

  const sendTextMessage = async () => {
    if (!inputText.trim() || isLoading) return;
    const msg = inputText.trim();
    setInputText("");
    await sendTextMessageWithText(msg);
  };

  // ── Voice input via browser Speech Recognition ────────────────────────────
  // Uses browser built-in STT (most reliable) → sends transcribed text via /chat endpoint
  const startVoiceRecording = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      addMessage(
        "Voice input is not supported in this browser. Please use Chrome or Edge and try typing instead.",
        false
      );
      return;
    }

    // Stop any existing session first
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }

    const langMap: Record<ChatLanguage, string> = { mr: "mr-IN", hi: "hi-IN", en: "en-US" };

    const recognition = new SR();
    recognition.continuous      = true;   // keep listening until user clicks stop
    recognition.interimResults  = true;
    recognition.maxAlternatives = 1;
    recognition.lang            = langMap[chatLanguage] || "mr-IN";

    let finalTranscript = "";
    let silenceTimer: ReturnType<typeof setTimeout> | null = null;

    const clearSilenceTimer = () => {
      if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer = null; }
    };

    recognition.onstart = () => {
      setIsRecording(true);
      setInputText("🎤 Listening...");
    };

    recognition.onresult = (event: any) => {
      clearSilenceTimer();
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + " ";
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setInputText(finalTranscript + interim);

      // Auto-send 2 s after last speech detected
      if (finalTranscript) {
        silenceTimer = setTimeout(() => {
          recognition.stop();
        }, 2000);
      }
    };

    recognition.onerror = (event: any) => {
      clearSilenceTimer();
      setIsRecording(false);
      setInputText("");
      if (event.error === "not-allowed" || event.error === "permission-denied") {
        addMessage("Microphone permission denied. Please allow mic access in your browser settings.", false);
      } else if (event.error === "network") {
        addMessage("Network error during voice recognition. Please check your connection.", false);
      } else if (event.error !== "aborted") {
        addMessage(`Voice error: ${event.error}. Please try again or type your message.`, false);
      }
      recognitionRef.current = null;
    };

    recognition.onend = async () => {
      clearSilenceTimer();
      setIsRecording(false);
      recognitionRef.current = null;
      const text = finalTranscript.trim();
      if (text) {
        setInputText("");
        await sendTextMessageWithText(text);
      } else {
        setInputText("");
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (err) {
      setIsRecording(false);
      addMessage("Could not start voice input. Please try again.", false);
      recognitionRef.current = null;
    }
  };

  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try { mediaRecorderRef.current.stop(); } catch { /* ignore */ }
      mediaRecorderRef.current = null;
    }
    setIsRecording(false);
  };

  // ── Report generation ──────────────────────────────────────────────────────
  const generateReport = async () => {
    if (!plotId) {
      addMessage("Please select a plot first to generate a report.", false);
      return;
    }
    setIsGeneratingReport(true);
    setReportContent("");
    setShowReportModal(true);

    try {
      const res = await fetch(`${CHATBOT_API_URL}/generate-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plot_id: plotId, language: reportLanguage }),
      });
      if (!res.ok) throw new Error(`Report API ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setReportContent(data.report || "No report content available.");
    } catch (err: any) {
      setReportContent(`Error generating report: ${err.message}`);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // ── Clear chat ─────────────────────────────────────────────────────────────
  const clearChat = () => {
    window.speechSynthesis.cancel();
    backendAudioRef.current?.pause();
    setMessages([]);
    setInputText("");
    setHasAutoWelcomed(false);
    setIsPlayingAudio(false);
    setIsAudioPaused(false);
    lastBotMessageRef.current = "";
  };

  // ── Early return ───────────────────────────────────────────────────────────
  if (!isOpen) return null;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed bottom-6 right-6 z-[99999]">
      {isMinimized ? (
        <div
          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 rounded-full shadow-2xl cursor-pointer hover:scale-110 transition-all duration-300 animate-bounce relative"
          onClick={() => setIsMinimized(false)}
          title="Expand Chatbot"
        >
          <MessageCircle className="w-6 h-6" />
          {messages.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
              {messages.length}
            </span>
          )}
        </div>
      ) : (
        <div className="w-96 h-[680px] bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden">

          {/* ── Header ── */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-3 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                <h3 className="font-semibold text-sm">CropEye Assistant</h3>
                {isRecording   && <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" title="Recording" />}
                {isPlayingAudio && <span className="w-2 h-2 bg-blue-300 rounded-full animate-pulse" title="Speaking" />}
                {isInitializing && <Loader2 className="w-3 h-3 animate-spin opacity-80" />}
              </div>

              <div className="flex items-center gap-1">
                {/* Language selector */}
                <div className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-1">
                  <Globe className="w-3 h-3" />
                  <select
                    value={chatLanguage}
                    onChange={(e) => setChatLanguage(e.target.value as ChatLanguage)}
                    className="bg-transparent text-white text-xs outline-none cursor-pointer"
                    title="Chat Language"
                  >
                    <option value="mr" className="text-gray-800">मराठी</option>
                    <option value="hi" className="text-gray-800">हिंदी</option>
                    <option value="en" className="text-gray-800">English</option>
                  </select>
                </div>

                {/* Report button — only if plot available */}
                {plotId && (
                  <button
                    onClick={generateReport}
                    disabled={isGeneratingReport}
                    className="p-1 hover:bg-white/20 rounded transition-all duration-200 hover:scale-110 disabled:opacity-50"
                    title="Generate Yield Report"
                  >
                    {isGeneratingReport
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <FileText className="w-4 h-4" />
                    }
                  </button>
                )}

                <button onClick={() => setIsMinimized(true)} className="p-1 hover:bg-white/20 rounded transition-all" title="Minimize">
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button onClick={onClose} className="p-1 hover:bg-white/20 rounded transition-all" title="Close">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Plot info bar */}
            {plotId && (
              <div className="mt-1 text-[10px] text-green-100 flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isInitialized ? "bg-green-300" : "bg-yellow-300"}`} />
                Plot: {plotId} • {isInitialized ? "Ready" : "Initializing..."}
              </div>
            )}
          </div>

          {/* ── Init error banner ── */}
          {initError && (
            <div className="bg-amber-50 border-b border-amber-200 px-3 py-2 flex items-center justify-between">
              <p className="text-xs text-amber-700">{initError}</p>
              <button
                onClick={initializePlot}
                className="ml-2 text-xs text-amber-600 hover:text-amber-800 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Retry
              </button>
            </div>
          )}

          {isFarmerRole && !isInitialized && isInitializing && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <Loader2 className="w-10 h-10 text-green-500 animate-spin mb-3" />
              <p className="text-sm text-gray-600">Loading your plot data...</p>
              <p className="text-xs text-gray-400 mt-1">Plot: {plotId}</p>
            </div>
          )}

          {/* ── Messages area ── */}
          {(isInitialized || !isFarmerRole) && (
            <>
              <div
                className="flex-1 overflow-y-auto p-4 space-y-3 relative"
                style={{
                  background: `linear-gradient(135deg,rgba(34,139,34,.08) 0%,rgba(144,238,144,.12) 25%,rgba(255,255,255,.98) 50%,rgba(255,215,0,.08) 75%,rgba(34,139,34,.08) 100%)`,
                  backgroundColor: "#f8fdf9",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-white/30 to-white/70 pointer-events-none" />

                <div className="relative z-10">
                  {messages.length === 0 && (
                    <div className="text-center text-gray-500 text-sm py-10">
                      <div className="bg-white/80 rounded-full w-14 h-14 mx-auto mb-3 flex items-center justify-center shadow-lg">
                        <MessageCircle className="w-7 h-7 text-green-600" />
                      </div>
                      <p className="font-medium">Ask me about your farm!</p>
                      <p className="text-xs mt-1 text-green-600 animate-pulse">
                        {chatLanguage === "mr" ? "मराठी" : chatLanguage === "hi" ? "हिंदी" : "English"} mode
                      </p>
                    </div>
                  )}

                  {messages.map((msg, i) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.isUser ? "justify-end" : "justify-start"} mb-3`}
                      style={{ animationDelay: `${i * 0.04}s` }}
                    >
                      <div
                        className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm shadow-md ${
                          msg.isUser
                            ? "bg-gradient-to-r from-green-500 to-green-600 text-white rounded-br-sm"
                            : "bg-white text-gray-800 rounded-bl-sm border border-gray-100"
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                        <span className={`text-[10px] mt-1 block ${msg.isUser ? "text-green-100" : "text-gray-400"}`}>
                          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-md border border-gray-100">
                        <div className="flex gap-1">
                          {[0, 0.2, 0.4].map((d, i) => (
                            <span
                              key={i}
                              className="w-2 h-2 bg-green-400 rounded-full animate-bounce"
                              style={{ animationDelay: `${d}s` }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* ── Input area ── */}
              <div className="border-t border-gray-200 bg-white/95 backdrop-blur-sm p-3 rounded-b-2xl">
                <div className="flex items-end gap-2">
                  {/* Pause / Play */}
                  {isPlayingAudio && !isAudioPaused && (
                    <button onClick={pauseAudio} className="p-2 text-gray-500 hover:text-orange-500 hover:bg-gray-100 rounded-full transition-all" title="Pause">
                      <Pause className="w-4 h-4" />
                    </button>
                  )}
                  {!isPlayingAudio && lastBotMessageRef.current && (
                    <button onClick={playAudio} className="p-2 text-gray-500 hover:text-green-600 hover:bg-gray-100 rounded-full transition-all" title="Replay">
                      <Play className="w-4 h-4" />
                    </button>
                  )}

                  {/* Text input */}
                  <div className="flex-1">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendTextMessage()}
                      placeholder={
                        chatLanguage === "mr"
                          ? "प्रश्न विचारा..."
                          : chatLanguage === "hi"
                          ? "प्रश्न पूछें..."
                          : "Ask a question..."
                      }
                      className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 hover:bg-white transition-all"
                      disabled={isLoading || isRecording}
                    />
                  </div>

                  {/* Mic */}
                  <button
                    onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                    disabled={isLoading}
                    className={`p-2.5 rounded-full transition-all hover:scale-110 ${
                      isRecording
                        ? "bg-red-500 text-white animate-pulse shadow-lg"
                        : "bg-green-600 text-white hover:bg-green-700 shadow-md"
                    } disabled:opacity-50`}
                    title={isRecording ? "Stop Recording" : "Voice Input"}
                  >
                    {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>

                  {/* Send */}
                  {inputText.trim() && (
                    <button
                      onClick={sendTextMessage}
                      disabled={isLoading || isRecording}
                      className="p-2.5 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-50 transition-all hover:scale-110 shadow-md"
                      title="Send"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  )}

                  {/* Clear */}
                  <button
                    onClick={clearChat}
                    disabled={isLoading || messages.length === 0}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-full transition-all disabled:opacity-30"
                    title="Clear Chat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Status bar */}
                {(isRecording || isPlayingAudio) && (
                  <div className="flex items-center gap-3 mt-1.5 text-xs px-1">
                    {isRecording && (
                      <span className="flex items-center gap-1 text-red-500">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> Recording...
                      </span>
                    )}
                    {isPlayingAudio && (
                      <span className="flex items-center gap-1 text-blue-500">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" /> Speaking...
                      </span>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Report Modal ── */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 z-[100000] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-600" />
                <h2 className="font-semibold text-gray-800">Yield Improvement Report</h2>
                {plotId && <span className="text-xs text-gray-400">— {plotId}</span>}
              </div>
              <div className="flex items-center gap-2">
                {/* Report language */}
                <select
                  value={reportLanguage}
                  onChange={(e) => setReportLanguage(e.target.value as ChatLanguage)}
                  className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="mr">मराठी</option>
                  <option value="hi">हिंदी</option>
                  <option value="en">English</option>
                </select>
                <button
                  onClick={generateReport}
                  disabled={isGeneratingReport}
                  className="text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                >
                  {isGeneratingReport ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  Regenerate
                </button>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-all"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Modal content */}
            <div className="flex-1 overflow-y-auto p-5">
              {isGeneratingReport ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                  <Loader2 className="w-10 h-10 animate-spin text-green-500 mb-3" />
                  <p className="text-sm">Generating report...</p>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">
                  {reportContent || "No report content yet."}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="border-t border-gray-200 p-3 flex justify-end gap-2">
              <button
                onClick={() => {
                  const blob = new Blob([reportContent], { type: "text/plain;charset=utf-8" });
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = `CropEye_Report_${plotId}_${new Date().toISOString().split("T")[0]}.txt`;
                  a.click();
                }}
                disabled={!reportContent || isGeneratingReport}
                className="text-sm border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-all"
              >
                📄 Download
              </button>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-sm bg-gray-100 text-gray-700 px-4 py-1.5 rounded-lg hover:bg-gray-200 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;

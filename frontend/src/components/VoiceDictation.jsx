import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2, Sparkles, AlertCircle, Check, Volume2 } from "lucide-react";
import { api } from "../services/api";

const VoiceDictation = ({ editor, onDictationComplete, dismissTrigger }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [lastGeneratedTitle, setLastGeneratedTitle] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const notificationTimeoutRef = useRef(null);
  const recognitionRef = useRef(null);
  const streamRef = useRef(null);
  const liveTranscriptRef = useRef("");
  const accumulatedTranscriptRef = useRef("");
  const isRecordingRef = useRef(false);

  // Auto-dismiss the title notification after 3 seconds
  useEffect(() => {
    if (lastGeneratedTitle) {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
      notificationTimeoutRef.current = setTimeout(() => {
        setLastGeneratedTitle(null);
      }, 3000);

      return () => {
        if (notificationTimeoutRef.current) {
          clearTimeout(notificationTimeoutRef.current);
        }
      };
    }
  }, [lastGeneratedTitle]);

  // Instantly dismiss if new note is clicked or triggered by parent
  useEffect(() => {
    if (dismissTrigger) {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
      setLastGeneratedTitle(null);
    }
  }, [dismissTrigger]);

  // Clean up timers, streams, and recognition on unmount
  useEffect(() => {
    return () => {
      isRecordingRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    setErrorMsg(null);
    setLiveTranscript("");
    liveTranscriptRef.current = "";
    accumulatedTranscriptRef.current = "";
    if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
    setLastGeneratedTitle(null);

    let stream = null;
    try {
      // 1. Resilient microphone acquisition with fallback
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          },
        });
      } catch (err1) {
        console.warn("[Echo Voice] Specific audio constraints failed, trying basic audio:", err1);
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      streamRef.current = stream;
      audioChunksRef.current = [];

      // 2. Format selection
      let mimeType = "";
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/webm")) {
        mimeType = "audio/webm";
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4";
      }

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }

        const audioBlob = new Blob(audioChunksRef.current, {
          type: mimeType ? mimeType.split(";")[0] : "audio/webm",
        });

        const capturedTranscript = liveTranscriptRef.current;
        await processAudio(audioBlob, capturedTranscript);
      };

      // 3. Start Native Web Speech Recognition in parallel (continuous)
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = "en-US";

          recognition.onresult = (event) => {
            let currentInterim = "";
            let newlyFinalized = "";

            for (let i = event.resultIndex; i < event.results.length; i++) {
              const res = event.results[i];
              if (res.isFinal) {
                newlyFinalized += res[0].transcript + " ";
              } else {
                currentInterim += res[0].transcript + " ";
              }
            }

            if (newlyFinalized) {
              accumulatedTranscriptRef.current = (
                accumulatedTranscriptRef.current + " " + newlyFinalized
              ).trim();
            }

            const fullText = (
              accumulatedTranscriptRef.current + " " + currentInterim
            ).trim();

            liveTranscriptRef.current = fullText;
            setLiveTranscript(fullText);
          };

          recognition.onerror = (e) => {
            console.warn("[Echo Voice] SpeechRecognition event notice:", e.error);
          };

          recognition.onend = () => {
            // Keep alive if still recording
            if (isRecordingRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (e) {}
            }
          };

          recognition.start();
          recognitionRef.current = recognition;
        } catch (e) {
          console.warn("[Echo Voice] Web Speech Recognition not available:", e);
        }
      }

      mediaRecorder.start(500);
      isRecordingRef.current = true;
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("[Echo Voice] Microphone opening error:", err);
      setErrorMsg(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Microphone access was blocked. Please enable microphone permissions in your browser URL bar."
          : "Could not access microphone: " + err.message
      );
      setIsRecording(false);
      isRecordingRef.current = false;
    }
  };

  const stopRecording = () => {
    isRecordingRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.requestData();
      } catch (e) {}
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
    setIsProcessing(true);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const processAudio = async (audioBlob, transcriptText) => {
    try {
      setIsProcessing(true);

      const hasAudio = audioBlob && audioBlob.size > 200;
      let data = null;

      try {
        data = await api.dictateAudio(
          hasAudio ? audioBlob : null,
          transcriptText || ""
        );
      } catch (networkErr) {
        console.warn("[Echo Voice] Backend API unreachable or error, falling back locally:", networkErr);
      }

      // If backend succeeded, use its structured response
      if (data && data.success && data.blocks && data.blocks.length > 0) {
        setLastGeneratedTitle(data.title || "Voice Note");

        if (onDictationComplete) {
          onDictationComplete({
            title: data.title || "Voice Note",
            blocks: data.blocks,
            rawTranscript: data.rawTranscript || transcriptText,
            cleanedMarkdown: data.cleanedMarkdown || "",
          });
        }
      }
      // If backend was unreachable or rate-limited but browser captured speech transcript, structure locally
      else if (transcriptText && transcriptText.trim().length > 0) {
        console.info("[Echo Voice] Formatting speech transcript locally");
        const clean = transcriptText.trim();
        const words = clean.split(/\s+/);
        const titleCandidate = words.slice(0, 6).join(" ").replace(/[.,;!?]+$/, "");
        const title = titleCandidate.charAt(0).toUpperCase() + titleCandidate.slice(1);

        const sentences = clean.split(/(?<=[.?!])\s+/).map((s) => s.trim()).filter(Boolean);
        const actionPattern = /^(todo|need to|have to|must|please|remember to|set up|create|build|implement|fix|deploy|check|buy|call|schedule|review)/i;

        const localBlocks = [];
        for (const sentence of sentences) {
          if (actionPattern.test(sentence)) {
            localBlocks.push({
              type: "checkListItem",
              props: { checked: false },
              content: [{ type: "text", text: sentence }],
            });
          } else {
            localBlocks.push({
              type: "bulletListItem",
              content: [{ type: "text", text: sentence }],
            });
          }
        }

        if (localBlocks.length === 0) {
          localBlocks.push({
            type: "paragraph",
            content: [{ type: "text", text: clean }],
          });
        }

        setLastGeneratedTitle(title);

        if (onDictationComplete) {
          onDictationComplete({
            title,
            blocks: localBlocks,
            rawTranscript: clean,
            cleanedMarkdown: localBlocks.map((b) => `- ${b.content?.[0]?.text || ""}`).join("\n"),
          });
        }
      } else {
        throw new Error(data?.message || "No speech detected. Please speak clearly into your microphone.");
      }
    } catch (err) {
      console.error("[Echo Voice] Processing error:", err);
      setErrorMsg(err.message || "Voice processing failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${rem
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8 z-50 flex flex-col items-end gap-2.5 sm:gap-3 pointer-events-auto select-none">
      {/* Live Recording Panel with Real-time Speech Preview */}
      {isRecording && (
        <div className="flex flex-col gap-2.5 p-3.5 sm:p-4 rounded-3xl bg-white/95 dark:bg-[#12131f]/95 border border-red-500/60 shadow-2xl backdrop-blur-2xl text-slate-900 dark:text-white max-w-[calc(100vw-2rem)] sm:max-w-sm w-full animate-fade-in">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="font-bold text-red-500 text-xs md:text-sm">
                Listening...
              </span>
              <span className="font-mono text-slate-500 dark:text-slate-400 text-xs ml-1">
                {formatTime(duration)}
              </span>
            </div>

            {/* Audio Wave Visualizer Simulation */}
            <div className="flex items-center gap-0.5 h-4 px-1">
              {[40, 95, 60, 100, 75, 90, 50, 85].map((h, i) => (
                <span
                  key={i}
                  className="w-1 bg-red-500 rounded-full"
                  style={{
                    height: `${h}%`,
                    animation: `pulseAudioWave 0.7s ease-in-out ${i * 0.08}s infinite alternate`,
                  }}
                />
              ))}
            </div>

            <button
              onClick={stopRecording}
              className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              Stop & Save
            </button>
          </div>

          {/* Real-time speech preview */}
          {liveTranscript ? (
            <p className="text-xs text-purple-700 dark:text-purple-300 italic bg-purple-50 dark:bg-purple-950/40 p-2.5 rounded-xl border border-purple-200 dark:border-purple-500/30 line-clamp-3">
              "{liveTranscript}"
            </p>
          ) : (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
              Speak now: say any note, list, or thought...
            </p>
          )}
        </div>
      )}

      {/* AI Structuring State Banner */}
      {isProcessing && (
        <div className="flex items-center gap-2.5 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-white/95 dark:bg-[#151624]/95 border border-purple-500/40 shadow-2xl text-purple-700 dark:text-purple-300 text-xs md:text-sm animate-pulse backdrop-blur-xl max-w-[calc(100vw-2rem)] sm:max-w-sm">
          <Sparkles size={16} className="text-purple-500 animate-spin shrink-0" />
          <span>Echo AI: Structuring note heading & body blocks...</span>
        </div>
      )}

      {/* Error Message Toast */}
      {errorMsg && (
        <div className="flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-2xl bg-red-100 dark:bg-red-950/90 border border-red-300 dark:border-red-500/60 text-red-700 dark:text-red-200 text-xs md:text-sm shadow-xl max-w-[calc(100vw-2rem)] sm:max-w-sm">
          <AlertCircle size={16} className="text-red-500 shrink-0" />
          <span className="flex-1">{errorMsg}</span>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-red-500 hover:text-red-800 dark:hover:text-white font-bold ml-1 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Success Notification */}
      {lastGeneratedTitle && !isProcessing && (
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-100 dark:bg-emerald-950/90 border border-emerald-300 dark:border-emerald-500/50 text-emerald-800 dark:text-emerald-300 text-xs shadow-xl animate-fade-in max-w-[calc(100vw-2rem)] sm:max-w-sm">
          <Check size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="truncate">Note Created: <strong className="text-slate-900 dark:text-white">{lastGeneratedTitle}</strong></span>
          <button
            onClick={() => {
              if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
              setLastGeneratedTitle(null);
            }}
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-900 ml-1 font-bold cursor-pointer"
            title="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}

      {/* Floating Microphone Button */}
      <div className="relative group">
        <button
          onClick={toggleRecording}
          disabled={isProcessing}
          className={`relative flex items-center justify-center w-13 h-13 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full shadow-2xl transition-all duration-300 transform active:scale-95 cursor-pointer ${
            isRecording
              ? "bg-red-600 text-white recording-pulse-ring scale-110 shadow-red-500/50"
              : isProcessing
              ? "bg-purple-900/80 text-purple-300 cursor-wait"
              : "bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 text-white hover:scale-105 hover:shadow-purple-500/40 hover:shadow-2xl"
          }`}
          title={isRecording ? "Click to stop recording" : "Echo Voice AI (Click to speak)"}
        >
          {isProcessing ? (
            <Loader2 size={24} className="animate-spin" />
          ) : isRecording ? (
            <Square size={22} className="fill-white" />
          ) : (
            <Mic size={24} />
          )}
        </button>

        {/* Hover Tooltip when idle */}
        {!isRecording && !isProcessing && (
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white whitespace-nowrap text-xs shadow-xl border border-white/10 pointer-events-none">
            <Sparkles size={12} className="text-purple-400" />
            <span>Echo Voice AI (Click to Record)</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceDictation;

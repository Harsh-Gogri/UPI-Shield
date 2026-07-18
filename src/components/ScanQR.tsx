import React, { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { ShieldCheck, ShieldAlert, ShieldX, RefreshCw, Info, X, MoreVertical, Shield, ArrowRight, CheckCircle2, Delete, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { analyzeRisk } from "../services/geminiService";
import { type RiskLevel, type AnalysisResult, performLocalAnalysis } from "../lib/fraudAnalysis";

interface ScanQRProps {
  onClose: () => void;
}

export const ScanQR = ({ onClose }: ScanQRProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"scanner" | "payment" | "success">("scanner");
  const [amount, setAmount] = useState("0");
  const [note, setNote] = useState("");
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    let animationFrameId: number;

    const tick = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        if (context) {
          canvas.height = videoRef.current.videoHeight;
          canvas.width = videoRef.current.videoWidth;
          context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code) {
            handleScan(code.data);
            return;
          }
        }
      }
      if (scanning) {
        animationFrameId = requestAnimationFrame(tick);
      }
    };

    if (scanning) {
      animationFrameId = requestAnimationFrame(tick);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [scanning]);

  // Start camera on mount and clean up on unmount
  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const startCamera = async () => {
    const tryStream = async (constraints: MediaStreamConstraints) => {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setScanning(true);
        setView("scanner");
      }
    };

    try {
      await tryStream({
        video: { facingMode: { ideal: "environment" } },
      });
    } catch (err) {
      try {
        await tryStream({ video: true });
      } catch (fallbackErr) {
        console.error("Camera access error:", fallbackErr);
        setError("Camera access denied. Please enable camera permissions in your browser settings.");
      }
    }
  };

  const parseUPIData = (data: string) => {
    try {
      if (!data.startsWith("upi://")) {
        return { upiId: data, merchantName: "Unknown" };
      }
      const url = new URL(data);
      const params = new URLSearchParams(url.search);
      return {
        upiId: params.get("pa") || "",
        merchantName: params.get("pn") || "",
        amount: params.get("am") || undefined,
      };
    } catch (e) {
      return { upiId: data, merchantName: "Unknown" };
    }
  };

  const handleScan = (data: string) => {
    setScanning(false);
    // Stop camera stream after successful scan to save resources
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    const { upiId, merchantName, amount: qrAmount } = parseUPIData(data);
    const identifier = upiId || data;

    // Step 1: Local Analysis (Mandatory & Instant)
    const localResult = performLocalAnalysis(identifier);

    setResult({
      ...localResult,
      upiId: identifier,
      merchantName: merchantName || "Unknown",
      explanation: "Local signals analyzed. Deep security scan in progress...",
      recommendation: "Please wait a moment while we check for security signals.",
      isDeepScanning: true,
    });

    if (qrAmount) setAmount(qrAmount);

    // Transition immediately to payment view
    setView("payment");
    setIsAnalyzing(true);

    // Step 2: Deep Security Scan (Asynchronous)
    const runAnalysis = async () => {
      try {
        const aiInput = `
UPI ID: ${identifier}
Merchant Name: ${merchantName || "Unknown"}
Amount: ${qrAmount || "Not specified"}
Raw QR Data:
${data}
`;

        const aiResult = await analyzeRisk(aiInput);

        setResult((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            explanation: aiResult.explanation,
            recommendation: aiResult.recommendation,
            isDeepScanning: false,
            // Update risk level/score if AI finds something more serious
            riskLevel: aiResult.riskLevel === "High" || prev.riskLevel === "High" ? "High" : aiResult.riskLevel === "Medium" || prev.riskLevel === "Medium" ? "Medium" : "Low",
            riskScore: Math.max(prev.riskScore, aiResult.riskScore),
            signals: Array.from(new Set([...prev.signals, ...aiResult.signals])),
          };
        });
      } catch (error) {
        console.error("QR Analysis background error:", error);
        setResult((prev) =>
          prev
            ? {
                ...prev,
                isDeepScanning: false,
                explanation: prev.explanation + "\n\n(Deep scan timed out. Using local signals only.)",
              }
            : null,
        );
      } finally {
        setIsAnalyzing(false);
      }
    };

    runAnalysis();
  };

  const handleKeypad = (val: string) => {
    if (amount === "0") {
      setAmount(val);
    } else {
      setAmount((prev) => prev + val);
    }
  };

  const handleBackspace = () => {
    setAmount((prev) => (prev.length > 1 ? prev.slice(0, -1) : "0"));
  };

  const resetScanner = () => {
    setResult(null);
    setError(null);
    setAmount("0");
    setView("scanner");
    setShowAnalysis(false);
    startCamera();
  };

  const transactionId = useRef(`UPS${Math.random().toString(36).substring(2, 10).toUpperCase()}`);
  const transactionTime = useRef(
    new Date().toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Format amount with decimals for display
  const formatAmount = (val: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    return num.toFixed(2);
  };

  return (
    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed inset-0 z-[60] bg-white flex flex-col overflow-hidden">
      {/* Full Screen Camera Background */}
      {view === "scanner" && (
        <div className="absolute inset-0 z-0 bg-black">
          {!error && (
            <>
              <video ref={videoRef} className="fixed inset-0 w-full h-full object-cover" autoPlay playsInline muted />
              <canvas ref={canvasRef} className="hidden" />
            </>
          )}
        </div>
      )}

      {/* Overlay UI */}
      <div className="relative z-10 flex-1 flex flex-col h-full">
        {/* Header — only shown on scanner view; payment view has its own header inside */}
        {view === "scanner" && (
          <div className="p-6 flex items-center justify-between">
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-black">
              <X size={24} />
            </button>
          </div>
        )}

        {/* Scanner Elements Overlay */}
        {view === "scanner" && !error && (
          <div className="flex-1 relative">
            {/* Animated Scan Line */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary/90 shadow-[0_0_20px_rgba(38,28,193,0.9)] animate-[scan_2.5s_linear_infinite]" />
            </div>

            {/* Bottom Instruction */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
              <div className="bg-black/60 backdrop-blur-md px-5 py-3 rounded-full">
                <span className="block text-center text-sm font-medium text-white">Scan any UPI QR</span>
              </div>
            </div>
          </div>
        )}

        {/* ── REDESIGNED: Payment Screen ── */}
        <AnimatePresence>
          {view === "payment" && result && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-white z-20 flex flex-col p-6 h-[100dvh] overflow-hidden font-sans">
              {/* Top Header */}
              <header className="flex items-center gap-4 mb-4 flex-shrink-0">
                <button onClick={onClose} className="p-1 -ml-1 text-[#222222]">
                  <ArrowRight className="rotate-180" size={24} />
                </button>
                <h1 className="text-[20px] font-normal text-[#222222]">Cancel Payment</h1>
              </header>

              {/* Amount Preview Section (Flexible) */}
              <div className="flex-1 flex flex-col justify-center min-h-0 mb-4">
                <div className="w-full bg-[#FBFBFB] rounded-[24px] border border-black/5 px-6 py-5 flex flex-col items-center justify-center text-center shadow-soft">
                  <div className="flex items-baseline mb-1">
                    <span className="text-[60px] font-semibold text-[#222222]">₹{amount}</span>
                  </div>
                  <p className="text-[18px] font-normal text-[#8F8F8F] mb-6 w-full truncate px-4">{result.upiId}</p>

                  <div className="w-full max-w-[280px]">
                    <input type="text" placeholder="Add Note" value={note} onChange={(e) => setNote(e.target.value)} className="w-full bg-white border border-black/5 rounded-xl px-4 py-4 text-center text-[#222222] placeholder:text-[#8F8F8F] focus:outline-none focus:border-primary/30 transition-colors" />
                  </div>
                </div>
              </div>

              {/* Recipient / Merchant Section (Fixed) */}
              <button onClick={() => setShowAnalysis(true)} className="w-full bg-white border border-black/5 rounded-[24px] px-4 py-[14px] flex items-center gap-3 shadow-soft active:scale-[0.98] transition-all mb-4 flex-shrink-0 overflow-hidden">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-lg flex-shrink-0 aspect-square">{getInitials(result.merchantName || "U")}</div>
                <div className="flex-1 text-left min-w-0">
                  <h3 className="text-[18px] font-medium text-[#222222] leading-tight truncate">{result.merchantName || "Unknown"}</h3>
                  <p className="text-[16px] font-normal text-[#8F8F8F] truncate">{result.upiId}</p>
                </div>
                <ChevronDown size={20} className="text-[#8F8F8F] flex-shrink-0" />
              </button>

              {/* Proceed to Payment Button (Fixed) */}
              <button onClick={() => setView("success")} className="w-full py-5 rounded-full bg-[#261CC1] text-white font-medium text-[20px] active:scale-[0.98] transition-all shadow-lg mb-3 flex-shrink-0">
                Proceed to Payment
              </button>

              {/* Numeric Keypad (Fixed) */}
              <div className="flex-shrink-0 pb-2 h-[36dvh] w-full">
                <div className="grid grid-cols-3 grid-rows-4 gap-[12px] h-full">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, ".", 0, "backspace"].map((key) => {
                    if (key === "backspace") {
                      return (
                        <button key="backspace" onClick={handleBackspace} className="w-full h-full bg-[#FBFBFB] rounded-[18px] flex items-center justify-center text-[#222222] active:bg-gray-100 transition-colors">
                          <Delete size={24} />
                        </button>
                      );
                    }
                    return (
                      <button key={key} onClick={() => (key === "." ? handleKeypad(".") : handleKeypad(key.toString()))} className="w-full h-full bg-[#FBFBFB] rounded-[18px] flex items-center justify-center text-[24px] font-medium text-[#222222] active:bg-gray-100 transition-colors">
                        {key}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Screen — unchanged */}
        <AnimatePresence>
          {view === "success" && result && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-white z-30 flex flex-col p-8 items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full bg-[#E6F4EA] text-[#188038] flex items-center justify-center mb-6">
                <CheckCircle2 size={40} />
              </div>

              <h2 className="text-2xl font-medium text-black mb-1">Payment Successful</h2>
              <p className="text-sm text-[#5F6368] mb-12">Money sent securely via UPI Shield</p>

              <div className="w-full space-y-6 text-left border-t border-b border-gray-100 py-8">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#5F6368]">Amount paid</span>
                  <span className="text-lg font-medium text-black">₹{amount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#5F6368]">To</span>
                  <div className="text-right">
                    <p className="text-sm font-medium text-black">{result.merchantName || "Unknown"}</p>
                    <p className="text-xs text-[#5F6368]">{result.upiId}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#5F6368]">Transaction ID</span>
                  <span className="text-xs font-mono text-[#5F6368]">{transactionId.current}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#5F6368]">Time</span>
                  <span className="text-sm text-[#5F6368]">{transactionTime.current}</span>
                </div>
              </div>

              <button onClick={onClose} className="mt-12 w-full py-4 rounded-full bg-black text-white font-medium active:scale-95 transition-transform">
                Back to Home
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── UPDATED: Risk Analysis Bottom Sheet ── */}
        <AnimatePresence>
          {showAnalysis && result && (
            <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50">
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 220 }} className="w-full bg-white rounded-t-3xl px-6 pt-6 pb-8 shadow-2xl max-h-[90dvh] flex flex-col">
                {/* Sheet Header (Fixed) */}
                <div className="flex-shrink-0">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-black leading-tight">{result.merchantName || "Merchant name"}</h3>
                      <p className="text-sm text-[#5F6368] mt-0.5">{result.upiId}</p>
                    </div>
                    <button onClick={() => setShowAnalysis(false)} className="w-10 h-10 flex items-center justify-center text-[#5F6368] -mr-1">
                      <X size={24} />
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-[#E8EAED] w-full mb-5" />
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto no-scrollbar">
                  {/* Local Analysis Section (Always Visible) */}
                  <div className="mb-6">
                    <div className="mb-4">
                      <h4 className="text-sm font-black uppercase tracking-widest opacity-40 mb-1">Classification</h4>
                      <p className="text-base font-semibold text-black">{result.classification}</p>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-black uppercase tracking-widest opacity-40 mb-2">Signals Detected</h4>
                      <ul className="space-y-1.5">
                        {result.signals.map((signal, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-[#3C4043] font-medium">
                            <span className="mt-0.5">•</span>
                            <span>{signal}</span>
                          </li>
                        ))}
                        {result.signals.length === 0 && <li className="text-sm text-[#188038] font-medium">• No suspicious patterns detected</li>}
                      </ul>
                    </div>
                  </div>

                  {/* Deep Security Scan Section */}
                  <div className="h-px bg-[#E8EAED] w-full mb-6" />

                  {result.isDeepScanning ? (
                    <div className="py-8 flex flex-col items-center justify-center text-center bg-primary/5 rounded-2xl border border-primary/10 mb-6">
                      <RefreshCw size={28} className="text-primary animate-spin mb-3" />
                      <h4 className="text-base font-black text-black mb-1">Deep Security Scan</h4>
                      <p className="text-sm text-[#5F6368]">Checking online fraud signals...</p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-6">
                        <h4 className="text-sm font-black uppercase tracking-widest opacity-40 mb-2">Deep Security Scan Results</h4>
                        <p className="text-sm text-[#3C4043] leading-relaxed font-medium">{result.explanation}</p>
                      </div>

                      <div className="mb-8">
                        <h4 className="text-sm font-black uppercase tracking-widest opacity-40 mb-2">Suggestions</h4>
                        <p className="text-sm text-[#5F6368] leading-relaxed italic font-medium">"{result.recommendation}"</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Fixed Bottom Action */}
                <div className="flex-shrink-0 pt-4">
                  <button onClick={() => setShowAnalysis(false)} className={cn("w-full py-4 rounded-2xl flex items-center justify-center text-white font-bold text-base active:scale-[0.98] transition-all", result.riskLevel === "Low" ? "bg-green-600" : result.riskLevel === "Medium" ? "bg-amber-500" : "bg-red-600")}>
                    Risk Level: {result.riskLevel} ({result.riskScore}%)
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Error Overlay — unchanged */}
        {error && (
          <div className="absolute inset-0 bg-white z-50 flex flex-col items-center justify-center p-8 text-center">
            <ShieldAlert className="w-20 h-20 text-red-500 mb-6" />
            <h3 className="text-2xl font-black mb-2">Camera Error</h3>
            <p className="text-onSurfaceVariant mb-8">{error}</p>
            <div className="w-full space-y-3">
              <button onClick={resetScanner} className="w-full py-5 rounded-full bg-primary text-onPrimary font-black shadow-sm active:scale-[0.98] transition-all">
                Reload Scanner
              </button>
              <button onClick={onClose} className="w-full py-4 rounded-full border border-black/10 text-onSurfaceVariant font-bold text-sm active:scale-[0.98] transition-all">
                Back to Home
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}</style>
    </motion.div>
  );
};

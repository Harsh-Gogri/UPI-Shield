import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Search, ShieldCheck, ShieldAlert, ShieldX, RefreshCw, ExternalLink } from 'lucide-react';
import { analyzeRisk } from '../services/geminiService';
import { type AnalysisResult, performLocalAnalysis } from '../lib/fraudAnalysis';
import { cn } from '../lib/utils';

interface FraudAlert {
  id: string;
  title: string;
  description: string;
  category: string;
  image: string;
  url: string;
}

const FRAUD_ALERTS: FraudAlert[] = [
  {
    id: 'qr-scam',
    title: 'QR code scams targeting local vendors',
    description: 'Scammers are placing fake QR stickers over legitimate ones to divert payments.',
    category: 'Security Alert',
    image: 'https://picsum.photos/seed/qrscam/400/250',
    url: 'https://www.rbi.org.in/commonman/English/Scripts/PressReleases.aspx'
  },
  {
    id: 'refund-scam',
    title: 'Fake refund scams surge across India',
    description: 'Fraudsters pose as customer care agents offering refunds for failed transactions.',
    category: 'News Update',
    image: 'https://picsum.photos/seed/refund/400/250',
    url: 'https://www.npci.org.in/what-we-do/upi/product-overview'
  },
  {
    id: 'request-fraud',
    title: "New 'Request Money' fraud trend",
    description: "Users are being tricked into approving payment requests disguised as 'receiving' money.",
    category: 'Fraud Alert',
    image: 'https://picsum.photos/seed/request/400/250',
    url: 'https://www.cybercrime.gov.in/'
  },
  {
    id: 'sim-swap',
    title: 'SIM swap fraud: How to protect yourself',
    description: 'Scammers duplicate your SIM to intercept bank OTPs and drain accounts.',
    category: 'Cyber Security',
    image: 'https://picsum.photos/seed/simswap/400/250',
    url: 'https://www.rbi.org.in/'
  },
  {
    id: 'phishing-upi',
    title: 'Phishing links targeting UPI users',
    description: 'Malicious links in SMS or WhatsApp messages lead to fake bank login pages.',
    category: 'Trending',
    image: 'https://picsum.photos/seed/phishing/400/250',
    url: 'https://www.npci.org.in/'
  }
];

export const ScamRadar = () => {
  const [manualId, setManualId] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!manualId.trim()) return;
    const input = manualId.trim();
    
    // Step 1: Local Analysis (Mandatory & Instant)
    const localResult = performLocalAnalysis(input);
    const initialResult: AnalysisResult = {
      ...localResult,
      upiId: input,
      explanation: "Local signals analyzed. Deep security scan in progress...",
      recommendation: "Please wait for deep security scan to complete.",
      isDeepScanning: true
    };
    setAnalysisResult(initialResult);
    setIsAnalyzing(false); // Button loading state off, but deep scan continues

    // Step 2: Deep Security Scan (Asynchronous)
    try {
      const aiResult = await analyzeRisk(input);
      setAnalysisResult(prev => {
        if (!prev) return null;
        return {
          ...prev,
          explanation: aiResult.explanation,
          recommendation: aiResult.recommendation,
          deepScanResult: aiResult.explanation, // Store AI analysis separately if needed
          isDeepScanning: false,
          // We can also update risk level/score if AI finds something more serious
          riskLevel: aiResult.riskLevel === 'High' || prev.riskLevel === 'High' ? 'High' : 
                     aiResult.riskLevel === 'Medium' || prev.riskLevel === 'Medium' ? 'Medium' : 'Low',
          riskScore: Math.max(prev.riskScore, aiResult.riskScore),
          signals: Array.from(new Set([...prev.signals, ...aiResult.signals]))
        };
      });
    } catch (error) {
      console.error("Deep scan failed:", error);
      setAnalysisResult(prev => prev ? { 
        ...prev, 
        isDeepScanning: false,
        explanation: prev.explanation + "\n\n(Deep scan timed out. Using local signals only.)"
      } : null);
    }
  };

  return (
    <div className="pt-4 px-6 space-y-8 pb-8">
      <header>
        <h1 className="text-3xl font-bold mb-2">Scam Radar</h1>
        <p className="text-onSurfaceVariant text-sm">Analyze suspicious IDs and stay updated on fraud trends.</p>
      </header>

      {/* Manual UPI ID Analyzer */}
      <section className="bento-card bg-primaryContainer/30 p-6 border border-primary/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-onPrimary">
            <Search size={20} />
          </div>
          <h2 className="text-xl font-black">UPI ID Analyzer</h2>
        </div>
        
        <div className="space-y-3">
          <div className="relative">
            <input 
              type="text" 
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              placeholder="Enter UPI ID (e.g. refund-help@upi)"
              className="w-full bg-white border border-black/5 rounded-2xl px-5 py-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <button 
            onClick={handleAnalyze}
            disabled={!manualId.trim() || isAnalyzing}
            className="w-full py-4 rounded-2xl bg-primary text-onPrimary font-black shadow-sm active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw size={20} className="animate-spin" />
                Analyzing...
              </>
            ) : (
              "Analyze Fraud Risk"
            )}
          </button>
        </div>

        <AnimatePresence>
          {analysisResult && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 pt-6 border-t border-black/5"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm",
                  analysisResult.riskLevel === 'Low' ? "bg-green-100 text-green-600" :
                  analysisResult.riskLevel === 'Medium' ? "bg-amber-100 text-amber-600" :
                  "bg-red-100 text-red-600"
                )}>
                  {analysisResult.riskLevel === 'Low' ? <ShieldCheck size={28} /> :
                   analysisResult.riskLevel === 'Medium' ? <ShieldAlert size={28} /> :
                   <ShieldX size={28} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className={cn(
                      "text-[10px] font-black uppercase tracking-widest",
                      analysisResult.riskLevel === 'Low' ? "text-green-600" :
                      analysisResult.riskLevel === 'Medium' ? "text-amber-600" :
                      "text-red-600"
                    )}>
                      Risk Level: {analysisResult.riskLevel} ({analysisResult.riskScore}%)
                    </p>
                  </div>
                  <div className="mt-1">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Classification</p>
                    <h3 className="text-lg font-black leading-tight">
                      {analysisResult.classification}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-white/60 p-5 rounded-2xl border border-black/5">
                  <div className="mb-4">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Classification</p>
                    <h3 className="text-lg font-black leading-tight">
                      {analysisResult.classification}
                    </h3>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Signals Detected</p>
                    {analysisResult.signals.length > 0 ? (
                      <ul className="space-y-1.5">
                        {analysisResult.signals.map((signal, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs font-bold text-onSurfaceVariant">
                            <span className="mt-0.5">•</span>
                            <span>{signal}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs font-bold text-green-600">No suspicious signals detected</p>
                    )}
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Risk Score</p>
                    <p className={cn(
                      "text-sm font-black",
                      analysisResult.riskLevel === 'Low' ? "text-green-600" :
                      analysisResult.riskLevel === 'Medium' ? "text-amber-600" :
                      "text-red-600"
                    )}>
                      {analysisResult.riskLevel} ({analysisResult.riskScore}%)
                    </p>
                  </div>
                </div>

                {analysisResult.isDeepScanning ? (
                  <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10 animate-pulse">
                    <div className="flex items-center gap-2 mb-2">
                      <RefreshCw size={16} className="animate-spin text-primary" />
                      <h4 className="text-sm font-black text-primary">Deep Security Scan</h4>
                    </div>
                    <p className="text-xs font-medium text-primary/70">Checking online fraud signals...</p>
                  </div>
                ) : (
                  <div className="bg-white/60 p-5 rounded-2xl border border-black/5">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Deep Security Scan Results</p>
                    <p className="text-xs font-medium leading-relaxed">
                      {analysisResult.explanation}
                    </p>
                  </div>
                )}
                
                {!analysisResult.isDeepScanning && (
                  <div className="bg-white/60 p-5 rounded-2xl border border-black/5">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Suggestions</p>
                    <p className="text-xs font-medium leading-relaxed italic">
                      "{analysisResult.recommendation}"
                    </p>
                  </div>
                )}
              </div>

              <button 
                onClick={() => {
                  setAnalysisResult(null);
                  setManualId('');
                }}
                className="w-full py-3 rounded-xl bg-surfaceVariant text-onSurface font-bold text-sm flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} />
                Clear Analysis
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Latest UPI Fraud Alerts Carousel */}
      <section className="space-y-4">
        <div className="px-2">
          <h2 className="text-xl font-black">Latest UPI Fraud Alerts</h2>
          <p className="text-xs text-onSurfaceVariant">Stay updated with the newest scam trends.</p>
        </div>
        
        <div className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory gap-4 -mx-6 px-6 h-auto">
          {FRAUD_ALERTS.map((alert) => (
            <a
              key={alert.id}
              href={alert.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-none w-[75%] aspect-[3/4] snap-center bento-card bg-white border border-black/5 overflow-hidden flex flex-col group active:scale-[0.98] transition-transform"
            >
              <div className="h-[52%] w-full overflow-hidden">
                <img 
                  src={alert.image} 
                  alt={alert.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-5 flex flex-col flex-1 min-h-0">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">
                  {alert.category}
                </span>
                <h3 className="font-black text-base leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
                  {alert.title}
                </h3>
                <p className="text-xs text-onSurfaceVariant leading-relaxed line-clamp-3 mb-4">
                  {alert.description}
                </p>
                <div className="mt-auto flex items-center gap-1 text-[10px] font-bold text-onSurfaceVariant">
                  Read Article <ExternalLink size={10} />
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
};

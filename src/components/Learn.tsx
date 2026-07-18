import React, { useState } from 'react';
import { getLatestScamInfo } from '../services/geminiService';
import { BookOpen, Search, ExternalLink, Loader2, ShieldCheck, ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';

const STATIC_CARDS = []; // Removed

export const Learn = ({ onBack }: { onBack: () => void }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [aiResult, setAiResult] = useState<{ 
    title: string;
    explanation: string;
    howItWorks: string[];
    warningSigns: string[];
    whatToDo: string[];
    sources: any[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    const result = await getLatestScamInfo(`Latest UPI scams and prevention tips for: ${searchQuery}`);
    setAiResult(result);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-dvh bg-white overflow-hidden pt-4">
      {/* Header Navigation - flex: none */}
      <header className="flex-none px-4 py-0 flex items-center gap-2 border-b border-gray-50 bg-white sticky top-0 z-10">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-onSurface"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-onSurface">Knowledge Hub</h1>
      </header>

      {/* Scrollable AI content area - flex: 1 */}
      <div className="flex-1 overflow-y-auto px-6 py-8 no-scrollbar">
        {!aiResult && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center text-primary mb-6">
              <BookOpen size={40} />
            </div>
            <h2 className="text-2xl font-black text-onSurface mb-2">Ask UPI Shield</h2>
            <p className="text-onSurfaceVariant max-w-[240px]">
              Learn how to identify and prevent the latest UPI frauds.
            </p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-onSurfaceVariant">
            <Loader2 className="animate-spin mb-4 text-primary" size={40} />
            <p className="font-bold text-lg">Consulting Intelligence...</p>
            <p className="text-sm opacity-60">Searching for verified security data</p>
          </div>
        )}

        {aiResult && !loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-10"
          >
            {/* Title & Explanation */}
            <div>
              <h2 className="text-3xl font-black text-onSurface mb-4 leading-tight">
                {aiResult.title}
              </h2>
              <p className="text-onSurfaceVariant text-lg leading-relaxed">
                {aiResult.explanation}
              </p>
            </div>

            {/* How it works */}
            {aiResult.howItWorks.length > 0 && (
              <section>
                <h4 className="text-lg font-black text-onSurface mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-primary rounded-full" />
                  How the scam works
                </h4>
                <ul className="space-y-4">
                  {aiResult.howItWorks.map((item, i) => (
                    <li key={i} className="flex items-start gap-4 text-onSurfaceVariant leading-relaxed">
                      <span className="font-black text-primary/40 mt-0.5">0{i + 1}</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Warning signs */}
            {aiResult.warningSigns.length > 0 && (
              <section>
                <h4 className="text-lg font-black text-onSurface mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                  Warning signs
                </h4>
                <ul className="space-y-3">
                  {aiResult.warningSigns.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-onSurfaceVariant leading-relaxed bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50">
                      <ShieldCheck size={18} className="text-amber-600 shrink-0 mt-1" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* What you should do */}
            {aiResult.whatToDo.length > 0 && (
              <section>
                <h4 className="text-lg font-black text-onSurface mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-green-600 rounded-full" />
                  What you should do
                </h4>
                <div className="space-y-3">
                  {aiResult.whatToDo.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 text-onSurfaceVariant leading-relaxed bg-green-50/50 p-4 rounded-2xl border border-green-100/50">
                      <div className="w-2 h-2 rounded-full bg-green-600 mt-2.5 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Sources */}
            {aiResult.sources.length > 0 && (
              <div className="pt-8 border-t border-gray-100">
                <p className="text-[10px] font-black text-onSurfaceVariant uppercase tracking-widest mb-4">Verified Sources</p>
                <div className="space-y-2">
                  {aiResult.sources.map((source, i) => (
                    <a 
                      key={i} 
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl text-sm hover:bg-primary/5 transition-colors border border-gray-100"
                    >
                      <span className="truncate mr-2 font-bold text-onSurface">{source.title}</span>
                      <ExternalLink size={14} className="shrink-0 text-primary" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Input Bar - flex: none */}
      <div className="flex-none p-6 bg-white border-t border-gray-100">
        <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ask about a scam..."
              className="w-full bg-gray-50 border border-gray-200 rounded-[32px] py-4 pl-12 pr-28 focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-onSurfaceVariant" size={20} />
            <button 
              type="submit"
              disabled={loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-onPrimary px-6 py-2.5 rounded-full text-sm font-black shadow-sm active:scale-95 transition-transform disabled:opacity-50"
            >
              Ask AI
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

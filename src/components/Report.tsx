import React, { useState } from 'react';
import { Send, AlertCircle, CheckCircle2, Upload, MessageSquare, ShieldAlert, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Report = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'upi-id' as 'upi-id' | 'qr-code',
    value: '',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1500);
  };

  if (submitted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          className="w-24 h-24 bg-green-100 text-green-600 rounded-[32px] flex items-center justify-center mb-8 shadow-soft"
        >
          <CheckCircle2 size={48} />
        </motion.div>
        <h2 className="text-3xl font-black mb-4">Report Filed</h2>
        <p className="text-onSurfaceVariant mb-12 leading-relaxed">
          Thank you for helping keep the community safe. Our security team will investigate this report immediately.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setFormData({ type: 'upi-id', value: '', description: '' });
          }}
          className="w-full py-5 rounded-full bg-primary text-onPrimary font-black shadow-medium active:scale-95 transition-transform"
        >
          File Another Report
        </button>
      </div>
    );
  }

  return (
    <div className="pt-4 px-6 space-y-6">
      <header>
        <h1 className="text-3xl font-bold mb-2">Report Fraud</h1>
        <p className="text-onSurfaceVariant text-sm">Help us flag suspicious UPI IDs and QR codes.</p>
      </header>

      {/* Single Connected Flow Container */}
      <div className="bento-card bg-white p-8 space-y-8 shadow-medium">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* STEP 1: Select Report Type (Tabs) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary text-onPrimary flex items-center justify-center text-[10px] font-black">1</div>
              <h3 className="text-sm font-black uppercase tracking-widest text-onSurfaceVariant">Select Report Type</h3>
            </div>
            
            <div className="flex p-1 bg-surfaceVariant/50 rounded-2xl">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'upi-id' })}
                className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${
                  formData.type === 'upi-id' ? 'bg-white text-onSurface shadow-sm' : 'text-onSurfaceVariant/60'
                }`}
              >
                UPI ID
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'qr-code' })}
                className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${
                  formData.type === 'qr-code' ? 'bg-white text-onSurface shadow-sm' : 'text-onSurfaceVariant/60'
                }`}
              >
                QR Code
              </button>
            </div>
          </div>

          {/* STEP 2: Input Field / Upload */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary text-onPrimary flex items-center justify-center text-[10px] font-black">2</div>
              <h3 className="text-sm font-black uppercase tracking-widest text-onSurfaceVariant">
                {formData.type === 'upi-id' ? 'Enter Suspicious ID' : 'Upload QR Image'}
              </h3>
            </div>

            <AnimatePresence mode="wait">
              {formData.type === 'upi-id' ? (
                <motion.div
                  key="upi-input"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="relative"
                >
                  <input
                    required
                    type="text"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder="e.g. scammer@upi"
                    className="w-full bg-surfaceVariant/30 rounded-2xl py-5 px-6 font-medium text-onSurface border-none focus:ring-2 focus:ring-primary transition-all"
                  />
                  <ShieldAlert className="absolute right-6 top-1/2 -translate-y-1/2 text-onSurfaceVariant/30" size={20} />
                </motion.div>
              ) : (
                <motion.div
                  key="qr-upload"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="w-full aspect-video bg-surfaceVariant/20 rounded-2xl border-2 border-dashed border-outlineVariant flex flex-col items-center justify-center text-onSurfaceVariant/60 hover:bg-surfaceVariant/30 transition-colors cursor-pointer"
                >
                  <Upload size={32} className="mb-2" />
                  <p className="text-xs font-bold">Tap to upload QR image</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* STEP 3: Description */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary text-onPrimary flex items-center justify-center text-[10px] font-black">3</div>
              <h3 className="text-sm font-black uppercase tracking-widest text-onSurfaceVariant">Describe the Incident</h3>
            </div>
            
            <div className="relative">
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Tell us what happened..."
                className="w-full bg-surfaceVariant/30 rounded-2xl py-5 px-6 font-medium text-onSurface border-none focus:ring-2 focus:ring-primary transition-all resize-none"
              />
              <MessageSquare className="absolute right-6 bottom-6 text-onSurfaceVariant/30" size={20} />
            </div>
          </div>

          {/* Submit Button */}
          <button
            disabled={loading}
            type="submit"
            className="w-full py-5 rounded-full bg-primary text-onPrimary font-black shadow-medium flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 transition-transform"
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              >
                <RefreshCw size={24} />
              </motion.div>
            ) : (
              <>
                <Send size={24} />
                Submit Report
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer Info */}
      <div className="flex gap-4 items-center px-4">
        <AlertCircle className="text-amber-500 shrink-0" size={20} />
        <p className="text-[10px] font-bold text-onSurfaceVariant leading-relaxed">
          Your report helps protect millions of users. We take privacy seriously and your data is encrypted.
        </p>
      </div>
    </div>
  );
};

const RefreshCw = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
  </svg>
);

import React from 'react';
import { Radar, BookOpen, QrCode, AlertTriangle, Info } from 'lucide-react';
import { cn } from '../lib/utils';

interface HomeProps {
  onNavigate: (tab: 'radar' | 'guide' | 'scan' | 'report') => void;
}

export const Home = ({ onNavigate }: HomeProps) => {
  return (
    <div className="flex flex-col min-h-full">
      {/* Hero Banner Section */}
      <div className="relative w-full overflow-hidden">
        {/* Background Image */}
        <img 
          src="/UPI-shield/banner.jpg"
          alt=""
          className="w-full h-auto block"
        />

        {/* Header Overlay */}
        <div className="absolute inset-0 p-6 flex items-start z-10" style={{ paddingTop: '16px' }}>
          <div>
            <h2 className="text-sm tracking-tight" style={{ color: '#222222', fontWeight: 'normal', fontFamily: 'Arial' }}>Hi, Security Hero</h2>
            <h1 className="tracking-tighter" style={{ color: '#222222', fontSize: '24px', fontWeight: 'bold' }}>UPI Shield</h1>
          </div>
        </div>
      </div>

      {/* Quick Action Section */}
      <div className="px-6 mt-8 mb-0">
        <div className="flex justify-between items-start w-full">
          <ActionButton 
            icon={<QrCode size={28} />} 
            label="Scan QR" 
            onClick={() => onNavigate('scan')}
          />
          <ActionButton 
            icon={<Radar size={28} />} 
            label="Radar" 
            onClick={() => onNavigate('radar')}
          />
          <ActionButton 
            icon={<BookOpen size={28} />} 
            label="Guide" 
            onClick={() => onNavigate('guide')}
          />
          <ActionButton 
            icon={<AlertTriangle size={28} />} 
            label="Report" 
            onClick={() => onNavigate('report')}
          />
        </div>
      </div>

      {/* Security Tip */}
      <div className="px-6 mt-5 pb-6 h-[108px]">
        <div className="bg-surfaceVariant/30 p-5 flex gap-4 items-start border border-black/5" style={{ borderRadius: '16px' }}>
          <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-primary shadow-sm shrink-0">
            <Info size={20} />
          </div>
          <div>
            <h4 className="font-bold text-sm mb-1">Security Tip</h4>
            <p className="text-xs text-onSurfaceVariant leading-relaxed">
              Always verify the banking name before proceeding with high-value payments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

function ActionButton({ icon, label, onClick, className }: { icon: React.ReactNode, label: string, onClick: () => void, className?: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn("flex flex-col items-center gap-2 group active:scale-95 transition-transform", className)}
    >
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm transition-colors text-primary" style={{ backgroundColor: '#FBFBFB' }}>
        {icon}
      </div>
      <span className="text-xs text-gray-600 text-center" style={{ fontWeight: 'bold' }}>{label}</span>
    </button>
  );
}
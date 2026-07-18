import React, { useState, useEffect } from 'react';
import { Home } from './components/Home';
import { ScanQR } from './components/ScanQR';
import { ScamRadar } from './components/ScamRadar';
import { Learn } from './components/Learn';
import { Report } from './components/Report';
import { DesktopLanding } from './components/DesktopLanding';
import { QrCode, Radar, BookOpen, AlertTriangle, Home as HomeIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Tab = 'home' | 'radar' | 'pay' | 'guide' | 'report';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [isMobile, setIsMobile] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const checkWidth = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkWidth();
    window.addEventListener('resize', checkWidth);
    
    // Keyboard detection via focus
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        setIsKeyboardVisible(true);
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        setIsKeyboardVisible(false);
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    
    return () => {
      window.removeEventListener('resize', checkWidth);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  if (!isMobile) {
    return <DesktopLanding />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <Home onNavigate={(tab) => tab === 'scan' ? setShowScanner(true) : setActiveTab(tab as any)} />;
      case 'radar': return <ScamRadar />;
      case 'guide': return <Learn onBack={() => setActiveTab('home')} />;
      case 'report': return <Report />;
      default: return <Home onNavigate={(tab) => tab === 'scan' ? setShowScanner(true) : setActiveTab(tab as any)} />;
    }
  };

  return (
    <div className="min-h-dvh bg-surface text-onSurface font-sans selection:bg-primary/20 flex flex-col">
      {/* Main Content */}
      <main className={`flex-1 flex flex-col min-h-0 ${activeTab === 'guide' ? 'overflow-hidden' : 'overflow-y-auto no-scrollbar pb-32'}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Full Screen Scanner Overlay */}
      <AnimatePresence>
        {showScanner && (
          <ScanQR onClose={() => setShowScanner(false)} />
        )}
      </AnimatePresence>

      {/* Bottom Navigation - Fixed Style */}
      <AnimatePresence>
        {!isKeyboardVisible && activeTab !== 'guide' && (
          <motion.nav 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 px-2 pt-2 pb-6 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] flex items-end justify-around"
          >
            <NavButton 
              active={activeTab === 'home'} 
              onClick={() => setActiveTab('home')} 
              icon={<HomeIcon />} 
              label="Home"
            />
            <NavButton 
              active={activeTab === 'radar'} 
              onClick={() => setActiveTab('radar')} 
              icon={<Radar />} 
              label="Radar"
            />
            
            <NavButton 
              active={false} 
              onClick={() => setShowScanner(true)} 
              icon={<QrCode size={28} />} 
              label="Pay"
              isCenter
            />
    
            <NavButton 
              active={activeTab === 'guide'} 
              onClick={() => setActiveTab('guide')} 
              icon={<BookOpen />} 
              label="Guide"
            />
            <NavButton 
              active={activeTab === 'report'} 
              onClick={() => setActiveTab('report')} 
              icon={<AlertTriangle />} 
              label="Report"
            />
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavButton({ 
  active, 
  onClick, 
  icon, 
  label,
  isCenter = false
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode;
  label: string;
  isCenter?: boolean;
}) {
  if (isCenter) {
    return (
      <button 
        onClick={onClick}
        className="flex flex-col items-center justify-center -mt-8 mb-1"
      >
        <div className="w-16 h-16 bg-primary hover:bg-primaryHover rounded-full flex items-center justify-center text-onPrimary shadow-lg active:scale-90 transition-all mb-1">
          {icon}
        </div>
        <span className="text-[10px] font-bold text-onSurface">{label}</span>
      </button>
    );
  }

  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center py-2 px-1 min-w-[64px] transition-all`}
    >
      <div className={`mb-1 p-1 rounded-xl transition-all ${active ? 'bg-primaryContainer text-primary' : 'text-gray-400'}`}>
        {React.cloneElement(icon as React.ReactElement, { size: 22 })}
      </div>
      <span className={`text-[10px] transition-all ${active ? 'font-bold text-primary' : 'font-medium text-gray-400'}`}>
        {label}
      </span>
    </button>
  );
}

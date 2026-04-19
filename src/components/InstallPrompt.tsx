import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X } from 'lucide-react';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    const checkIsInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      if (isStandalone) {
        setIsInstalled(true);
      }
    };
    
    checkIsInstalled();

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isInstalled && !sessionStorage.getItem('pwa_dismissed')) {
        setIsVisible(true);
      }
    };

    // Fallback: Show prompt after 3 seconds if not installed and not dismissed, 
    // even if beforeinstallprompt didn't fire (some browsers/environments)
    const timer = setTimeout(() => {
      if (!isInstalled && !sessionStorage.getItem('pwa_dismissed') && !isVisible) {
        setIsVisible(true);
      }
    }, 3000);

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsVisible(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, [isInstalled, isVisible]);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Fallback for iOS or browsers that don't support beforeinstallprompt
      alert('To install: Tap the "Share" button in your browser and select "Add to Home Screen" 📲');
      setIsVisible(false);
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('pwa_dismissed', 'true');
  };

  if (isInstalled || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-24 left-4 right-4 z-[9999] bg-white rounded-3xl shadow-2xl p-5 border-4 border-blue-100 flex items-center gap-4"
      >
        <div className="bg-blue-500 w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0">
          <Download size={24} />
        </div>
        <div className="flex-1">
          <h3 className="font-black text-blue-600 text-sm leading-tight">Install Learning Games</h3>
          <p className="text-gray-500 text-[10px] font-bold">Play offline and access faster!</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleInstall}
            className="bg-blue-500 text-white px-4 py-2 rounded-xl text-[10px] font-black shadow-[0_4px_0_rgb(37,99,235)] active:translate-y-1 transition-all"
          >
            INSTALL
          </button>
          <button
            onClick={handleDismiss}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}


import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X, Sprout, ShieldCheck } from 'lucide-react';

const InstallPrompt = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // 1. Check if already installed (Standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) return;

    // 2. Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 3. Handle Android/Desktop "beforeinstallprompt"
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault(); // Prevent immediate mini-infobar
      setDeferredPrompt(e);
      // Show prompt after a small delay for better UX
      setTimeout(() => setIsVisible(true), 3000);
    };

    // If iOS, show after delay (since there is no event to catch)
    if (isIosDevice) {
        // Check if we haven't dismissed it recently (optional localStorage logic could go here)
        setTimeout(() => setIsVisible(true), 3000);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[100] animate-slide-up md:left-1/2 md:-translate-x-1/2 md:max-w-sm">
      <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-white/20 dark:border-neutral-700 shadow-2xl rounded-[1.5rem] p-4 relative overflow-hidden">
        
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-agro-green/10 rounded-bl-[4rem] -z-10"></div>

        <button 
          onClick={handleDismiss} 
          className="absolute top-3 right-3 p-1 bg-gray-100 dark:bg-neutral-800 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-agro-green to-green-700 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
            <Sprout size={28} />
          </div>
          
          <div className="flex-1 pr-6">
            <h3 className="font-black text-gray-900 dark:text-white text-base leading-tight">Instalar OrivaSmart</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium leading-relaxed">
              Aceda mais rápido, receba alertas e use offline.
            </p>

            {isIOS ? (
              /* Instruções iOS */
              <div className="mt-3 bg-gray-50 dark:bg-neutral-800 p-3 rounded-xl border border-gray-100 dark:border-neutral-700">
                <p className="text-[10px] text-gray-600 dark:text-gray-300 flex flex-wrap items-center gap-1 font-bold leading-5">
                  1. Toque em <Share size={12} className="text-blue-500" /> Partilhar<br/>
                  2. Selecione <PlusSquare size={12} className="text-gray-500 dark:text-gray-400" /> Ecrã Principal
                </p>
              </div>
            ) : (
              /* Botão Android/Desktop */
              <button 
                onClick={handleInstallClick}
                className="mt-3 w-full py-2.5 bg-agro-green hover:bg-green-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-agro-green/30 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Download size={16} />
                Instalar App
              </button>
            )}
          </div>
        </div>
        
        {!isIOS && (
            <div className="mt-3 flex items-center gap-2 justify-center opacity-60">
                <ShieldCheck size={10} className="text-gray-400"/>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Verificado • Seguro • PWA</span>
            </div>
        )}
      </div>
    </div>
  );
};

export default InstallPrompt;
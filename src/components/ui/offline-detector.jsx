import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OfflineDetector() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowNotification(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial status
    if (!navigator.onLine) {
      setShowNotification(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {showNotification && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] pointer-events-none"
        >
          <div
            className={`
              px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-lg border
              ${isOnline 
                ? 'bg-[#2BA84A]/90 border-[#2BA84A]/30 text-white' 
                : 'bg-[#DC2626]/90 border-[#DC2626]/30 text-white'
              }
            `}
          >
            <div className="flex items-center gap-3">
              {isOnline ? (
                <Wifi className="w-5 h-5" />
              ) : (
                <WifiOff className="w-5 h-5" />
              )}
              <span className="font-semibold text-[14px]">
                {isOnline ? 'Tillbaka online!' : 'Ingen internetanslutning'}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Persistent offline banner at bottom for mobile */}
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-20 lg:bottom-4 left-0 right-0 z-[150] px-4"
        >
          <div className="max-w-md mx-auto bg-[#DC2626] text-white px-4 py-3 rounded-2xl shadow-2xl border border-[#DC2626]/30">
            <div className="flex items-center gap-3">
              <WifiOff className="w-5 h-5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[14px] leading-[20px]">Du är offline</p>
                <p className="text-[12px] leading-[16px] text-white/80">
                  Vissa funktioner kan vara begränsade
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
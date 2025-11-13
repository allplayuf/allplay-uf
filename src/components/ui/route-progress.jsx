import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Check if user prefers reduced motion
const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export function RouteProgress() {
  const location = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const reducedMotion = prefersReducedMotion();

  useEffect(() => {
    // Start progress when route changes
    setIsNavigating(true);
    setProgress(0);

    // Simulate progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 100);

    // Complete after a short delay
    const timeout = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsNavigating(false);
      }, 200);
    }, 300);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [location.pathname]);

  if (!isNavigating || reducedMotion) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-[#2BA84A] origin-left"
      initial={{ scaleX: 0 }}
      animate={{ scaleX: progress / 100 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      style={{ transformOrigin: 'left' }}
    />
  );
}

export function LoadingOverlay({ isLoading }) {
  const reducedMotion = prefersReducedMotion();

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.2 }}
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-[#0F1513]/80 backdrop-blur-sm"
          style={{
            // Ensure it's always centered and doesn't shift
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
            className="flex flex-col items-center gap-4"
          >
            {/* Logo */}
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden bg-transparent">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68dbdc9e123473250628e807/8501d9a99_upscalemedia-transformed.png" 
                alt="AllPlay UF Logo" 
                className="w-full h-full object-contain"
                loading="eager"
              />
            </div>
            
            {/* Spinner */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ 
                duration: reducedMotion ? 0 : 1, 
                repeat: Infinity, 
                ease: "linear" 
              }}
            >
              <div className="w-8 h-8 border-3 border-[#2BA84A] border-t-transparent rounded-full" />
            </motion.div>
            
            <p className="text-sm text-[#B6C2BC] font-medium">Laddar...</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
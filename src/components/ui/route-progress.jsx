import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { prefersReducedMotion } from '../utils/motionTokens';

export function RouteProgress() {
  const location = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    setIsNavigating(true);
    const timeout = setTimeout(() => setIsNavigating(false), 250);
    return () => clearTimeout(timeout);
  }, [location.pathname]);

  if (prefersReducedMotion()) return null;

  return (
    <AnimatePresence>
      {isNavigating && (
        <motion.div
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: 1, opacity: 1 }}
          exit={{ scaleX: 1, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
          className="fixed top-0 left-0 right-0 h-[2px] bg-[#2BA84A] z-[9999] origin-left"
        />
      )}
    </AnimatePresence>
  );
}
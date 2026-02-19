/**
 * PageTransition
 * 
 * Lightweight wrapper — no motion.div, no AnimatePresence.
 * This prevents scroll-container re-mount on every route change.
 * The old approach (keyed motion.div) destroyed scroll position 
 * and caused scroll "jumps" on mobile.
 */

import React from 'react';

export function PageTransition({ children }) {
  return (
    <div className="w-full">
      {children}
    </div>
  );
}
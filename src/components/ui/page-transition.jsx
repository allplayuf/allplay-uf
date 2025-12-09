import React from 'react';
import { motion } from 'framer-motion';
import { VARIANTS } from '../utils/motionTokens';

export function PageTransition({ children, pageKey }) {
  return (
    <motion.div
      key={pageKey}
      initial={{ opacity: 0, y: 8, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.99 }}
      transition={{ 
        duration: 0.25, 
        ease: [0.32, 0.72, 0, 1] // iOS-like ease
      }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
}
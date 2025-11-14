import React from 'react';
import { motion } from 'framer-motion';

export function PageTransition({ children, pageKey }) {
  return (
    <motion.div
      key={pageKey}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
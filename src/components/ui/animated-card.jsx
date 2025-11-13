import React from 'react';
import { motion } from 'framer-motion';
import { DURATIONS, EASINGS } from '@/components/utils/motionTokens';

export const AnimatedCard = ({ 
  children, 
  delay = 0,
  className = '',
  hover = true,
  ...props 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: DURATIONS.base / 1000, 
        delay: delay / 1000,
        ease: EASINGS.enter 
      }}
      whileHover={hover ? { 
        scale: 1.02,
        boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
        transition: { duration: DURATIONS.fast / 1000 }
      } : {}}
      className={`
        bg-[#121715] border border-[#223029] 
        shadow-[0_6px_18px_rgba(0,0,0,0.22)] 
        rounded-[16px] 
        transition-shadow duration-${DURATIONS.base}
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedCard;
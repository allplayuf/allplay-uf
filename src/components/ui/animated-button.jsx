import React from 'react';
import { motion } from 'framer-motion';
import { DURATIONS, EASINGS, triggerHaptic } from '@/components/utils/motionTokens';

export const AnimatedButton = React.forwardRef(({ 
  children, 
  onClick, 
  variant = 'default',
  haptic = 'light',
  className = '',
  disabled = false,
  ...props 
}, ref) => {
  const [isPressed, setIsPressed] = React.useState(false);

  const handleClick = (e) => {
    if (disabled) return;
    
    triggerHaptic(haptic);
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), DURATIONS.fast);
    
    if (onClick) {
      onClick(e);
    }
  };

  const variants = {
    default: 'bg-[#2BA84A]/16 hover:bg-[#2BA84A]/24 text-[#EAF6EE] ring-1 ring-[#2BA84A]/30',
    primary: 'bg-[#2BA84A] hover:bg-[#248232] text-[#FFFFFF]',
    secondary: 'bg-[#18221E] hover:bg-[#223029] text-[#F4F7F5] border border-[#223029]',
    danger: 'bg-[#DC2626]/20 hover:bg-[#DC2626]/30 text-[#FCA5A5] ring-1 ring-[#DC2626]/30'
  };

  return (
    <motion.button
      ref={ref}
      onClick={handleClick}
      disabled={disabled}
      className={`
        relative inline-flex items-center justify-center gap-2 
        px-6 h-12 rounded-[14px] font-semibold text-sm
        transition-all duration-${DURATIONS.fast}
        ${variants[variant]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      whileTap={disabled ? {} : { scale: 0.98 }}
      whileHover={disabled ? {} : { scale: 1.02 }}
      animate={isPressed ? {
        scale: [1, 0.96, 1.02, 1],
        transition: { duration: DURATIONS.base / 1000, ease: EASINGS.rubber }
      } : {}}
      {...props}
    >
      {children}
    </motion.button>
  );
});

AnimatedButton.displayName = 'AnimatedButton';
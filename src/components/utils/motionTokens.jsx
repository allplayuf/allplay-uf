// 🎨 MOTION DESIGN SYSTEM FOR ALLPLAY
// Inspired by Duolingo's delightful interactions and modern app feel

export const DURATIONS = {
  instant: 60,
  fast: 120,
  base: 200,
  snappy: 300,
  gentle: 400,
  delight: 650,
  slow: 900
};

export const EASINGS = {
  standard: [0.4, 0.0, 0.2, 1],
  enter: [0.0, 0.0, 0.2, 1],
  exit: [0.4, 0.0, 1, 1],
  rubber: [0.2, 0.8, 0.2, 1.2],
  bounce: [0.68, -0.55, 0.265, 1.55],
  smooth: [0.4, 0.0, 0.6, 1],
  ios: [0.32, 0.72, 0, 1]
};

export const VARIANTS = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.05,
        when: "beforeChildren"
      }
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.1 }
    }
  },
  item: {
    hidden: { opacity: 0, y: 15, scale: 0.98 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        duration: 0.4, 
        ease: EASINGS.ios 
      }
    }
  },
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.3, ease: EASINGS.standard }
    }
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.3, ease: EASINGS.rubber }
    }
  }
};

export const getMotionProps = (variant = 'item') => {
  return VARIANTS[variant] || VARIANTS.item;
};

// Haptic feedback utility
export const triggerHaptic = (type = 'light') => {
  if (typeof window === 'undefined' || !window.navigator.vibrate) return;
  
  const patterns = {
    light: 10,
    medium: 20,
    heavy: 30,
    success: [10, 50, 10],
    error: [20, 100, 20]
  };
  
  window.navigator.vibrate(patterns[type] || patterns.light);
};

// Sound utility (placeholder - can be enhanced with actual sounds)
export const playSound = (type = 'click') => {
  // Placeholder for future sound implementation
  // Can use Web Audio API or HTML5 Audio
};
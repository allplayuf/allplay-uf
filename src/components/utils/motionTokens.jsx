// 🎨 MOTION DESIGN SYSTEM FOR ALLPLAY
// Inspired by Duolingo's delightful interactions

export const DURATIONS = {
  instant: 60,
  fast: 120,
  base: 200,
  snappy: 280,
  gentle: 400,
  delight: 650,
  slow: 900
};

export const EASINGS = {
  standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  enter: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
  exit: 'cubic-bezier(0.4, 0.0, 1, 1)',
  rubber: 'cubic-bezier(0.2, 0.8, 0.2, 1.2)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  smooth: 'cubic-bezier(0.4, 0.0, 0.6, 1)'
};

export const SPRING_CONFIGS = {
  gentle: { tension: 120, friction: 14 },
  snappy: { tension: 180, friction: 12 },
  bouncy: { tension: 300, friction: 10 }
};

// Haptic feedback (for mobile devices)
export const triggerHaptic = (type = 'light') => {
  if (typeof window !== 'undefined' && window.navigator?.vibrate) {
    const patterns = {
      light: [10],
      rigid: [20],
      success: [10, 30, 10],
      error: [50, 50, 50]
    };
    window.navigator.vibrate(patterns[type] || patterns.light);
  }
};

// Sound effects (placeholder - requires audio files)
export const playSound = (type = 'pop') => {
  // TODO: Implement with actual audio files
  console.log(`🔊 Playing sound: ${type}`);
};

export const ELEVATION_SHADOWS = {
  0: 'none',
  1: '0 2px 4px rgba(0,0,0,0.1)',
  2: '0 4px 8px rgba(0,0,0,0.15)',
  3: '0 8px 16px rgba(0,0,0,0.2)',
  4: '0 12px 24px rgba(0,0,0,0.25)'
};

export const getMotionProps = (animation = 'fadeIn', duration = DURATIONS.base) => {
  const animations = {
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: duration / 1000, ease: EASINGS.enter }
    },
    slideUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: duration / 1000, ease: EASINGS.enter }
    },
    scaleIn: {
      initial: { opacity: 0, scale: 0.9 },
      animate: { opacity: 1, scale: 1 },
      transition: { duration: duration / 1000, ease: EASINGS.rubber }
    },
    bounce: {
      initial: { scale: 1 },
      animate: { scale: [1, 1.05, 0.98, 1] },
      transition: { duration: duration / 1000 }
    }
  };
  
  return animations[animation] || animations.fadeIn;
};
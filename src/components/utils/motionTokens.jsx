/**
 * ALLPLAY MOTION DESIGN SYSTEM
 * 
 * Single source of truth for all animations.
 * Four transition types:
 *   A) TAB    – crossfade, minimal movement (tab switches)
 *   B) PUSH   – slide in from right (list → detail)
 *   C) POP    – slide out to right (detail → back)
 *   D) MODAL  – slide up + dim (overlays)
 * 
 * All respect prefers-reduced-motion.
 */

// ── Durations (ms) ──────────────────────────────────────────
export const DURATIONS = {
  instant: 60,
  fast: 120,
  base: 200,
  snappy: 250,
  gentle: 350,
  modal: 300,
  slow: 500,
};

// ── Easings (cubic-bezier arrays for framer-motion) ─────────
export const EASINGS = {
  standard: [0.4, 0.0, 0.2, 1],
  enter: [0.0, 0.0, 0.2, 1],
  exit: [0.4, 0.0, 1, 1],
  ios: [0.32, 0.72, 0, 1],
  spring: [0.22, 1, 0.36, 1],
  modal: [0.16, 1, 0.3, 1],
};

// ── Transition presets (used as framer-motion `transition` prop) ─
export const TRANSITIONS = {
  tab: {
    duration: DURATIONS.base / 1000,
    ease: EASINGS.ios,
  },
  push: {
    duration: DURATIONS.snappy / 1000,
    ease: EASINGS.spring,
  },
  pop: {
    duration: DURATIONS.base / 1000,
    ease: EASINGS.exit,
  },
  modal: {
    duration: DURATIONS.modal / 1000,
    ease: EASINGS.modal,
  },
  fade: {
    duration: DURATIONS.fast / 1000,
    ease: EASINGS.standard,
  },
};

// ── Page transition variants ────────────────────────────────
// TAB switch: subtle crossfade with tiny vertical shift
export const TAB_VARIANTS = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

// PUSH to detail: slide in from right
export const PUSH_VARIANTS = {
  initial: { opacity: 0, x: 60 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

// POP back: slide out to right
export const POP_VARIANTS = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 60 },
};

// MODAL: slide up from bottom
export const MODAL_VARIANTS = {
  overlay: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  content: {
    initial: { opacity: 0, y: 60, scale: 0.97 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 40, scale: 0.97 },
  },
};

// Stagger container for lists
export const VARIANTS = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
        delayChildren: 0.02,
        when: "beforeChildren",
      },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.08 },
    },
  },
  item: {
    hidden: { opacity: 0, y: 12, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: EASINGS.ios,
      },
    },
  },
  fadeIn: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.25, ease: EASINGS.standard },
    },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.92 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.25, ease: EASINGS.enter },
    },
  },
};

export const getMotionProps = (variant = 'item') => {
  return VARIANTS[variant] || VARIANTS.item;
};

// ── Reduced motion helper ───────────────────────────────────
let _prefersReduced = null;
export function prefersReducedMotion() {
  if (_prefersReduced === null) {
    _prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  }
  return _prefersReduced;
}

/**
 * Returns variants that collapse to instant opacity if user prefers reduced motion.
 */
export function safeVariants(variants) {
  if (prefersReducedMotion()) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    };
  }
  return variants;
}

/**
 * Returns transition that is instant if reduced motion preferred.
 */
export function safeTransition(transition) {
  if (prefersReducedMotion()) {
    return { duration: 0 };
  }
  return transition;
}

// ── Haptic feedback ─────────────────────────────────────────
// Uses native Capacitor Haptics on iOS (works in WKWebView).
// Falls back to Web Vibration API on Android/PWA (not supported on iOS Safari).
export const triggerHaptic = async (type = 'light') => {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (Capacitor.isNativePlatform()) {
      const { Haptics, ImpactStyle, NotificationType } = await import('@capacitor/haptics');
      if (type === 'success') {
        await Haptics.notification({ type: NotificationType.Success });
      } else if (type === 'error') {
        await Haptics.notification({ type: NotificationType.Error });
      } else {
        const styleMap = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy };
        await Haptics.impact({ style: styleMap[type] ?? ImpactStyle.Light });
      }
      return;
    }
  } catch (_) {}
  if (typeof window !== 'undefined' && window.navigator?.vibrate) {
    const patterns = { light: 10, medium: 20, heavy: 30, success: [10, 50, 10], error: [20, 100, 20] };
    window.navigator.vibrate(patterns[type] ?? patterns.light);
  }
};

export const playSound = (type = 'click') => {
  // Placeholder for future sound implementation
};
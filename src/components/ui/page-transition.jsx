/**
 * PageTransition
 * 
 * Wraps page content with direction-aware animations:
 *  - tab:  subtle crossfade + tiny slide
 *  - push: slide from right
 *  - pop:  slide from left (mirror of push)
 * 
 * Holds previous page briefly for smooth crossfade (no white flash).
 * Respects prefers-reduced-motion.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigation } from '../navigation/NavigationProvider';
import {
  TAB_VARIANTS,
  PUSH_VARIANTS,
  POP_VARIANTS,
  TRANSITIONS,
  safeVariants,
  safeTransition,
} from '../utils/motionTokens';

const DIRECTION_CONFIG = {
  tab: { variants: TAB_VARIANTS, transition: TRANSITIONS.tab },
  push: { variants: PUSH_VARIANTS, transition: TRANSITIONS.push },
  pop: { variants: POP_VARIANTS, transition: TRANSITIONS.pop },
};

export function PageTransition({ children, pageKey }) {
  const { direction } = useNavigation();
  const config = DIRECTION_CONFIG[direction] || DIRECTION_CONFIG.tab;
  const variants = safeVariants(config.variants);
  const transition = safeTransition(config.transition);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pageKey}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        transition={transition}
        className="w-full h-full will-change-transform"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
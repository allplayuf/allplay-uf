/**
 * PageTransition
 * 
 * Wraps page content with direction-aware animations:
 *  - tab:  subtle crossfade
 *  - push: slide from right
 *  - pop:  slide from left (mirror of push)
 * 
 * Respects prefers-reduced-motion.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useNavigation } from '../navigation/NavigationProvider';
import { createPageUrl } from '@/utils';
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

// Map page should never animate — it contains a Leaflet map that loses state on remount
const MAP_PATH = createPageUrl('Map');

export function PageTransition({ children, pageKey }) {
  const { direction } = useNavigation();

  // Skip animation entirely for the Map page so the map stays mounted in place
  const isMapPage = pageKey === MAP_PATH;

  if (isMapPage) {
    return (
      <div key={pageKey} className="w-full h-full">
        {children}
      </div>
    );
  }

  const config = DIRECTION_CONFIG[direction] || DIRECTION_CONFIG.tab;
  const variants = safeVariants(config.variants);
  const transition = safeTransition(config.transition);

  return (
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
  );
}
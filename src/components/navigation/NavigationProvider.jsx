/**
 * NavigationProvider
 * 
 * Tracks navigation direction (push/pop/tab) and persists scroll positions.
 * Provides context for PageTransition to pick the right animation.
 */

import React, { createContext, useContext, useEffect, useRef, useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

// The five root tab pages
const TAB_PAGES = ['Dashboard', 'Map', 'Matches', 'Community', 'Profile'];
const TAB_PATHS = new Set(TAB_PAGES.map(p => createPageUrl(p)));

const NavigationContext = createContext({
  direction: 'tab',        // 'tab' | 'push' | 'pop'
  scrollPositions: {},
});

export function useNavigation() {
  return useContext(NavigationContext);
}

export function NavigationProvider({ children, mainContentRef }) {
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);
  const [direction, setDirection] = useState('tab');
  const scrollPositionsRef = useRef({});

  // Save scroll position before navigating away
  const saveScroll = useCallback(() => {
    const el = mainContentRef?.current;
    if (el && prevPathRef.current) {
      scrollPositionsRef.current[prevPathRef.current] = el.scrollTop;
    }
  }, [mainContentRef]);

  // Restore scroll position after navigating
  const restoreScroll = useCallback((pathname) => {
    const el = mainContentRef?.current;
    if (!el) return;

    const saved = scrollPositionsRef.current[pathname];
    // Use rAF to ensure DOM has rendered — only restore if we have a saved position
    // Do NOT force scrollTop = 0 on new pages — that causes "jump" on mobile
    if (saved !== undefined && saved > 0) {
      requestAnimationFrame(() => {
        el.scrollTop = saved;
      });
    }
  }, [mainContentRef]);

  useEffect(() => {
    const prev = prevPathRef.current;
    const curr = location.pathname;

    if (prev === curr) return;

    // Save scroll of the page we're leaving
    saveScroll();

    // Determine direction
    const prevIsTab = TAB_PATHS.has(prev);
    const currIsTab = TAB_PATHS.has(curr);

    if (prevIsTab && currIsTab) {
      // Switching between root tabs
      setDirection('tab');
    } else if (currIsTab && !prevIsTab) {
      // Going back from a detail page to a tab
      setDirection('pop');
    } else if (!currIsTab && prevIsTab) {
      // Pushing to a detail/sub page
      setDirection('push');
    } else {
      // Sub-page to sub-page (treat as push)
      setDirection('push');
    }

    prevPathRef.current = curr;

    // Restore scroll for the new page (if we've been there before)
    restoreScroll(curr);
  }, [location.pathname, saveScroll, restoreScroll]);

  // Listen for popstate (browser back) to force 'pop' direction
  useEffect(() => {
    const handler = () => {
      setDirection('pop');
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  return (
    <NavigationContext.Provider value={{
      direction,
      scrollPositions: scrollPositionsRef.current,
    }}>
      {children}
    </NavigationContext.Provider>
  );
}
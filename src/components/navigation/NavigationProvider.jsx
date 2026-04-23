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

  // Restore scroll position after navigating.
  // RULE: when switching between tabs OR entering a new page we don't know,
  // ALWAYS start at the top. Only restore when user navigates back (pop).
  const restoreScroll = useCallback((pathname, dir) => {
    const el = mainContentRef?.current;
    if (!el) return;

    const saved = scrollPositionsRef.current[pathname];

    requestAnimationFrame(() => {
      if (dir === 'pop' && saved !== undefined && saved > 0) {
        el.scrollTop = saved;
      } else {
        // Tab switch or push → top
        el.scrollTop = 0;
      }
    });
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

    let nextDir = 'tab';
    if (prevIsTab && currIsTab) {
      nextDir = 'tab';
    } else if (currIsTab && !prevIsTab) {
      nextDir = 'pop';
    } else if (!currIsTab && prevIsTab) {
      nextDir = 'push';
    } else {
      nextDir = 'push';
    }
    setDirection(nextDir);

    prevPathRef.current = curr;

    // Restore scroll for the new page (only on 'pop'; tab/push → top)
    restoreScroll(curr, nextDir);
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
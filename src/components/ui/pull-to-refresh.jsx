import React, { useRef, useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

/**
 * Pull-to-Refresh Component
 * 
 * IMPORTANT: This is a PASS-THROUGH wrapper. It does NOT create its own
 * scroll container. The parent layout's main content div is the sole
 * scroll container. PTR only intercepts touch gestures when scrollTop === 0.
 */
export function PullToRefresh({ onRefresh, children, threshold = 80 }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);

  const handleTouchStart = useCallback((e) => {
    // Find the nearest scrollable ancestor
    let el = e.target;
    while (el && el !== document.body) {
      if (el.scrollTop > 0) return; // Already scrolled, don't intercept
      el = el.parentElement;
    }
    touchStartY.current = e.touches[0].clientY;
    isPulling.current = false;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (isRefreshing) return;

    // Check if we're at the top of the scroll container
    let el = e.target;
    while (el && el !== document.body) {
      if (el.scrollTop > 0) {
        // Not at top — let native scroll handle it
        if (isPulling.current) {
          isPulling.current = false;
          setPullDistance(0);
        }
        return;
      }
      el = el.parentElement;
    }

    const currentY = e.touches[0].clientY;
    const distance = currentY - touchStartY.current;

    if (distance > 10) {
      isPulling.current = true;
      const resistanceFactor = Math.min(distance / threshold, 1.5);
      const adjustedDistance = Math.min(distance * (1 - resistanceFactor * 0.4), threshold * 1.2);
      setPullDistance(adjustedDistance);
      e.preventDefault();
    }
  }, [isRefreshing, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh?.();
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
        }, 400);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  const opacity = Math.min(pullDistance / threshold, 1);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      {(pullDistance > 10 || isRefreshing) && (
        <div
          className="flex items-center justify-center pointer-events-none"
          style={{ height: Math.max(pullDistance, isRefreshing ? 60 : 0), overflow: 'hidden', transition: isRefreshing || pullDistance === 0 ? 'height 0.3s ease-out' : 'none' }}
        >
          <div
            className="w-8 h-8 rounded-full bg-[#2BA84A] flex items-center justify-center shadow-lg"
            style={{
              opacity,
              transform: `rotate(${isRefreshing ? 360 : Math.min((pullDistance / threshold) * 180, 180)}deg) scale(${Math.min(pullDistance / threshold, 1)})`,
              transition: isRefreshing ? 'transform 1s linear infinite' : 'none',
              animation: isRefreshing ? 'ptr-spin 1s linear infinite' : 'none',
            }}
          >
            <RefreshCw className="w-5 h-5 text-white" />
          </div>
        </div>
      )}

      {children}

      {isRefreshing && (
        <style>{`@keyframes ptr-spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
      )}
    </div>
  );
}
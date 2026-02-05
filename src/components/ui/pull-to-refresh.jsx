import React, { useRef, useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Pull-to-Refresh Component
 * Mobile-optimized gesture for refreshing data
 */
export function PullToRefresh({ onRefresh, children, threshold = 80 }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let touchStartY = 0;
    let scrollTop = 0;

    const handleTouchStart = (e) => {
      scrollTop = container.scrollTop;
      if (scrollTop === 0) {
        touchStartY = e.touches[0].clientY;
        setStartY(touchStartY);
      }
    };

    const handleTouchMove = (e) => {
      if (isRefreshing || scrollTop > 0) return;

      const currentY = e.touches[0].clientY;
      const distance = currentY - touchStartY;

      if (distance > 0) {
        // Apply resistance curve (slower as you pull further)
        const resistanceFactor = Math.min(distance / threshold, 1.5);
        const adjustedDistance = Math.min(distance * (1 - resistanceFactor * 0.4), threshold * 1.2);
        setPullDistance(adjustedDistance);

        // Prevent default scroll when pulling
        if (distance > 10) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = async () => {
      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        try {
          await onRefresh?.();
        } finally {
          setTimeout(() => {
            setIsRefreshing(false);
            setPullDistance(0);
          }, 500);
        }
      } else {
        setPullDistance(0);
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  const rotation = isRefreshing ? 360 : Math.min((pullDistance / threshold) * 180, 180);
  const opacity = Math.min(pullDistance / threshold, 1);
  const scale = Math.min(pullDistance / threshold, 1);

  return (
    <div ref={containerRef} className="relative h-full overflow-auto">
      {/* Pull indicator */}
      <AnimatePresence>
        {(pullDistance > 10 || isRefreshing) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-0 left-0 right-0 flex items-center justify-center z-50 pointer-events-none"
            style={{ height: Math.max(pullDistance, 60) }}
          >
            <motion.div
              animate={{
                rotate: isRefreshing ? 360 : rotation,
                scale: isRefreshing ? 1 : scale,
              }}
              transition={{
                rotate: { duration: isRefreshing ? 1 : 0, repeat: isRefreshing ? Infinity : 0, ease: 'linear' },
                scale: { duration: 0.2 }
              }}
              className="w-8 h-8 rounded-full bg-[#2BA84A] flex items-center justify-center shadow-lg"
              style={{ opacity }}
            >
              <RefreshCw className="w-5 h-5 text-white" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div style={{ transform: `translateY(${isRefreshing ? 60 : pullDistance}px)`, transition: isRefreshing || pullDistance === 0 ? 'transform 0.3s ease-out' : 'none' }}>
        {children}
      </div>
    </div>
  );
}
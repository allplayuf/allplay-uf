import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { triggerHaptic } from '@/components/utils/motionTokens';

/**
 * Horizontally scrollable, premium segmented tab bar for the Admin panel.
 * - Sticky at top on mobile
 * - Animated pill indicator for active tab
 * - Badge for alert counts (e.g. pending reports)
 */
export default function AdminTabBar({ tabs = [], activeTab, onChange }) {
  const scrollRef = useRef(null);
  const activeRef = useRef(null);

  // Keep the active tab in view when it changes (e.g. when Quick Stats trigger a switch)
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const el = activeRef.current;
      const elLeft = el.offsetLeft;
      const elRight = elLeft + el.offsetWidth;
      const viewLeft = container.scrollLeft;
      const viewRight = viewLeft + container.clientWidth;
      if (elLeft < viewLeft || elRight > viewRight) {
        container.scrollTo({
          left: elLeft - 16,
          behavior: 'smooth',
        });
      }
    }
  }, [activeTab]);

  return (
    <div className="sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-2 bg-[#0F1513]/85 backdrop-blur-md border-b border-[#223029]">
      <div
        ref={scrollRef}
        className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.value;
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              ref={isActive ? activeRef : null}
              onClick={() => {
                triggerHaptic('light');
                onChange(tab.value);
              }}
              className="relative flex-shrink-0 h-10 px-3.5 rounded-xl flex items-center gap-2 text-[13px] font-semibold transition-colors"
              style={{ color: isActive ? '#FFFFFF' : '#9EAAA4' }}
            >
              {isActive && (
                <motion.span
                  layoutId="admin-tab-pill"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  className="absolute inset-0 rounded-xl -z-10"
                  style={{
                    background: `linear-gradient(180deg, ${tab.color}38 0%, ${tab.color}14 100%)`,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px ${tab.color}55`,
                  }}
                  aria-hidden
                />
              )}
              {Icon && <Icon className="w-4 h-4" style={{ color: isActive ? tab.color : undefined }} />}
              <span className="whitespace-nowrap">{tab.label}</span>
              {tab.badge != null && tab.badge > 0 && (
                <span
                  className="text-[10px] font-black tabular-nums min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center"
                  style={{
                    background: isActive ? `${tab.color}30` : '#18221E',
                    color: isActive ? tab.color : '#DC2626',
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
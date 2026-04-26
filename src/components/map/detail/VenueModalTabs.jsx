import React from 'react';
import { motion } from 'framer-motion';
import { triggerHaptic } from '@/components/utils/motionTokens';

export default function VenueModalTabs({ tabs, active, onChange }) {
  return (
    <div
      role="tablist"
      className="relative grid gap-0.5 p-1 bg-[#0F1513] border border-[#243029] rounded-2xl shadow-[inset_0_1px_2px_rgba(0,0,0,0.45)]"
      style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}
    >
      {tabs.map(tab => {
        const isActive = active === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => { triggerHaptic('light'); onChange(tab.id); }}
            className="relative h-10 rounded-xl flex items-center justify-center gap-1.5 text-[12px] font-bold transition-colors z-10"
            style={{ color: isActive ? '#FFFFFF' : '#9EAAA4' }}
          >
            {isActive && (
              <motion.span
                layoutId="venue-modal-tab-pill"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                className="absolute inset-0 rounded-xl -z-10 bg-[#2BA84A]/20 ring-1 ring-[#2BA84A]/40"
                aria-hidden
              />
            )}
            <Icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
            {tab.count != null && tab.count > 0 && (
              <span
                className="text-[10px] font-black tabular-nums min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center"
                style={{
                  background: isActive ? 'rgba(43,168,74,0.3)' : '#18221E',
                  color: isActive ? '#86EFAC' : '#6B7A73',
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
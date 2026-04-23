import React from "react";
import { motion } from "framer-motion";
import { triggerHaptic } from "@/components/utils/motionTokens";

/**
 * Premium segmented tab bar for TeamOverview.
 * Matches the style used on the Matches page for visual consistency.
 */
export default function TeamTabBar({ tabs, activeTab, onChange }) {
  return (
    <div className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-2xl p-2 sm:p-3">
      <div
        role="tablist"
        className={`relative grid gap-0.5 p-1 bg-[#0F1513] border border-[#243029] rounded-2xl shadow-[inset_0_1px_2px_rgba(0,0,0,0.45)]`}
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => { triggerHaptic('light'); onChange(tab.id); }}
              className="relative h-11 sm:h-12 rounded-xl flex items-center justify-center gap-1.5 text-[13px] sm:text-[14px] font-bold transition-colors z-10"
              style={{ color: isActive ? '#FFFFFF' : '#9EAAA4' }}
            >
              {isActive && (
                <motion.span
                  layoutId="team-tab-pill"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  className="absolute inset-0 rounded-xl -z-10"
                  style={{
                    background: `linear-gradient(180deg, ${tab.accent}38 0%, ${tab.accent}14 100%)`,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px ${tab.accent}55`,
                  }}
                  aria-hidden
                />
              )}
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
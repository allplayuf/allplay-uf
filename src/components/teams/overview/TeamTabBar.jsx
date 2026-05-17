import React from "react";
import { motion } from "framer-motion";
import { triggerHaptic } from "@/components/utils/motionTokens";

export default function TeamTabBar({ tabs, activeTab, onChange }) {
  return (
    <div className="bg-[#121715] border border-[#223029] rounded-2xl p-1.5 sm:p-2">
      <div
        role="tablist"
        className="relative grid gap-0.5 p-1 bg-[#0F1513] border border-[#243029] rounded-xl shadow-[inset_0_1px_2px_rgba(0,0,0,0.45)]"
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
              className="relative h-10 sm:h-11 rounded-xl flex items-center justify-center gap-1 sm:gap-1.5 text-[11px] sm:text-[13px] font-bold transition-colors z-10 select-none"
              style={{ color: isActive ? '#FFFFFF' : '#9EAAA4' }}
            >
              {isActive && (
                <motion.span
                  layoutId="team-tab-pill"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  className="absolute inset-0 rounded-xl -z-10"
                  style={{
                    background: `linear-gradient(180deg, ${tab.accent}38 0%, ${tab.accent}14 100%)`,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px ${tab.accent}55`,
                  }}
                  aria-hidden
                />
              )}
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="truncate text-[10px] sm:text-[12px] lg:text-[13px]">{tab.label}</span>
              {tab.badge > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-[#F59E0B] text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 leading-none">
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

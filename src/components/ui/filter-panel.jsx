import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, ChevronDown } from "lucide-react";

/**
 * Premium filter panel — floating glass container that replaces the
 * plain-boxy filter UI in Matches / Map / Community.
 *
 * Designed to be used as a drop-in wrapper around existing select/label pairs.
 */
export function FilterPanel({ open, onToggle, children, summary, activeCount = 0 }) {
  return (
    <div className="relative">
      {/* Toggle button — looks like a pill */}
      <motion.button
        onClick={onToggle}
        whileTap={{ scale: 0.98 }}
        className="w-full flex items-center justify-between gap-3 px-4 h-12 rounded-2xl border border-white/5 bg-white/[0.03] backdrop-blur-xl text-[#F5F8F6] hover:bg-white/[0.06] transition-colors"
        style={{
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.04), 0 6px 20px rgba(0,0,0,0.32)",
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#2BA84A]/15 ring-1 ring-[#2BA84A]/30 flex items-center justify-center flex-shrink-0">
            <SlidersHorizontal className="w-4 h-4 text-[#34C257]" />
          </div>
          <div className="text-left min-w-0">
            <div className="text-[13px] font-semibold text-[#F5F8F6] truncate">
              Filtrera & sortera
            </div>
            {summary && (
              <div className="text-[11px] text-[#8FA097] truncate">{summary}</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#2BA84A] text-white text-[11px] font-bold">
              {activeCount}
            </span>
          )}
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4 text-[#B6C2BC]" />
          </motion.span>
        </div>
      </motion.button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-3 p-4 rounded-2xl border border-white/5 bg-white/[0.03] backdrop-blur-xl"
              style={{
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 24px rgba(0,0,0,0.34)",
              }}
            >
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * FilterField — unified label + control wrapper used inside FilterPanel.
 */
export function FilterField({ label, children }) {
  return (
    <div className="flex-1 min-w-[140px]">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-[#8FA097] mb-1.5 block">
        {label}
      </label>
      {children}
    </div>
  );
}

export default FilterPanel;
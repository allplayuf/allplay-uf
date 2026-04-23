import React from 'react';
import { motion } from 'framer-motion';

/**
 * Premium stat tile for the Admin panel.
 * Tap-to-jump to a tab, animated entrance, subtle glow per accent color.
 */
export default function AdminStatCard({
  label,
  count,
  color = '#2BA84A',
  icon: Icon,
  loading = false,
  active = false,
  onClick,
  index = 0,
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      className={`relative group w-full text-left rounded-2xl p-3 sm:p-4 border transition-colors overflow-hidden ${
        active
          ? 'border-transparent bg-[#141917]'
          : 'border-[#223029] bg-[#121715] hover:border-[#2E3D34]'
      }`}
      style={{
        boxShadow: active
          ? `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px ${color}55, 0 8px 24px ${color}22`
          : 'inset 0 1px 0 rgba(255,255,255,0.03), 0 2px 8px rgba(0,0,0,0.25)',
      }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        className="absolute -top-10 -right-10 w-24 h-24 rounded-full opacity-20 blur-2xl pointer-events-none"
        style={{ background: color }}
      />

      <div className="relative flex items-start gap-3">
        {Icon && (
          <div
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: `${color}22`,
              boxShadow: `inset 0 0 0 1px ${color}44`,
            }}
          >
            <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" style={{ color }} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div
            className="text-[11px] font-semibold uppercase tracking-wider text-[#9EAAA4] truncate"
            title={label}
          >
            {label}
          </div>
          <div
            className="text-2xl sm:text-[26px] font-black tabular-nums leading-tight mt-0.5"
            style={{ color: active ? color : '#F4F7F5' }}
          >
            {loading ? (
              <span className="inline-block w-6 h-5 rounded bg-[#18221E] animate-pulse" />
            ) : (
              count
            )}
          </div>
        </div>
      </div>
    </motion.button>
  );
}
import React from 'react';
import { motion } from 'framer-motion';

export default function AllPlayToggle({ showOtherVenues, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 h-8 px-3 rounded-full text-[11px] font-semibold transition-all border"
      style={{
        background: showOtherVenues ? 'rgba(43,168,74,0.12)' : 'rgba(24,34,30,0.8)',
        borderColor: showOtherVenues ? 'rgba(43,168,74,0.3)' : 'rgba(34,48,41,0.6)',
        color: showOtherVenues ? '#86EFAC' : '#9EAAA4',
      }}
    >
      <div className={`w-7 h-4 rounded-full p-0.5 transition-colors ${showOtherVenues ? 'bg-[#2BA84A]' : 'bg-[#223029]'}`}>
        <motion.div
          className="w-3 h-3 rounded-full bg-white"
          animate={{ x: showOtherVenues ? 12 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </div>
      <span>Övriga planer</span>
    </button>
  );
}
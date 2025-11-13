import React from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { DURATIONS } from '@/components/utils/motionTokens';

export default function StreakDisplay({ streak = 0, compact = false }) {
  if (compact) {
    return (
      <motion.div
        className="flex items-center gap-1 px-3 py-1.5 bg-[#F4743B]/20 rounded-full border border-[#F4743B]/30"
        animate={streak > 0 ? {
          scale: [1, 1.05, 1],
        } : {}}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      >
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          <Flame className="w-4 h-4 text-[#F4743B]" />
        </motion.div>
        <span className="text-sm font-bold text-[#F4743B]">{streak}</span>
      </motion.div>
    );
  }

  return (
    <div className="bg-[#121715] border border-[#223029] rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.15)] text-center">
      <motion.div
        className="relative inline-block"
        animate={streak > 0 ? {
          scale: [1, 1.1, 1],
        } : {}}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      >
        <div className="relative">
          <motion.div
            className="absolute inset-0 bg-[#F4743B]/20 rounded-full blur-xl"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 2,
              repeat: Infinity
            }}
          />
          <div className="relative w-20 h-20 bg-gradient-to-br from-[#F4743B] to-[#F59E0B] rounded-2xl flex items-center justify-center">
            <Flame className="w-10 h-10 text-[#FFFFFF]" />
          </div>
        </div>
      </motion.div>
      
      <div className="mt-4">
        <div className="text-3xl font-bold text-[#F4F7F5] mb-1">{streak}</div>
        <div className="text-sm text-[#B6C2BC]">dagars streak!</div>
      </div>
      
      {streak > 0 && (
        <div className="mt-3 text-xs text-[#F4743B] font-medium">
          🔥 Fortsätt spela för att behålla din streak!
        </div>
      )}
    </div>
  );
}
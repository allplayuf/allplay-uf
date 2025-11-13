import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Zap } from 'lucide-react';
import { DURATIONS, EASINGS } from '@/components/utils/motionTokens';

export default function XPBar({ currentXP = 0, levelXP = 1000, level = 1, compact = false }) {
  const progress = Math.min((currentXP / levelXP) * 100, 100);
  const nextLevel = level + 1;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 px-2 py-1 bg-[#F4743B]/20 rounded-lg">
          <Zap className="w-3 h-3 text-[#F4743B]" />
          <span className="text-xs font-bold text-[#F4743B]">{level}</span>
        </div>
        <div className="flex-1 h-2 bg-[#18221E] rounded-full overflow-hidden border border-[#223029]">
          <motion.div
            className="h-full bg-gradient-to-r from-[#F4743B] to-[#F59E0B]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: DURATIONS.gentle / 1000, ease: EASINGS.enter }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#121715] border border-[#223029] rounded-[16px] p-4 shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-[#F4743B] to-[#F59E0B] rounded-lg flex items-center justify-center">
            <Trophy className="w-4 h-4 text-[#FFFFFF]" />
          </div>
          <div>
            <div className="text-sm font-bold text-[#F4F7F5]">Nivå {level}</div>
            <div className="text-xs text-[#B6C2BC]">{currentXP} / {levelXP} XP</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-[#B6C2BC]">Nästa nivå</div>
          <div className="text-sm font-bold text-[#F4743B]">{nextLevel}</div>
        </div>
      </div>
      
      <div className="relative h-3 bg-[#18221E] rounded-full overflow-hidden border border-[#223029]">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-[#F4743B] to-[#F59E0B]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: DURATIONS.delight / 1000, ease: EASINGS.enter }}
        />
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          animate={{
            x: ['-100%', '200%'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear'
          }}
          style={{ width: '50%' }}
        />
      </div>
    </div>
  );
}
import React from 'react';
import { motion } from 'framer-motion';
import { Check, Trophy, Users, MapPin, Star } from 'lucide-react';
import { AnimatedCard } from '@/components/ui/animated-card';
import { Progress } from '@/components/ui/progress';

const QUEST_ICONS = {
  matches_played: Trophy,
  check_ins: MapPin,
  mvp_votes: Star,
  friends_invited: Users,
  teams_joined: Users
};

export default function QuestCard({ quest, userProgress = null, onClaim }) {
  const Icon = QUEST_ICONS[quest.requirement_type] || Trophy;
  const progress = userProgress?.progress || 0;
  const isCompleted = progress >= quest.requirement_count;
  const isClaimed = userProgress?.claimed || false;
  const progressPercent = Math.min((progress / quest.requirement_count) * 100, 100);

  const questTypeColors = {
    daily: { bg: 'from-[#2BA84A] to-[#248232]', text: 'text-[#CFE8D6]' },
    weekly: { bg: 'from-[#4169E1] to-[#3457C4]', text: 'text-[#A8C5F5]' },
    seasonal: { bg: 'from-[#F4743B] to-[#E5683A]', text: 'text-[#FDE3D2]' }
  };

  const colors = questTypeColors[quest.quest_type] || questTypeColors.daily;

  return (
    <AnimatedCard hover={!isClaimed} className="overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-12 h-12 bg-gradient-to-br ${colors.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
            <Icon className="w-6 h-6 text-[#FFFFFF]" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-[#F4F7F5] text-sm">{quest.title}</h4>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${colors.bg} ${colors.text}`}>
                {quest.quest_type}
              </span>
            </div>
            <p className="text-xs text-[#B6C2BC] mb-3">{quest.description}</p>
            
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#B6C2BC]">
                  {progress} / {quest.requirement_count}
                </span>
                <span className="font-bold text-[#F4743B]">+{quest.xp_reward} XP</span>
              </div>
              <div className="relative h-2 bg-[#18221E] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#2BA84A] to-[#248232]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* Action Button */}
            {isCompleted && !isClaimed && (
              <motion.button
                onClick={() => onClaim(quest, userProgress)}
                className="mt-3 w-full h-9 bg-[#2BA84A] hover:bg-[#248232] text-[#FFFFFF] rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.02 }}
              >
                <Check className="w-4 h-4" />
                Claim Reward
              </motion.button>
            )}

            {isClaimed && (
              <div className="mt-3 flex items-center justify-center gap-2 text-[#7B8A83] text-sm">
                <Check className="w-4 h-4" />
                Claimed
              </div>
            )}
          </div>
        </div>
      </div>
    </AnimatedCard>
  );
}
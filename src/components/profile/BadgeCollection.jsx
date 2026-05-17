import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  Lock,
  Users,
  UserCheck,
  ShieldCheck,
  ThumbsUp,
  UserPlus,
  HeartHandshake,
  Flame,
  Sun,
  Moon,
  Sunrise,
  Globe,
  Zap,
  FlaskConical,
  Send,
  RotateCw,
  CalendarPlus,
  Ticket,
  MessageSquarePlus,
  Trophy,
  Target,
  RefreshCw,
  Sparkles,
  Filter,
  Star,
  TrendingUp,
  CheckCircle2,
  X,
  Info,
  Eye,
  EyeOff,
  ChevronDown
} from "lucide-react";
import { CACHE_STRATEGIES } from "../providers/QueryProvider";
import { useT } from "@/i18n/LanguageProvider";

const TIER_CONFIG = {
  bronze:  { color: "#CD7F32", nameKey: 'badge.tier.bronze',   gradient: "from-[#CD7F32] to-[#8B5A2B]", glow: "shadow-[0_0_20px_rgba(205,127,50,0.4)]",   ring: "ring-[#CD7F32]/30" },
  silver:  { color: "#C0C0C0", nameKey: 'badge.tier.silver',   gradient: "from-[#C0C0C0] to-[#808080]", glow: "shadow-[0_0_20px_rgba(192,192,192,0.4)]", ring: "ring-[#C0C0C0]/30" },
  gold:    { color: "#FFD700", nameKey: 'badge.tier.gold',     gradient: "from-[#FFD700] to-[#FFA500]", glow: "shadow-[0_0_20px_rgba(255,215,0,0.5)]",   ring: "ring-[#FFD700]/30" },
  diamond: { color: "#7A4DE8", nameKey: 'badge.tier.diamond',  gradient: "from-[#7A4DE8] to-[#4B0082]", glow: "shadow-[0_0_20px_rgba(122,77,232,0.5)]",  ring: "ring-[#7A4DE8]/30" },
};

const CATEGORY_CONFIG = {
  matches:    { nameKey: 'badge.cat.matches',    icon: Trophy,    color: '#2BA84A', bgColor: 'bg-[#2BA84A]/16', borderColor: 'border-[#2BA84A]/30', textColor: 'text-[#2BA84A]',  hoverBg: 'hover:bg-[#2BA84A]/24' },
  social:     { nameKey: 'badge.cat.social',     icon: Users,     color: '#4169E1', bgColor: 'bg-[#4169E1]/16', borderColor: 'border-[#4169E1]/30', textColor: 'text-[#B0C4DE]',  hoverBg: 'hover:bg-[#4169E1]/24' },
  skill:      { nameKey: 'badge.cat.skill',      icon: Target,    color: '#F4743B', bgColor: 'bg-[#F4743B]/16', borderColor: 'border-[#F4743B]/30', textColor: 'text-[#FDE3D2]',  hoverBg: 'hover:bg-[#F4743B]/24' },
  dedication: { nameKey: 'badge.cat.dedication', icon: Flame,     color: '#DC2626', bgColor: 'bg-[#DC2626]/16', borderColor: 'border-[#DC2626]/30', textColor: 'text-[#FCA5A5]',  hoverBg: 'hover:bg-[#DC2626]/24' },
  special:    { nameKey: 'badge.cat.special',    icon: Sparkles,  color: '#9370DB', bgColor: 'bg-[#9370DB]/16', borderColor: 'border-[#9370DB]/30', textColor: 'text-[#DDD6FE]',  hoverBg: 'hover:bg-[#9370DB]/24' },
};

const ICON_MAP = {
  'match_creator': CalendarPlus,
  'match_player': Users,
  'team_player': UserCheck,
  'reliable': ShieldCheck,
  'mvp_champion': Trophy,
  'streak_master': Flame,
  'weekend_warrior': Sun,
  'night_owl': Moon,
  'early_bird': Sunrise,
  'explorer': Globe,
  'social': Send,
  'team_builder': UserPlus,
  'supporter': MessageSquarePlus,
  'cup_participant': Ticket,
  'recruiter': UserPlus,
  'community_builder': Users,
  'matchmaker_elite': HeartHandshake
};

const ALL_BADGES = [
  { id: 'match_creator', name: 'Matchstartare', description: 'Skapa matcher', category: 'matches', tiers: { bronze: 1, silver: 5, gold: 10, diamond: 25 }, stat: 'created_matches' },
  { id: 'match_player', name: 'Spelstomme', description: 'Delta i matcher', category: 'matches', tiers: { bronze: 10, silver: 50, gold: 100, diamond: 250 }, stat: 'matches_played' },
  { id: 'team_player', name: 'Lagspelare', description: 'Spela med olika personer', category: 'social', tiers: { bronze: 10, silver: 25, gold: 50, diamond: 100 }, stat: 'unique_opponents' },
  { id: 'reliable', name: 'Pålitlig', description: 'Slutför matcher', category: 'dedication', tiers: { bronze: 10, silver: 50, gold: 100, diamond: 250 }, stat: 'completed_matches' },
  { id: 'mvp_champion', name: 'MVP Champion', description: 'Bli MVP', category: 'skill', tiers: { bronze: 5, silver: 15, gold: 30, diamond: 75 }, stat: 'mvp_wins' },
  { id: 'streak_master', name: 'Streak Master', description: 'Spela dagar i rad', category: 'dedication', tiers: { bronze: 3, silver: 7, gold: 14, diamond: 30 }, stat: 'current_streak' },
  { id: 'weekend_warrior', name: 'Weekend Warrior', description: 'Spela på helger', category: 'dedication', tiers: { bronze: 4, silver: 8, gold: 16, diamond: 32 }, stat: 'weekend_matches' },
  { id: 'night_owl', name: 'Nattuggla', description: 'Spela efter 22:00', category: 'special', tiers: { bronze: 5, silver: 10, gold: 25, diamond: 50 }, stat: 'night_matches' },
  { id: 'early_bird', name: 'Early Bird', description: 'Spela före 09:00', category: 'special', tiers: { bronze: 5, silver: 10, gold: 25, diamond: 50 }, stat: 'morning_matches' },
  { id: 'explorer', name: 'Utforskare', description: 'Spela på olika platser', category: 'matches', tiers: { bronze: 3, silver: 5, gold: 10, diamond: 20 }, stat: 'unique_venues' },
  { id: 'social', name: 'Social', description: 'Ha aktiva vänner', category: 'social', tiers: { bronze: 5, silver: 10, gold: 25, diamond: 50 }, stat: 'friends_count' },
  { id: 'team_builder', name: 'Team Builder', description: 'Skapa och hantera lag', category: 'social', tiers: { bronze: 1, silver: 2, gold: 3, diamond: 5 }, stat: 'teams_created' },
  { id: 'supporter', name: 'Supporter', description: 'Ge feedback', category: 'special', tiers: { bronze: 1, silver: 5, gold: 10, diamond: 20 }, stat: 'feedback_count' },
  { id: 'cup_participant', name: 'Turneringsspelare', description: 'Delta i turneringar', category: 'matches', tiers: { bronze: 1, silver: 3, gold: 5, diamond: 10 }, stat: 'cups_participated' },
  { id: 'recruiter', name: 'AllPlay Recruiter', description: 'Bjud in vänner (endast via invites)', category: 'special', tiers: { bronze: 1, silver: 1, gold: 1, diamond: 1 }, stat: 'verified_referrals', isExclusive: true },
  { id: 'community_builder', name: 'Community Builder', description: 'Bygg communityt (endast via invites)', category: 'special', tiers: { bronze: 5, silver: 5, gold: 5, diamond: 5 }, stat: 'verified_referrals', isExclusive: true },
  { id: 'matchmaker_elite', name: 'Matchmaker Elite', description: 'Mästare på invites (endast via invites)', category: 'special', tiers: { bronze: 10, silver: 10, gold: 10, diamond: 10 }, stat: 'verified_referrals', isExclusive: true }
];

const BadgeDetailModal = ({ badge, userValue, earnedTier, onClose }) => {
  const { t } = useT();
  const Icon = ICON_MAP[badge.id] || Award;
  const categoryConfig = CATEGORY_CONFIG[badge.category];
  const tierConfig = earnedTier ? TIER_CONFIG[earnedTier] : null;

  const allTierRequirements = [
    { tier: 'bronze', value: badge.tiers.bronze, emoji: '🥉' },
    { tier: 'silver', value: badge.tiers.silver, emoji: '🥈' },
    { tier: 'gold', value: badge.tiers.gold, emoji: '🥇' },
    { tier: 'diamond', value: badge.tiers.diamond, emoji: '💎' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#121715] border-t sm:border border-[#223029] rounded-t-[24px] sm:rounded-[24px] w-full sm:max-w-md max-h-[85vh] overflow-y-auto"
      >
        {/* Header */}
        <div className={`relative p-6 ${categoryConfig.bgColor} border-b border-[#223029]`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-[#18221E] hover:bg-[#223029] transition-colors"
          >
            <X className="w-5 h-5 text-[#B6C2BC]" />
          </button>

          <div className="flex items-start gap-4 mb-4">
            <div 
              className="w-20 h-20 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#18221E] to-[#0F1513]"
              style={{
                border: earnedTier ? `3px solid ${tierConfig.color}` : '3px solid #223029',
                boxShadow: earnedTier ? `0 0 25px -5px ${tierConfig.color}` : 'none'
              }}
            >
              <Icon 
                className="w-10 h-10" 
                style={{ color: earnedTier ? tierConfig.color : '#7B8A83' }}
                strokeWidth={2.5}
              />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-[#F4F7F5] mb-1">{badge.name}</h3>
              <p className="text-sm text-[#B6C2BC] mb-2">{badge.description}</p>
              <Badge className={`${categoryConfig.bgColor} ${categoryConfig.textColor} border-0`}>
                {t(categoryConfig.nameKey)}
              </Badge>
            </div>
          </div>

          {earnedTier && (
            <div className="flex items-center gap-2 py-2 px-4 rounded-xl bg-[#18221E] border border-[#223029]">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: tierConfig.color }}
              />
              <span className="text-sm font-bold" style={{ color: tierConfig.color }}>
                {t(tierConfig.nameKey).toUpperCase()} {t('badge.unlocked_label')}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Current Progress */}
          <div>
            <h4 className="text-sm font-bold text-[#F4F7F5] mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#2BA84A]" />
              {t('badge.your_progress')}
            </h4>
            <div className="bg-[#18221E] rounded-xl p-4 border border-[#223029]">
              <div className="text-center mb-3">
                <span className="text-3xl font-bold text-[#F4F7F5]">{userValue}</span>
                <span className="text-sm text-[#B6C2BC] ml-2">/{badge.tiers.diamond}</span>
              </div>
              <div className="w-full bg-[#0F1513] rounded-full h-2 overflow-hidden border border-[#223029]">
                <div 
                  className="h-full bg-gradient-to-r from-[#2BA84A] to-[#248232]"
                  style={{ width: `${Math.min((userValue / badge.tiers.diamond) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* All Tiers */}
          <div>
            <h4 className="text-sm font-bold text-[#F4F7F5] mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-[#FFD700]" />
              {t('badge.all_levels')}
            </h4>
            <div className="space-y-2">
              {allTierRequirements.map((req) => {
                const isUnlocked = earnedTier && TIER_CONFIG[earnedTier] && 
                  Object.keys(TIER_CONFIG).indexOf(earnedTier) >= Object.keys(TIER_CONFIG).indexOf(req.tier);
                const config = TIER_CONFIG[req.tier];

                return (
                  <div 
                    key={req.tier}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isUnlocked 
                        ? `bg-gradient-to-r ${config.gradient} bg-opacity-10 border-[${config.color}]/30`
                        : 'bg-[#18221E] border-[#223029]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{req.emoji}</span>
                      <div>
                        <p className={`text-sm font-bold ${isUnlocked ? '' : 'text-[#7B8A83]'}`} style={isUnlocked ? { color: config.color } : {}}>
                          {t(config.nameKey)}
                        </p>
                        <p className="text-xs text-[#B6C2BC]">{t('badge.required', { n: req.value })}</p>
                      </div>
                    </div>
                    {isUnlocked && (
                      <CheckCircle2 className="w-5 h-5 text-[#2BA84A]" strokeWidth={2.5} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Exclusive Badge Notice */}
          {badge.isExclusive && (
            <div className="bg-gradient-to-r from-[#FFD700]/20 to-[#FFA500]/20 rounded-xl p-4 border border-[#FFD700]/30">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FFD700]/30 flex items-center justify-center flex-shrink-0">
                  <Star className="w-4 h-4 text-[#FFD700]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#FFD700] mb-1">{t('badge.exclusive_label')}</p>
                  <p className="text-xs text-[#F4F7F5] leading-relaxed">
                    {t('badge.exclusive_desc')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="bg-[#18221E] rounded-xl p-4 border border-[#223029]">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#4169E1]/20 flex items-center justify-center flex-shrink-0">
                <Info className="w-4 h-4 text-[#4169E1]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#F4F7F5] mb-1">{t('badge.tip_label')}</p>
                <p className="text-xs text-[#B6C2BC] leading-relaxed">
                  {badge.isExclusive && t('badge.tip_exclusive')}
                  {!badge.isExclusive && badge.category === 'matches' && t('badge.tip_matches')}
                  {!badge.isExclusive && badge.category === 'social' && t('badge.tip_social')}
                  {!badge.isExclusive && badge.category === 'skill' && t('badge.tip_skill')}
                  {!badge.isExclusive && badge.category === 'dedication' && t('badge.tip_dedication')}
                  {!badge.isExclusive && badge.category === 'special' && t('badge.tip_special')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const BadgeComponent = ({ badge, userValue, earnedTier, onClick }) => {
  const { t } = useT();
  const Icon = ICON_MAP[badge.id] || Award;
  const categoryConfig = CATEGORY_CONFIG[badge.category];
  
  // Find current and next tier
  let currentTier = earnedTier;
  let nextTier = null;
  let nextTierRequirement = null;
  let progress = 0;

  const tierOrder = ['bronze', 'silver', 'gold', 'diamond'];
  
  if (currentTier) {
    const currentIndex = tierOrder.indexOf(currentTier);
    if (currentIndex < tierOrder.length - 1) {
      nextTier = tierOrder[currentIndex + 1];
      nextTierRequirement = badge.tiers[nextTier];
      const currentTierValue = badge.tiers[currentTier];
      progress = ((userValue - currentTierValue) / (nextTierRequirement - currentTierValue)) * 100;
    } else {
      progress = 100;
    }
  } else {
    nextTierRequirement = badge.tiers.bronze;
    progress = (userValue / nextTierRequirement) * 100;
  }

  const isLocked = !currentTier;
  const tierConfig = currentTier ? TIER_CONFIG[currentTier] : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center text-center p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-[#18221E] to-[#121715] border transition-all duration-300 cursor-pointer ${
        isLocked 
          ? 'border-[#223029] opacity-70' 
          : `border-[${tierConfig.color}]/30 ${tierConfig.glow} hover:border-[${tierConfig.color}]/50`
      }`}
    >
      {/* Category Badge - SMALLER ON MOBILE */}
      <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2">
        <Badge 
          className={`text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 ${categoryConfig.bgColor} ${categoryConfig.textColor} border-0 font-medium`}
        >
          <span className="hidden sm:inline">{t(categoryConfig.nameKey)}</span>
          <categoryConfig.icon className="w-3 h-3 sm:hidden" />
        </Badge>
      </div>

      {/* Exclusive Badge Indicator */}
      {badge.isExclusive && (
        <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2">
          <Badge className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#000000] border-0 font-bold shadow-[0_0_12px_rgba(255,215,0,0.6)]">
            {t('badge.exclusive_chip')}
          </Badge>
        </div>
      )}

      {/* Badge Icon - RESPONSIVE SIZE */}
      <div 
        className="relative w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 flex items-center justify-center rounded-full mb-2 sm:mb-3 transition-all bg-gradient-to-br from-[#18221E] to-[#0F1513]"
        style={{
          border: isLocked ? '2px solid #223029' : `3px solid ${tierConfig.color}`,
          boxShadow: isLocked ? 'none' : `0 0 20px -5px ${tierConfig.color}`
        }}
      >
        <Icon 
          className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 transition-all" 
          style={{ color: isLocked ? '#7B8A83' : tierConfig.color }}
          strokeWidth={2.5}
        />
        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0F1513]/80 rounded-full backdrop-blur-sm">
            <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-[#7B8A83]" strokeWidth={2} />
          </div>
        )}
        {currentTier && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
            className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm sm:text-lg shadow-lg"
            style={{ 
              background: `linear-gradient(135deg, ${tierConfig.color}, ${tierConfig.color}dd)`,
              boxShadow: `0 4px 12px ${tierConfig.color}60`
            }}
          >
            {currentTier === 'bronze' && '🥉'}
            {currentTier === 'silver' && '🥈'}
            {currentTier === 'gold' && '🥇'}
            {currentTier === 'diamond' && '💎'}
          </motion.div>
        )}
      </div>
      
      {/* Badge Info - RESPONSIVE TEXT */}
      <h4 className="font-bold text-[#F4F7F5] text-xs sm:text-sm lg:text-base leading-tight mb-1 px-1">{badge.name}</h4>
      <p className="text-[10px] sm:text-xs text-[#B6C2BC] leading-snug mb-2 sm:mb-3 px-1 line-clamp-2">{badge.description}</p>
      
      {/* Status/Progress - COMPACT ON MOBILE */}
      {isLocked ? (
        <div className="w-full space-y-1.5 sm:space-y-2">
          <div className="w-full bg-[#0F1513] rounded-full h-1.5 sm:h-2.5 overflow-hidden border border-[#223029] shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-[#2BA84A] to-[#248232]"
            />
          </div>
          <p className="text-[10px] sm:text-xs font-semibold text-[#7B8A83]">
            {userValue}/{nextTierRequirement}
          </p>
        </div>
      ) : nextTierRequirement ? (
        <div className="w-full space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-center gap-1 mb-0.5 sm:mb-1">
            <div 
              className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full"
              style={{ backgroundColor: tierConfig.color }}
            />
            <p className="text-[9px] sm:text-xs font-bold tracking-wide" style={{ color: tierConfig.color }}>
              {t(tierConfig.nameKey).toUpperCase()}
            </p>
          </div>
          <div className="w-full bg-[#0F1513] rounded-full h-1.5 sm:h-2.5 overflow-hidden border border-[#223029] shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`h-full bg-gradient-to-r ${tierConfig.gradient}`}
              style={{ boxShadow: `0 0 10px ${tierConfig.color}80` }}
            />
          </div>
          <p className="text-[10px] sm:text-xs font-semibold text-[#7B8A83]">
            {userValue}/{nextTierRequirement}
          </p>
        </div>
      ) : (
        <div className="w-full">
          <div className="flex items-center justify-center gap-1 sm:gap-1.5 mb-1.5 sm:mb-2">
            <div
              className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full"
              style={{ backgroundColor: tierConfig.color }}
            />
            <p className="text-[9px] sm:text-xs font-bold tracking-wide" style={{ color: tierConfig.color }}>
              {t(tierConfig.nameKey).toUpperCase()}
            </p>
          </div>
          <div className={`flex items-center justify-center gap-1.5 sm:gap-2 py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg bg-gradient-to-r ${tierConfig.gradient} bg-opacity-20`}>
            <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-[#2BA84A]" strokeWidth={2.5} />
            <p className="text-[10px] sm:text-xs font-bold text-[#2BA84A]">{t('badge.maxed')}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default function BadgeCollection({ user }) {
  const { t } = useT();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('progress');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [showLockedBadges, setShowLockedBadges] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch badge data with OPTIMIZED caching
  const { data: badgeData, isLoading, refetch } = useQuery({
    queryKey: ['userBadges', user?.id],
    queryFn: async () => {
      const response = await base44.functions.invoke('badges/calculateUserBadges', {
        userId: user.id
      });
      return response.data;
    },
    ...CACHE_STRATEGIES.SEMI_DYNAMIC,
    enabled: !!user,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const stats = badgeData?.stats || {};
  const earnedBadges = badgeData?.badges || [];

  // Filter badges
  let filteredBadges = ALL_BADGES;
  if (selectedCategory !== 'all') {
    filteredBadges = filteredBadges.filter(b => b.category === selectedCategory);
  }
  if (!showLockedBadges) {
    filteredBadges = filteredBadges.filter(b => earnedBadges.find(eb => eb.id === b.id));
  }

  // Sort badges
  filteredBadges = [...filteredBadges].sort((a, b) => {
    const aEarned = earnedBadges.find(eb => eb.id === a.id);
    const bEarned = earnedBadges.find(eb => eb.id === b.id);
    const aValue = stats[a.stat] || 0;
    const bValue = stats[b.stat] || 0;

    if (sortBy === 'progress') {
      if (aEarned && !bEarned) return -1;
      if (!aEarned && bEarned) return 1;
      
      const aProgress = aValue / a.tiers.bronze;
      const bProgress = bValue / b.tiers.bronze;
      return bProgress - aProgress;
    } else if (sortBy === 'rarity') {
      const tierOrder = { diamond: 4, gold: 3, silver: 2, bronze: 1 };
      const aTier = aEarned ? tierOrder[aEarned.tier] : 0;
      const bTier = bEarned ? tierOrder[bEarned.tier] : 0;
      return bTier - aTier;
    }
    return 0;
  });

  const unlockedCount = earnedBadges.length;
  const totalPossible = ALL_BADGES.length * 4;
  const completionPercentage = ((earnedBadges.length / totalPossible) * 100).toFixed(1);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Badge Detail Modal */}
      <AnimatePresence>
        {selectedBadge && (
          <BadgeDetailModal
            badge={selectedBadge}
            userValue={stats[selectedBadge.stat] || 0}
            earnedTier={earnedBadges.find(eb => eb.id === selectedBadge.id)?.tier}
            onClose={() => setSelectedBadge(null)}
          />
        )}
      </AnimatePresence>

      {/* Stats Header - MOBILE OPTIMIZED */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card
          className="relative overflow-hidden border border-white/[0.07] rounded-[22px] sm:rounded-[28px]"
          style={{
            background:
              'radial-gradient(140% 110% at 50% 0%, #0F2A18 0%, #0A1C10 45%, #05100A 100%)',
            boxShadow:
              '0 24px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)'
          }}
        >
          {/* Ambient orb */}
          <div
            aria-hidden
            className="absolute -top-24 -right-20 w-[320px] h-[320px] rounded-full blur-[90px] pointer-events-none opacity-70"
            style={{ background: 'radial-gradient(circle, rgba(52,194,87,0.35) 0%, transparent 70%)' }}
          />
          {/* Top hairline */}
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-px pointer-events-none"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18) 50%, transparent)' }}
          />

          <CardContent className="relative p-5 sm:p-7 z-10">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white/[0.06] ring-1 ring-white/10 flex items-center justify-center flex-shrink-0">
                  <Award className="w-[18px] h-[18px] text-[#86EFAC]" strokeWidth={2.4} />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55 leading-none">
                    {t('badge.collection_label')}
                  </div>
                  <div className="mt-1.5 text-[18px] sm:text-[22px] font-black text-white leading-none tracking-[-0.02em]">
                    <span className="tabular-nums">{unlockedCount}</span>
                    <span className="text-white/50 font-bold"> / {totalPossible}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex-shrink-0 h-9 w-9 sm:w-auto sm:px-3.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] ring-1 ring-white/10 text-white/80 transition-colors flex items-center justify-center gap-1.5 text-[12px] font-semibold"
                aria-label="Uppdatera"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} strokeWidth={2.4} />
                <span className="hidden sm:inline">{t('badge.update')}</span>
              </button>
            </div>

            {/* Progress bar */}
            <div className="space-y-2 mb-5">
              <div className="flex justify-between items-baseline text-[12px] text-white/65">
                <span className="font-medium">{t('badge.total_progress')}</span>
                <span className="font-black text-[#86EFAC] tabular-nums">{completionPercentage}%</span>
              </div>
              <div className="w-full bg-black/45 rounded-full h-2 overflow-hidden ring-1 ring-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercentage}%` }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, #86EFAC 0%, #34C257 55%, #22C55E 100%)',
                    boxShadow: '0 0 14px rgba(52,194,87,0.55)'
                  }}
                />
              </div>
            </div>

            {/* Tier breakdown — compact cards */}
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(TIER_CONFIG).map(([tier, config]) => {
                const count = earnedBadges.filter(b => b.tier === tier).length;
                const emoji = { bronze: '🥉', silver: '🥈', gold: '🥇', diamond: '💎' }[tier];
                return (
                  <motion.div
                    key={tier}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 }}
                    className="relative rounded-xl bg-white/[0.04] ring-1 ring-white/[0.07] p-2.5 text-center"
                  >
                    <div className="text-[16px] leading-none mb-1">{emoji}</div>
                    <div
                      className="text-[17px] sm:text-[20px] font-black tabular-nums leading-none"
                      style={{ color: config.color }}
                    >
                      {count}
                    </div>
                    <div className="mt-1 text-[9px] sm:text-[10px] font-semibold text-white/55 uppercase tracking-wider leading-none">
                      {t(config.nameKey)}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Mobile Filter Toggle */}
      <div className="lg:hidden">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between px-4 py-3 bg-[#18221E] border border-[#223029] rounded-xl text-[#F4F7F5] font-semibold"
        >
          <span className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            {t('badge.filter_toggle')}
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Filters - MOBILE OPTIMIZED */}
      <AnimatePresence>
        {(showFilters || window.innerWidth >= 1024) && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-3 sm:space-y-4"
          >
            {/* Category Filters - HORIZONTAL SCROLL ON MOBILE */}
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-2 sm:pb-0">
              <div className="flex gap-2 min-w-max sm:min-w-0 sm:flex-wrap">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm transition-all whitespace-nowrap ${
                    selectedCategory === 'all'
                      ? 'bg-[#2BA84A] text-white shadow-[0_4px_12px_rgba(43,168,74,0.4)]'
                      : 'bg-[#18221E] text-[#B6C2BC] border border-[#223029] hover:bg-[#223029]'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {t('badge.filter_all')}
                </button>
                {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
                  const CategoryIcon = config.icon;
                  const isActive = selectedCategory === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedCategory(key)}
                      className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm transition-all whitespace-nowrap ${
                        isActive
                          ? `${config.bgColor} ${config.textColor} ring-1 ${config.borderColor}`
                          : 'bg-[#18221E] text-[#B6C2BC] border border-[#223029] hover:bg-[#223029]'
                      }`}
                    >
                      <CategoryIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">{t(config.nameKey)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sort & Toggle Options */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="flex gap-2 flex-1">
                <button
                  onClick={() => setSortBy('progress')}
                  className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm transition-all ${
                    sortBy === 'progress'
                      ? 'bg-[#18221E] text-[#2BA84A] border border-[#2BA84A]/30'
                      : 'bg-[#18221E] text-[#B6C2BC] border border-[#223029] hover:bg-[#223029]'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1.5 sm:mr-2" />
                  {t('badge.sort_progress')}
                </button>
                <button
                  onClick={() => setSortBy('rarity')}
                  className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm transition-all ${
                    sortBy === 'rarity'
                      ? 'bg-[#18221E] text-[#2BA84A] border border-[#2BA84A]/30'
                      : 'bg-[#18221E] text-[#B6C2BC] border border-[#223029] hover:bg-[#223029]'
                  }`}
                >
                  <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1.5 sm:mr-2" />
                  {t('badge.sort_rarity')}
                </button>
              </div>
              <button
                onClick={() => setShowLockedBadges(!showLockedBadges)}
                className={`px-3 sm:px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm transition-all ${
                  showLockedBadges
                    ? 'bg-[#18221E] text-[#2BA84A] border border-[#2BA84A]/30'
                    : 'bg-[#18221E] text-[#B6C2BC] border border-[#223029] hover:bg-[#223029]'
                }`}
              >
                {showLockedBadges ? <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1.5 sm:mr-2" /> : <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1.5 sm:mr-2" />}
                {showLockedBadges ? t('badge.show_locked') : t('badge.hide_locked')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Badge Grid - RESPONSIVE */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <AnimatePresence mode="popLayout">
          {filteredBadges.map((badge, index) => {
            const earned = earnedBadges.find(eb => eb.id === badge.id);
            const userValue = stats[badge.stat] || 0;
            
            return (
              <motion.div
                key={badge.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3, delay: index * 0.01 }}
              >
                <BadgeComponent 
                  badge={badge}
                  userValue={userValue}
                  earnedTier={earned?.tier}
                  onClick={() => setSelectedBadge(badge)}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {filteredBadges.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="w-16 h-16 rounded-full bg-[#18221E] flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8 text-[#7B8A83]" />
          </div>
          <p className="text-sm text-[#B6C2BC]">{t('badge.empty_title')}</p>
          <p className="text-xs text-[#7B8A83] mt-1">{t('badge.empty_desc')}</p>
        </motion.div>
      )}
    </div>
  );
}
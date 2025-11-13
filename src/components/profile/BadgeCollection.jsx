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
  PlusSquare, 
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
  Link, 
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
  CheckCircle2
} from "lucide-react";

const TIER_CONFIG = {
  bronze: { 
    color: "#CD7F32", 
    name: "Brons",
    gradient: "from-[#CD7F32] to-[#8B5A2B]",
    glow: "shadow-[0_0_20px_rgba(205,127,50,0.4)]",
    ring: "ring-[#CD7F32]/30"
  },
  silver: { 
    color: "#C0C0C0", 
    name: "Silver",
    gradient: "from-[#C0C0C0] to-[#808080]",
    glow: "shadow-[0_0_20px_rgba(192,192,192,0.4)]",
    ring: "ring-[#C0C0C0]/30"
  },
  gold: { 
    color: "#FFD700", 
    name: "Guld",
    gradient: "from-[#FFD700] to-[#FFA500]",
    glow: "shadow-[0_0_20px_rgba(255,215,0,0.5)]",
    ring: "ring-[#FFD700]/30"
  },
  diamond: { 
    color: "#7A4DE8", 
    name: "Diamant",
    gradient: "from-[#7A4DE8] to-[#4B0082]",
    glow: "shadow-[0_0_20px_rgba(122,77,232,0.5)]",
    ring: "ring-[#7A4DE8]/30"
  }
};

const CATEGORY_CONFIG = {
  matches: { 
    name: 'Matcher', 
    icon: Trophy, 
    color: '#2BA84A',
    bgColor: 'bg-[#2BA84A]/16',
    borderColor: 'border-[#2BA84A]/30',
    textColor: 'text-[#2BA84A]',
    hoverBg: 'hover:bg-[#2BA84A]/24'
  },
  social: { 
    name: 'Socialt', 
    icon: Users, 
    color: '#4169E1',
    bgColor: 'bg-[#4169E1]/16',
    borderColor: 'border-[#4169E1]/30',
    textColor: 'text-[#B0C4DE]',
    hoverBg: 'hover:bg-[#4169E1]/24'
  },
  skill: { 
    name: 'Skicklighet', 
    icon: Target, 
    color: '#F4743B',
    bgColor: 'bg-[#F4743B]/16',
    borderColor: 'border-[#F4743B]/30',
    textColor: 'text-[#FDE3D2]',
    hoverBg: 'hover:bg-[#F4743B]/24'
  },
  dedication: { 
    name: 'Dedikation', 
    icon: Flame, 
    color: '#DC2626',
    bgColor: 'bg-[#DC2626]/16',
    borderColor: 'border-[#DC2626]/30',
    textColor: 'text-[#FCA5A5]',
    hoverBg: 'hover:bg-[#DC2626]/24'
  },
  special: { 
    name: 'Speciellt', 
    icon: Sparkles, 
    color: '#9370DB',
    bgColor: 'bg-[#9370DB]/16',
    borderColor: 'border-[#9370DB]/30',
    textColor: 'text-[#DDD6FE]',
    hoverBg: 'hover:bg-[#9370DB]/24'
  }
};

const ICON_MAP = {
  'match_creator': PlusSquare,
  'match_player': Users,
  'team_player': UserCheck,
  'reliable': ShieldCheck,
  'mvp_champion': Trophy,
  'streak_master': Flame,
  'weekend_warrior': Sun,
  'night_owl': Moon,
  'early_bird': Sunrise,
  'explorer': Globe,
  'social': Link,
  'team_builder': UserPlus,
  'supporter': MessageSquarePlus,
  'cup_participant': Trophy
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
  { id: 'cup_participant', name: 'Turneringsspelare', description: 'Delta i turneringar', category: 'matches', tiers: { bronze: 1, silver: 3, gold: 5, diamond: 10 }, stat: 'cups_participated' }
];

const BadgeComponent = ({ badge, userValue, earnedTier }) => {
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
      progress = 100; // Max tier
    }
  } else {
    // Not unlocked yet
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
      whileHover={{ scale: isLocked ? 1 : 1.05 }}
      className={`relative flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-gradient-to-br from-[#18221E] to-[#121715] border transition-all duration-300 ${
        isLocked 
          ? 'border-[#223029] opacity-60' 
          : `border-[${tierConfig.color}]/30 ${tierConfig.glow} hover:border-[${tierConfig.color}]/50`
      }`}
    >
      {/* Category Badge */}
      <div className="absolute top-2 right-2">
        <Badge 
          className={`text-[10px] px-2 py-0.5 ${categoryConfig.bgColor} ${categoryConfig.textColor} border-0 font-medium`}
        >
          {categoryConfig.name}
        </Badge>
      </div>

      {/* Badge Icon */}
      <div 
        className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center rounded-full mb-3 transition-all bg-gradient-to-br from-[#18221E] to-[#0F1513]"
        style={{
          border: isLocked ? '3px solid #223029' : `3px solid ${tierConfig.color}`,
          boxShadow: isLocked ? 'none' : `0 0 25px -5px ${tierConfig.color}`
        }}
      >
        <Icon 
          className="w-8 h-8 sm:w-10 sm:h-10 transition-all" 
          style={{ color: isLocked ? '#7B8A83' : tierConfig.color }}
          strokeWidth={2.5}
        />
        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0F1513]/80 rounded-full backdrop-blur-sm">
            <Lock className="w-6 h-6 text-[#7B8A83]" strokeWidth={2} />
          </div>
        )}
        {currentTier && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
            className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-lg shadow-lg"
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
      
      {/* Badge Info */}
      <h4 className="font-bold text-[#F4F7F5] text-sm sm:text-base leading-tight mb-1">{badge.name}</h4>
      <p className="text-xs text-[#B6C2BC] leading-snug mb-3 px-1">{badge.description}</p>
      
      {/* Status/Progress */}
      {isLocked ? (
        <div className="w-full space-y-2">
          <div className="w-full bg-[#0F1513] rounded-full h-2.5 overflow-hidden border border-[#223029] shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-[#2BA84A] to-[#248232]"
            />
          </div>
          <p className="text-xs font-semibold text-[#7B8A83]">
            {userValue}/{nextTierRequirement} för Brons
          </p>
        </div>
      ) : nextTierRequirement ? (
        <div className="w-full space-y-2">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: tierConfig.color }}
            />
            <p className="text-xs font-bold tracking-wide" style={{ color: tierConfig.color }}>
              {tierConfig.name.toUpperCase()}
            </p>
          </div>
          <div className="w-full bg-[#0F1513] rounded-full h-2.5 overflow-hidden border border-[#223029] shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`h-full bg-gradient-to-r ${tierConfig.gradient}`}
              style={{ boxShadow: `0 0 10px ${tierConfig.color}80` }}
            />
          </div>
          <p className="text-xs font-semibold text-[#7B8A83]">
            {userValue}/{nextTierRequirement} för {TIER_CONFIG[nextTier].name}
          </p>
        </div>
      ) : (
        <div className="w-full">
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: tierConfig.color }}
            />
            <p className="text-xs font-bold tracking-wide" style={{ color: tierConfig.color }}>
              {tierConfig.name.toUpperCase()}
            </p>
          </div>
          <div className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-gradient-to-r ${tierConfig.gradient} bg-opacity-20`}>
            <CheckCircle2 className="w-4 h-4 text-[#2BA84A]" strokeWidth={2.5} />
            <p className="text-xs font-bold text-[#2BA84A]">MAXAD!</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default function BadgeCollection({ user }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('progress');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch badge data
  const { data: badgeData, isLoading, refetch } = useQuery({
    queryKey: ['userBadges', user?.id],
    queryFn: async () => {
      const response = await base44.functions.invoke('badges/calculateUserBadges', {
        userId: user.id
      });
      return response.data;
    },
    enabled: !!user,
    staleTime: 30 * 1000
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <RefreshCw className="w-8 h-8 text-[#2BA84A] animate-spin" strokeWidth={2.5} />
          <p className="text-sm text-[#B6C2BC] font-medium">Laddar badges...</p>
        </motion.div>
      </div>
    );
  }

  const stats = badgeData?.stats || {};
  const earnedBadges = badgeData?.badges || [];

  // Filter badges
  let filteredBadges = ALL_BADGES;
  if (selectedCategory !== 'all') {
    filteredBadges = filteredBadges.filter(b => b.category === selectedCategory);
  }

  // Sort badges
  filteredBadges = [...filteredBadges].sort((a, b) => {
    const aEarned = earnedBadges.find(eb => eb.id === a.id);
    const bEarned = earnedBadges.find(eb => eb.id === b.id);
    const aValue = stats[a.stat] || 0;
    const bValue = stats[b.stat] || 0;

    if (sortBy === 'progress') {
      // Unlocked badges first, then by progress
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
    <div className="space-y-6">
      {/* Stats Header - IMPROVED */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="relative overflow-hidden bg-gradient-to-br from-[#1F5C34] to-[#0A1F11] border border-[#2BA84A]/30 rounded-[20px] shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
          {/* Decorative circles */}
          <div className="absolute top-[-30px] right-[-30px] w-32 h-32 bg-[#2BA84A]/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-[-40px] left-[-40px] w-40 h-40 bg-[#0A1F11]/60 rounded-full blur-2xl"></div>
          
          <CardContent className="relative p-6 z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl lg:text-2xl font-bold text-[#EAF6EE] mb-1">Badge Samling</h3>
                <p className="text-sm text-[#CFE8D6]">
                  <span className="font-bold text-[#2BA84A]">{unlockedCount}</span> upplåsta av {totalPossible} möjliga
                </p>
              </div>
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="bg-[#FFFFFF]/10 backdrop-blur-sm border border-[#FFFFFF]/20 text-[#EAF6EE] hover:bg-[#FFFFFF]/15 h-10 px-4 rounded-xl font-semibold"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Uppdatera
              </Button>
            </div>

            {/* Progress bar */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm text-[#CFE8D6]">
                <span className="font-medium">Total framsteg</span>
                <span className="font-bold text-[#2BA84A]">{completionPercentage}%</span>
              </div>
              <div className="w-full bg-[#0F1513]/60 rounded-full h-4 overflow-hidden border border-[#2BA84A]/20 shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-[#2BA84A] to-[#248232]"
                  style={{ boxShadow: '0 0 15px rgba(43, 168, 74, 0.5)' }}
                />
              </div>
            </div>

            {/* Tier breakdown */}
            <div className="grid grid-cols-4 gap-3">
              {Object.entries(TIER_CONFIG).map(([tier, config]) => {
                const count = earnedBadges.filter(b => b.tier === tier).length;
                return (
                  <motion.div 
                    key={tier}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-[#FFFFFF]/10 backdrop-blur-sm rounded-xl p-3 text-center border border-[#FFFFFF]/20 hover:bg-[#FFFFFF]/15 transition-colors"
                  >
                    <div className="text-2xl font-bold text-[#EAF6EE] mb-1">{count}</div>
                    <div className="text-[10px] text-[#CFE8D6] font-medium">{config.name}</div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters - IMPROVED */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
      >
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
              selectedCategory === 'all'
                ? 'bg-[#2BA84A] text-white shadow-[0_4px_12px_rgba(43,168,74,0.4)]'
                : 'bg-[#18221E] text-[#B6C2BC] border border-[#223029] hover:bg-[#223029]'
            }`}
          >
            <Filter className="w-4 h-4" />
            Alla
          </button>
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
            const CategoryIcon = config.icon;
            const isActive = selectedCategory === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                  isActive
                    ? `${config.bgColor} ${config.textColor} ring-1 ${config.borderColor}`
                    : 'bg-[#18221E] text-[#B6C2BC] border border-[#223029] hover:bg-[#223029]'
                }`}
              >
                <CategoryIcon className="w-4 h-4" />
                {config.name}
              </button>
            );
          })}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setSortBy('progress')}
            className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
              sortBy === 'progress'
                ? 'bg-[#18221E] text-[#2BA84A] border border-[#2BA84A]/30'
                : 'bg-[#18221E] text-[#B6C2BC] border border-[#223029] hover:bg-[#223029]'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            Framsteg
          </button>
          <button
            onClick={() => setSortBy('rarity')}
            className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
              sortBy === 'rarity'
                ? 'bg-[#18221E] text-[#2BA84A] border border-[#2BA84A]/30'
                : 'bg-[#18221E] text-[#B6C2BC] border border-[#223029] hover:bg-[#223029]'
            }`}
          >
            <Star className="w-4 h-4 inline mr-2" />
            Sällsynthet
          </button>
        </div>
      </motion.div>

      {/* Badge Grid */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4"
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
                transition={{ duration: 0.3, delay: index * 0.02 }}
              >
                <BadgeComponent 
                  badge={badge}
                  userValue={userValue}
                  earnedTier={earned?.tier}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
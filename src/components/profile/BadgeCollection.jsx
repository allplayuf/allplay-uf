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
  Star
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TIER_CONFIG = {
  bronze: { 
    color: "#CD7F32", 
    name: "Brons",
    gradient: "from-[#CD7F32] to-[#8B5A2B]",
    glow: "shadow-[0_0_20px_rgba(205,127,50,0.5)]"
  },
  silver: { 
    color: "#C0C0C0", 
    name: "Silver",
    gradient: "from-[#C0C0C0] to-[#808080]",
    glow: "shadow-[0_0_20px_rgba(192,192,192,0.5)]"
  },
  gold: { 
    color: "#FFD700", 
    name: "Guld",
    gradient: "from-[#FFD700] to-[#FFA500]",
    glow: "shadow-[0_0_20px_rgba(255,215,0,0.6)]"
  },
  diamond: { 
    color: "#7A4DE8", 
    name: "Diamant",
    gradient: "from-[#7A4DE8] to-[#4B0082]",
    glow: "shadow-[0_0_20px_rgba(122,77,232,0.6)]"
  }
};

const CATEGORY_CONFIG = {
  matches: { name: 'Matcher', icon: Trophy, color: '#2BA84A' },
  social: { name: 'Socialt', icon: Users, color: '#4169E1' },
  skill: { name: 'Skicklighet', icon: Target, color: '#F4743B' },
  dedication: { name: 'Dedikation', icon: Flame, color: '#DC2626' },
  special: { name: 'Speciellt', icon: Sparkles, color: '#9370DB' }
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
      className={`relative flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-[#18221E] border border-[#223029] transition-all duration-200 ${
        isLocked ? 'opacity-60' : `hover:${tierConfig.glow} hover:scale-105`
      }`}
    >
      {/* Category Badge */}
      <div className="absolute top-2 right-2">
        <Badge 
          className="text-[10px] px-2 py-0.5" 
          style={{ 
            backgroundColor: `${CATEGORY_CONFIG[badge.category].color}20`,
            color: CATEGORY_CONFIG[badge.category].color,
            border: `1px solid ${CATEGORY_CONFIG[badge.category].color}40`
          }}
        >
          {CATEGORY_CONFIG[badge.category].name}
        </Badge>
      </div>

      {/* Badge Icon */}
      <div 
        className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center rounded-full mb-3 transition-all"
        style={{
          border: isLocked ? '2px solid #4A5568' : `3px solid ${tierConfig.color}`,
          boxShadow: isLocked ? 'none' : `0 0 20px -2px ${tierConfig.color}`
        }}
      >
        <Icon className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: isLocked ? '#7B8A83' : tierConfig.color }} />
        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0F1513]/70 rounded-full backdrop-blur-sm">
            <Lock className="w-6 h-6 text-[#7B8A83]" />
          </div>
        )}
        {currentTier && (
          <div 
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ 
              backgroundColor: tierConfig.color,
              boxShadow: `0 2px 8px ${tierConfig.color}80`
            }}
          >
            {currentTier === 'bronze' && '🥉'}
            {currentTier === 'silver' && '🥈'}
            {currentTier === 'gold' && '🥇'}
            {currentTier === 'diamond' && '💎'}
          </div>
        )}
      </div>
      
      {/* Badge Info */}
      <h4 className="font-semibold text-[#F4F7F5] text-sm sm:text-base leading-tight mb-1">{badge.name}</h4>
      <p className="text-xs text-[#B6C2BC] leading-snug mb-3">{badge.description}</p>
      
      {/* Status/Progress */}
      {isLocked ? (
        <div className="w-full space-y-2">
          <div className="w-full bg-[#0F1513] rounded-full h-2 overflow-hidden border border-[#223029]">
            <div 
              className="h-full bg-gradient-to-r from-[#2BA84A] to-[#248232] transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <p className="text-xs font-mono text-[#7B8A83]">
            {userValue}/{nextTierRequirement} för Brons
          </p>
        </div>
      ) : nextTierRequirement ? (
        <div className="w-full space-y-2">
          <p className="text-xs font-bold" style={{ color: tierConfig.color }}>
            {tierConfig.name}
          </p>
          <div className="w-full bg-[#0F1513] rounded-full h-2 overflow-hidden border border-[#223029]">
            <div 
              className={`h-full bg-gradient-to-r ${tierConfig.gradient} transition-all duration-500`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <p className="text-xs font-mono text-[#7B8A83]">
            {userValue}/{nextTierRequirement} för {TIER_CONFIG[nextTier].name}
          </p>
        </div>
      ) : (
        <div className="w-full">
          <p className="text-xs font-bold mb-2" style={{ color: tierConfig.color }}>
            {tierConfig.name}
          </p>
          <div className="flex items-center justify-center gap-2 text-[#2BA84A]">
            <Star className="w-4 h-4 fill-[#2BA84A]" />
            <p className="text-xs font-semibold">Maxad!</p>
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
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-[#2BA84A] animate-spin" />
          <p className="text-sm text-[#B6C2BC]">Laddar badges...</p>
        </div>
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
      {/* Stats Header */}
      <Card className="bg-gradient-to-br from-[#1F5C34] to-[#0A1F11] border border-[#2BA84A]/30 rounded-[20px] shadow-[0_6px_18px_rgba(0,0,0,0.22)]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-[#EAF6EE]">Badge Samling</h3>
              <p className="text-sm text-[#CFE8D6]">{unlockedCount} upplåsta av {totalPossible} möjliga</p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
              className="border-[#2BA84A]/30 text-[#CFE8D6] hover:bg-[#2BA84A]/10"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Uppdatera
            </Button>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-[#CFE8D6]">
              <span>Framsteg</span>
              <span>{completionPercentage}%</span>
            </div>
            <div className="w-full bg-[#0F1513]/60 rounded-full h-3 overflow-hidden border border-[#2BA84A]/20">
              <div 
                className="h-full bg-gradient-to-r from-[#2BA84A] to-[#248232] transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          {/* Tier breakdown */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            {Object.entries(TIER_CONFIG).map(([tier, config]) => {
              const count = earnedBadges.filter(b => b.tier === tier).length;
              return (
                <div key={tier} className="bg-[#FFFFFF]/10 backdrop-blur-sm rounded-xl p-3 text-center border border-[#FFFFFF]/20">
                  <div className="text-lg font-bold text-[#EAF6EE]">{count}</div>
                  <div className="text-[10px] text-[#CFE8D6]">{config.name}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
            className={selectedCategory === 'all' ? 'bg-[#2BA84A] text-white' : 'border-[#223029] text-[#B6C2BC]'}
          >
            <Filter className="w-4 h-4 mr-2" />
            Alla
          </Button>
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
            const CategoryIcon = config.icon;
            return (
              <Button
                key={key}
                variant={selectedCategory === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(key)}
                className={selectedCategory === key ? 'text-white' : 'border-[#223029] text-[#B6C2BC]'}
                style={selectedCategory === key ? { backgroundColor: config.color } : {}}
              >
                <CategoryIcon className="w-4 h-4 mr-2" />
                {config.name}
              </Button>
            );
          })}
        </div>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px] bg-[#18221E] border-[#223029] text-[#F4F7F5]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="progress">Sortera: Framsteg</SelectItem>
            <SelectItem value="rarity">Sortera: Sällsynthet</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Badge Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        <AnimatePresence>
          {filteredBadges.map(badge => {
            const earned = earnedBadges.find(eb => eb.id === badge.id);
            const userValue = stats[badge.stat] || 0;
            
            return (
              <BadgeComponent 
                key={badge.id}
                badge={badge}
                userValue={userValue}
                earnedTier={earned?.tier}
              />
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
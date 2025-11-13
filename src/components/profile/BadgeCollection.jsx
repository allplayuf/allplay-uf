import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
  MessageSquarePlus 
} from "lucide-react";

const TIER_CONFIG = {
  bronze: { color: "#CD7F32", name: "Brons" },
  silver: { color: "#C0C0C0", name: "Silver" },
  gold: { color: "#FFD700", name: "Guld" },
  diamond: { color: "#7A4DE8", name: "Diamant" }
};

const ALL_BADGES = [
  { id: 'match_creator', name: 'Matchstartare', description: 'Skapa matcher', icon: PlusSquare, tiers: [1, 5, 10, 25], stat: 'created_matches_count' },
  { id: 'match_player', name: 'Spelstomme', description: 'Delta i matcher', icon: Users, tiers: [10, 50, 100, 250], stat: 'matches_played' },
  { id: 'team_player', name: 'Lagspelare', description: 'Spela med olika personer', icon: UserCheck, tiers: [10, 25, 50, 100], stat: 'unique_opponents' },
  { id: 'reliable', name: 'Pålitlig', description: 'Slutför matcher', icon: ShieldCheck, tiers: [10, 50, 100, 250], stat: 'completed_matches' },
  { id: 'fair_play', name: 'Fair Play', description: 'Få positiva omdömen', icon: ThumbsUp, tiers: [5, 20, 50, 100], stat: 'fair_play_votes' },
  { id: 'team_builder', name: 'Team Builder', description: 'Bjud in till ditt lag', icon: UserPlus, tiers: [2, 5, 10, 15], stat: 'team_members_invited' },
  { id: 'community_hero', name: 'Community Hero', description: 'Hjälp communityt', icon: HeartHandshake, tiers: [1, 5, 10, 25], stat: 'reports_resolved' },
  { id: 'streak_master', name: 'Streak Master', description: 'Spela dagar i rad', icon: Flame, tiers: [3, 7, 14, 30], stat: 'longest_streak' },
  { id: 'weekend_warrior', name: 'Weekend Warrior', description: 'Spela på helger', icon: Sun, tiers: [4, 8, 16, 32], stat: 'weekend_matches' },
  { id: 'night_owl', name: 'Nattuggla', description: 'Spela efter 22:00', icon: Moon, tiers: [5, 10, 25, 50], stat: 'night_matches' },
  { id: 'early_bird', name: 'Early Bird', description: 'Spela före 09:00', icon: Sunrise, tiers: [5, 10, 25, 50], stat: 'morning_matches' },
  { id: 'explorer', name: 'Utforskare', description: 'Spela på olika platser', icon: Globe, tiers: [3, 5, 10, 20], stat: 'unique_venues' },
  { id: 'og', name: 'AllPlay OG', description: 'Registrerad tidigt', icon: Zap, tiers: [1], stat: 'is_og' },
  { id: 'beta_tester', name: 'Beta Tester', description: 'Deltog i betan', icon: FlaskConical, tiers: [1], stat: 'is_beta_tester' },
  { id: 'social', name: 'Social', description: 'Skicka vänförfrågningar', icon: Send, tiers: [5, 20, 50, 100], stat: 'friends_invited' },
  { id: 'connected', name: 'Connected', description: 'Ha aktiva vänner', icon: Link, tiers: [5, 10, 25, 50], stat: 'active_friends' },
  { id: 'comeback', name: 'Comeback Kid', description: 'Återvänd efter en paus', icon: RotateCw, tiers: [1], stat: 'is_comeback' },
  { id: 'season_starter', name: 'Season Starter', description: 'Spela vid säsongsstart', icon: CalendarPlus, tiers: [1], stat: 'played_season_start' },
  { id: 'event_goer', name: 'Eventdeltagare', description: 'Delta i event', icon: Ticket, tiers: [1, 3, 5, 10], stat: 'events_attended' },
  { id: 'supporter', name: 'Supporter', description: 'Ge feedback i appen', icon: MessageSquarePlus, tiers: [1, 5, 10, 20], stat: 'feedback_submitted' }
];

const BadgeComponent = ({ badge, userValue }) => {
  let unlockedTier = null;
  let nextTierRequirement = badge.tiers[0];
  let nextTierName = "Brons";
  let progress = 0;
  
  // Calculate unlocked tier
  for (let i = badge.tiers.length - 1; i >= 0; i--) {
    if (userValue >= badge.tiers[i]) {
      unlockedTier = Object.keys(TIER_CONFIG)[i];
      if (i < badge.tiers.length - 1) {
        nextTierRequirement = badge.tiers[i + 1];
        nextTierName = TIER_CONFIG[Object.keys(TIER_CONFIG)[i+1]].name;
      } else {
        nextTierRequirement = null; // Max tier reached
      }
      break;
    }
  }
  
  // Calculate progress to next tier
  if (!unlockedTier) {
    // Not unlocked yet - progress towards bronze
    progress = (userValue / badge.tiers[0]) * 100;
    nextTierRequirement = badge.tiers[0];
    nextTierName = "Brons";
  } else if (nextTierRequirement) {
    // Unlocked but not max - progress to next tier
    const currentTierIndex = Object.keys(TIER_CONFIG).indexOf(unlockedTier);
    const currentTierValue = badge.tiers[currentTierIndex];
    progress = ((userValue - currentTierValue) / (nextTierRequirement - currentTierValue)) * 100;
  } else {
    // Max tier - 100% progress
    progress = 100;
  }

  const isLocked = !unlockedTier;
  const Icon = badge.icon;
  const tierColor = isLocked ? "#4A5568" : TIER_CONFIG[unlockedTier].color;

  return (
    <div className={`relative flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-[#18221E] border border-[#223029] transition-all duration-200 ${isLocked ? 'opacity-60' : 'hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:scale-105'}`}>
      {/* Badge Icon */}
      <div 
        className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center rounded-full mb-3"
        style={{
          border: `2px solid ${tierColor}`,
          boxShadow: isLocked ? 'none' : `0 0 15px -2px ${tierColor}`
        }}
      >
        <Icon className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: tierColor }} />
        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0F1513]/60 rounded-full">
            <Lock className="w-6 h-6 text-[#7B8A83]" />
          </div>
        )}
      </div>
      
      {/* Badge Info */}
      <h4 className="font-semibold text-[#F4F7F5] text-sm sm:text-base leading-tight mb-1">{badge.name}</h4>
      <p className="text-xs text-[#B6C2BC] leading-snug mb-2">{badge.description}</p>
      
      {/* Status/Progress */}
      {isLocked ? (
        <div className="w-full space-y-2">
          <div className="w-full bg-[#0F1513] rounded-full h-1.5 overflow-hidden">
            <div 
              className="h-full bg-[#2BA84A] transition-all duration-300"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <p className="text-xs font-mono text-[#7B8A83]">
            {userValue}/{nextTierRequirement} för {nextTierName}
          </p>
        </div>
      ) : nextTierRequirement ? (
        <div className="w-full space-y-2">
          <p className="text-xs font-bold" style={{ color: tierColor }}>
            {TIER_CONFIG[unlockedTier].name}
          </p>
          <div className="w-full bg-[#0F1513] rounded-full h-1.5 overflow-hidden">
            <div 
              className="h-full transition-all duration-300"
              style={{ 
                width: `${Math.min(progress, 100)}%`,
                backgroundColor: tierColor
              }}
            />
          </div>
          <p className="text-xs font-mono text-[#7B8A83]">
            {userValue}/{nextTierRequirement} för {nextTierName}
          </p>
        </div>
      ) : (
        <div className="w-full">
          <p className="text-xs font-bold mb-1" style={{ color: tierColor }}>
            {TIER_CONFIG[unlockedTier].name}
          </p>
          <p className="text-xs text-[#2BA84A] font-semibold flex items-center justify-center gap-1">
            <Award className="w-3 h-3" />
            Maxad!
          </p>
        </div>
      )}
    </div>
  );
};

export default function BadgeCollection({ user }) {
  // Mock user stats for demonstration
  const userStats = {
    matches_played: user?.matches_played || 0,
    mvp_count: user?.mvp_count || 0,
    longest_streak: user?.longest_streak || 0,
    created_matches_count: 5,
    unique_opponents: 42,
    completed_matches: user?.matches_played || 0,
    fair_play_votes: 12,
    team_members_invited: 3,
    reports_resolved: 0,
    weekend_matches: 12,
    night_matches: 8,
    morning_matches: 3,
    unique_venues: 6,
    is_og: 1,
    is_beta_tester: 0,
    friends_invited: 22,
    active_friends: 18,
    is_comeback: 0,
    played_season_start: 1,
    events_attended: 2,
    feedback_submitted: 4,
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
      {ALL_BADGES.map(badge => (
        <BadgeComponent 
          key={badge.id}
          badge={badge}
          userValue={userStats[badge.stat] || 0}
        />
      ))}
    </div>
  );
}
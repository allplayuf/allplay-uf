import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, UserPlus, CheckCircle, Clock, Target, TrendingUp, Shield, Crown, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { getAvatarUrl } from "@/components/utils/privacyMask";
import AvatarImage from "@/components/ui/avatar-image";

const SKILL_LEVEL_CONFIG = {
  beginner: { label: 'Nybörjare', icon: Target, color: 'bg-[#10B981]/20 text-[#A7F3D0]' },
  intermediate: { label: 'Medel', icon: TrendingUp, color: 'bg-[#14B8A6]/20 text-[#99F6E4]' },
  advanced: { label: 'Avancerad', icon: Shield, color: 'bg-[#8B5CF6]/20 text-[#DDD6FE]' },
  elite: { label: 'Elit', icon: Crown, color: 'bg-[#F59E0B]/20 text-[#FDE68A]' }
};

/**
 * Strategy A: Fixed-size AvatarImage with placeholder-first, no layout shift.
 * Avatar renders an initial+gradient immediately; image fades in when loaded.
 */
export default function PlayerCard({ player, friendshipStatus = 'none', onAddFriend, index = 0 }) {
  const isPrivate = player._isPrivate;
  const avatarUrl = getAvatarUrl(player);
  const skillConfig = SKILL_LEVEL_CONFIG[player.skill_level || 'intermediate'];
  const SkillIcon = skillConfig?.icon || Target;
  const displayName = player.display_name || player.full_name || 'Okänd spelare';
  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: "easeOut" }}
    >
      <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.28)] hover:border-[#2BA84A]/30 transition-all rounded-[16px]">
        <CardContent className="p-4">
          <Link to={isPrivate ? '#' : `${createPageUrl("Profile")}?userId=${player.id}`} className="block mb-3">
            <div className="flex items-center gap-3 mb-3">
              {/* Avatar — placeholder-first, no pop-in */}
              <AvatarImage
                src={avatarUrl}
                name={displayName}
                className="w-12 h-12 !rounded-xl"
                textClassName="text-lg"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-semibold text-[#F4F7F5] text-sm truncate">
                    {displayName}
                  </h4>
                  {isPrivate && <EyeOff className="w-3.5 h-3.5 text-[#7B8A83] flex-shrink-0" />}
                </div>
                {!isPrivate && player.username && (
                  <p className="text-xs text-[#7B8A83] truncate">@{player.username}</p>
                )}
                {!isPrivate && (
                  <div className="flex items-center gap-1 text-xs text-[#B6C2BC]">
                    <MapPin className="w-3 h-3" />
                    {player.city || 'Okänd stad'}
                  </div>
                )}
              </div>
            </div>
          </Link>

          {/* Skill Badge */}
          {!isPrivate && skillConfig && (
            <div className="mb-3">
              <Badge className={`w-full justify-center py-1.5 ${skillConfig.color} rounded-lg text-xs font-semibold`}>
                <SkillIcon className="w-3 h-3 mr-1" />
                {skillConfig.label}
              </Badge>
            </div>
          )}

          {/* Stats */}
          {!isPrivate && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="flex items-center justify-between p-2 bg-[#0F1513] rounded-xl">
                <span className="text-xs text-[#B6C2BC] font-medium">Matcher</span>
                <span className="font-mono font-semibold text-[#F4F7F5] text-sm">
                  {player.matches_played || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#0F1513] rounded-xl">
                <span className="text-xs text-[#B6C2BC] font-medium">MVPs</span>
                <span className="font-mono font-semibold text-[#F4743B] text-sm">
                  {player.mvp_count || 0}
                </span>
              </div>
            </div>
          )}

          {/* Friend Button */}
          {!isPrivate && friendshipStatus === 'none' && (
            <motion.button
              onClick={() => onAddFriend?.(player.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 1.05, transition: { duration: 0.1 } }}
              className="w-full inline-flex h-10 items-center justify-center gap-2 rounded-[14px] bg-[#2BA84A] text-[#FFFFFF] text-sm font-semibold hover:bg-[#248232] transition-all"
            >
              <UserPlus className="w-4 h-4" />
              Lägg till vän
            </motion.button>
          )}

          {friendshipStatus === 'accepted' && (
            <button
              disabled
              className="w-full inline-flex h-10 items-center justify-center gap-2 rounded-[14px] bg-[#2BA84A]/20 text-[#2BA84A] text-sm font-semibold cursor-not-allowed"
            >
              <CheckCircle className="w-4 h-4" />
              Vänner
            </button>
          )}

          {friendshipStatus === 'pending_outgoing' && (
            <button
              disabled
              className="w-full inline-flex h-10 items-center justify-center gap-2 rounded-[14px] bg-[#18221E] text-[#B6C2BC] text-sm font-semibold cursor-not-allowed"
            >
              <Clock className="w-4 h-4" />
              Förfrågan skickad
            </button>
          )}

          {friendshipStatus === 'pending_incoming' && (
            <motion.button
              onClick={() => onAddFriend?.(player.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 1.05, transition: { duration: 0.1 } }}
              className="w-full inline-flex h-10 items-center justify-center gap-2 rounded-[14px] bg-[#F4743B] text-[#FFFFFF] text-sm font-semibold hover:bg-[#E5683A] transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              Acceptera förfrågan
            </motion.button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
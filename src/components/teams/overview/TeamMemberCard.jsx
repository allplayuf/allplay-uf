import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Shield, TrendingUp, Target, Trophy, CheckCircle, Clock, X } from "lucide-react";
import AvatarImage from "@/components/ui/avatar-image";
import { createPageUrl } from "@/utils";

const SKILL_LEVEL_CONFIG = {
  beginner:     { label: 'Nybörjare',  icon: Target,     color: 'bg-[#059669] text-white' },
  intermediate: { label: 'Medel',      icon: TrendingUp, color: 'bg-[#0D9488] text-white' },
  advanced:     { label: 'Avancerad',  icon: Shield,     color: 'bg-[#7C3AED] text-white' },
  elite:        { label: 'Elit',       icon: Crown,      color: 'bg-[#D97706] text-white' },
};

export default function TeamMemberCard({ member, isCaptain, isViceCaptain, index = 0, isPending = false, isCaptainOrVice = false, onAccept, onRemove }) {
  const navigate = useNavigate();
  const skill = member.skill_level ? SKILL_LEVEL_CONFIG[member.skill_level] : null;
  const SkillIcon = skill?.icon;

  const handleClick = () => {
    if (!isPending && member.id) {
      navigate(`${createPageUrl('Profile')}?userId=${member.id}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: Math.min(index * 0.04, 0.32), ease: 'easeOut' }}
    >
      <Card
        onClick={!isPending ? handleClick : undefined}
        className={`relative bg-[#121715] border border-[#223029] rounded-2xl overflow-hidden transition-all duration-200 ${
          !isPending ? 'cursor-pointer hover:border-[#2BA84A]/40 hover:bg-[#131918] active:scale-[0.98]' : ''
        }`}
      >
        {/* Captain/Vice accent top bar */}
        {(isCaptain || isViceCaptain) && (
          <div
            className="absolute top-0 left-0 right-0 h-0.5"
            style={{
              background: isCaptain
                ? 'linear-gradient(90deg, transparent, #F4743B, transparent)'
                : 'linear-gradient(90deg, transparent, #9370DB, transparent)',
            }}
          />
        )}

        {/* Pending amber tint */}
        {isPending && (
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg, transparent, #F59E0B, transparent)' }} />
        )}

        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative flex-shrink-0">
              <AvatarImage
                src={member.avatar_url}
                name={member.display_name || member.full_name}
                className="w-12 h-12 rounded-xl"
                textClassName="text-base"
              />
              {isCaptain && (
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#F4743B] rounded-full flex items-center justify-center ring-2 ring-[#121715]">
                  <Crown className="w-3 h-3 text-white" strokeWidth={2.5} />
                </div>
              )}
              {isViceCaptain && !isCaptain && (
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#9370DB] rounded-full flex items-center justify-center ring-2 ring-[#121715]">
                  <Shield className="w-3 h-3 text-white" strokeWidth={2.5} />
                </div>
              )}
              {isPending && (
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#F59E0B] rounded-full flex items-center justify-center ring-2 ring-[#121715]">
                  <Clock className="w-3 h-3 text-white" strokeWidth={2.5} />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-[14px] text-[#F4F7F5] truncate">
                {member.display_name || member.full_name || 'Okänd'}
              </h4>
              <p className="text-[11px] text-[#9EAAA4] truncate mt-0.5">
                {isPending ? 'Väntar på godkännande' :
                  isCaptain ? 'Kapten' : isViceCaptain ? 'Vice-kapten' : (member.city || 'Medlem')}
              </p>
            </div>
          </div>

          {skill && !isPending && (
            <Badge className={`w-full justify-center text-[10px] py-1 mb-3 ${skill.color} border-0 font-semibold`}>
              {SkillIcon && <SkillIcon className="w-3 h-3 mr-1" />}
              {skill.label}
            </Badge>
          )}

          {!isPending && (
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#0F1513] rounded-lg p-2 border border-[#223029] text-center">
                <div className="text-[9px] text-[#9EAAA4] font-bold uppercase tracking-wider mb-0.5">Matcher</div>
                <div className="text-[15px] font-black text-[#F4F7F5] tabular-nums">{member.matches_played || 0}</div>
              </div>
              <div className="bg-[#0F1513] rounded-lg p-2 border border-[#223029] text-center">
                <div className="text-[9px] text-[#9EAAA4] font-bold uppercase tracking-wider mb-0.5 flex items-center justify-center gap-0.5">
                  <Trophy className="w-2.5 h-2.5 text-[#F4743B]" /> MVP
                </div>
                <div className="text-[15px] font-black text-[#F4743B] tabular-nums">{member.mvp_count || 0}</div>
              </div>
            </div>
          )}

          {/* Pending member captain actions */}
          {isPending && isCaptainOrVice && (onAccept || onRemove) && (
            <div className="flex gap-2 mt-1" onClick={e => e.stopPropagation()}>
              {onRemove && (
                <button onClick={() => onRemove(member.id)}
                  className="flex-1 h-8 rounded-lg border border-[#DC2626]/40 text-[#FCA5A5] text-[12px] font-semibold hover:bg-[#DC2626]/10 transition-colors flex items-center justify-center gap-1">
                  <X className="w-3.5 h-3.5" /> Avvisa
                </button>
              )}
              {onAccept && (
                <button onClick={() => onAccept(member.id)}
                  className="flex-1 h-8 rounded-lg bg-[#2BA84A]/16 border border-[#2BA84A]/30 text-[#CFE8D6] text-[12px] font-semibold hover:bg-[#2BA84A]/24 transition-colors flex items-center justify-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Godkänn
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

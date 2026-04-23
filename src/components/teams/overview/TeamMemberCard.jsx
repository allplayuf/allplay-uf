import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Shield, TrendingUp, Target, Trophy } from "lucide-react";
import AvatarImage from "@/components/ui/avatar-image";

const SKILL_LEVEL_CONFIG = {
  beginner:     { label: 'Nybörjare',  icon: Target,     bgColor: 'bg-[#059669]', textColor: 'text-white' },
  intermediate: { label: 'Medel',      icon: TrendingUp, bgColor: 'bg-[#0D9488]', textColor: 'text-white' },
  advanced:     { label: 'Avancerad',  icon: Shield,     bgColor: 'bg-[#7C3AED]', textColor: 'text-white' },
  elite:        { label: 'Elit',       icon: Crown,      bgColor: 'bg-[#D97706]', textColor: 'text-white' }
};

export default function TeamMemberCard({ member, isCaptain, isViceCaptain, index = 0 }) {
  const skill = member.skill_level ? SKILL_LEVEL_CONFIG[member.skill_level] : null;
  const SkillIcon = skill?.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4), ease: "easeOut" }}
    >
      <Card className="relative bg-[#121715] border border-[#223029] rounded-2xl overflow-hidden hover:border-[#2BA84A]/40 transition-colors">
        {/* Captain/Vice accent bar */}
        {(isCaptain || isViceCaptain) && (
          <div
            className="absolute top-0 left-0 right-0 h-0.5"
            style={{
              background: isCaptain
                ? 'linear-gradient(90deg, transparent, #F4743B, transparent)'
                : 'linear-gradient(90deg, transparent, #9370DB, transparent)'
            }}
            aria-hidden
          />
        )}

        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative flex-shrink-0">
              <AvatarImage
                src={member.profile_image_url}
                name={member.display_name || member.full_name}
                className="w-14 h-14 rounded-xl"
                textClassName="text-lg"
              />
              {isCaptain && (
                <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-[#F4743B] rounded-full flex items-center justify-center ring-2 ring-[#121715]">
                  <Crown className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                </div>
              )}
              {isViceCaptain && !isCaptain && (
                <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-[#9370DB] rounded-full flex items-center justify-center ring-2 ring-[#121715]">
                  <Shield className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-[15px] text-[#F4F7F5] truncate">
                {member.display_name || member.full_name || 'Okänd'}
              </h4>
              <p className="text-[12px] text-[#9EAAA4] truncate">
                {isCaptain ? 'Kapten' : isViceCaptain ? 'Vice-kapten' : (member.city || 'Medlem')}
              </p>
            </div>
          </div>

          {skill && (
            <Badge className={`w-full justify-center mb-3 text-[11px] py-1.5 ${skill.bgColor} ${skill.textColor} font-semibold border-0`}>
              {SkillIcon && <SkillIcon className="w-3 h-3 mr-1" />}
              {skill.label}
            </Badge>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#0F1513] rounded-lg p-2.5 border border-[#223029]">
              <div className="text-[10px] text-[#9EAAA4] font-semibold uppercase tracking-wider mb-0.5">Matcher</div>
              <div className="text-base font-black text-[#F4F7F5] tabular-nums">{member.matches_played || 0}</div>
            </div>
            <div className="bg-[#0F1513] rounded-lg p-2.5 border border-[#223029]">
              <div className="text-[10px] text-[#9EAAA4] font-semibold uppercase tracking-wider mb-0.5 flex items-center gap-1">
                <Trophy className="w-2.5 h-2.5 text-[#F4743B]" /> MVPs
              </div>
              <div className="text-base font-black text-[#F4743B] tabular-nums">{member.mvp_count || 0}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
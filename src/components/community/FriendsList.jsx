import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Trophy, 
  MapPin, 
  UserPlus,
  Target,
  TrendingUp,
  Shield,
  Crown
} from "lucide-react";

const SKILL_LEVEL_CONFIG = {
  beginner: { label: 'Nybörjare', icon: Target, color: 'from-[#10B981] to-[#059669]', textColor: 'text-[#A7F3D0]' },
  intermediate: { label: 'Medel', icon: TrendingUp, color: 'from-[#14B8A6] to-[#0D9488]', textColor: 'text-[#99F6E4]' },
  advanced: { label: 'Avancerad', icon: Shield, color: 'from-[#8B5CF6] to-[#7C3AED]', textColor: 'text-[#DDD6FE]' },
  elite: { label: 'Elit', icon: Crown, color: 'from-[#F59E0B] to-[#D97706]', textColor: 'text-[#FDE68A]' }
};

export default function FriendsList({ friends, incomingRequests, onAcceptRequest, onDeclineRequest }) {
  // Deduplicate friends based on ID
  const uniqueFriends = friends.filter((friend, index, self) => 
    index === self.findIndex((t) => t.id === friend.id)
  );

  if (uniqueFriends.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-[24px] border border-white/[0.06] p-8 sm:p-12"
        style={{
          background: 'linear-gradient(135deg, #151B18 0%, #111613 55%, #0C100E 100%)',
          boxShadow: '0 20px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* Ambient glow */}
        <div className="absolute -top-20 -right-16 w-56 h-56 bg-[#2BA84A]/14 rounded-full blur-3xl pointer-events-none" />
        <div
          className="absolute inset-x-0 top-0 h-px pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)' }}
        />

        <div className="relative z-10 text-center max-w-sm mx-auto">
          <div className="relative inline-flex mb-5">
            <div className="absolute -inset-3 bg-[#2BA84A]/20 rounded-full blur-xl" />
            <div
              className="relative w-16 h-16 rounded-2xl flex items-center justify-center ring-1 ring-[#2BA84A]/30"
              style={{ background: 'rgba(43,168,74,0.12)' }}
            >
              <UserPlus className="w-7 h-7 text-[#86EFAC]" strokeWidth={2.2} />
            </div>
          </div>

          <h3 className="text-[20px] leading-[26px] font-black text-white tracking-tight mb-2">
            Bygg ditt nätverk
          </h3>
          <p className="text-[13px] leading-[19px] text-[#B6C2BC] mb-6">
            Spela matcher för att möta nya spelare och bygga din vänlista.
          </p>

          <div className="flex flex-col gap-2 text-left">
            {[
              { num: '1', text: 'Gå med i en match nära dig' },
              { num: '2', text: 'Lägg till spelare som vänner' },
              { num: '3', text: 'Bjud in dem till nästa spel' },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] ring-1 ring-white/5">
                <div className="w-6 h-6 rounded-full bg-[#2BA84A]/20 ring-1 ring-[#2BA84A]/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-[11px] font-black text-[#86EFAC]">{step.num}</span>
                </div>
                <span className="text-[12px] text-[#C2CEC8] font-medium">{step.text}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
      {uniqueFriends.map((friend, index) => {
        const friendSkill = SKILL_LEVEL_CONFIG[friend.skill_level || 'intermediate'];
        const FriendSkillIcon = friendSkill.icon;

        const avatarUrl = friend.avatar_url;
        return (
          <motion.div
            key={friend.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
          >
            <Link to={`${createPageUrl("Profile")}?userId=${friend.id}`} className="block">
              <Card className="bg-[#121715] border border-[#223029] hover:border-[#2BA84A] transition-all shadow-[0_6px_18px_rgba(0,0,0,0.22)] hover:scale-[1.02] rounded-[16px] cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#2BA84A] to-[#248232] rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {avatarUrl ? 
                        <img src={avatarUrl} alt={friend.display_name || friend.full_name} className="w-full h-full object-cover" /> :
                        <span className="text-[#EAF6EE] font-semibold text-xl">
                          {(friend.display_name || friend.full_name)?.[0] || 'U'}
                        </span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[#F4F7F5] text-[16px] leading-[24px] truncate">{friend.display_name || friend.full_name}</h3>
                      <div className="flex items-center gap-1 text-[13px] leading-[18px] text-[#B6C2BC]">
                        <MapPin className="w-4 h-4 text-[#9FC9AC]" />
                        {friend.city || 'Okänd stad'}
                      </div>
                    </div>
                  </div>

                  {/* Skill Level Badge */}
                  <div className="mb-4">
                    <Badge className={`w-full justify-center py-2 bg-gradient-to-r ${friendSkill.color} ${friendSkill.textColor} rounded-xl font-semibold text-sm`}>
                      <FriendSkillIcon className="w-4 h-4 mr-2" />
                      {friendSkill.label}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-[#18221E] rounded-xl border border-[#223029]">
                      <span className="text-[13px] leading-[18px] text-[#B6C2BC] font-medium">Matcher</span>
                      <span className="font-semibold text-[#F4F7F5] text-[14px] leading-[20px]">{friend.matches_played || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[#18221E] rounded-xl border border-[#223029]">
                      <span className="text-[13px] leading-[18px] text-[#B6C2BC] font-medium flex items-center gap-1">
                        <Trophy className="w-4 h-4 text-[#F4743B]" />
                        MVPs
                      </span>
                      <span className="font-semibold text-[#F4743B] text-[14px] leading-[20px]">{friend.mvp_count || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
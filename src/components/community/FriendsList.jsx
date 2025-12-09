import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { 
  User, 
  MessageCircle, 
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

export default function FriendsList({ friends, user, onRefresh }) {
  // Deduplicate friends based on ID
  const uniqueFriends = friends.filter((friend, index, self) => 
    index === self.findIndex((t) => t.id === friend.id)
  );

  if (uniqueFriends.length === 0) {
    return (
      <Card className="relative overflow-hidden bg-gradient-to-br from-[#2BA84A] to-[#0F2917] rounded-[16px] lg:rounded-[20px] p-8 sm:p-12 lg:p-16 shadow-[0_6px_18px_rgba(0,0,0,0.22)] border border-[#223029]">
        <div className="absolute top-[-30px] right-[-30px] w-28 h-28 bg-[#2BA84A]/40 rounded-full"></div>
        <div className="absolute bottom-[-40px] left-[-40px] w-32 h-32 bg-[#0F2917]/60 rounded-full"></div>
        
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-[#FFFFFF]/15 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 border border-[#FFFFFF]/25">
            <UserPlus className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-[#EAF6EE]" />
          </div>
          <h3 className="text-[20px] leading-[28px] sm:text-[28px] sm:leading-[34px] font-semibold text-[#EAF6EE] mb-3">Inga vänner än</h3>
          <p className="text-[14px] leading-[20px] text-[#CFE8D6] mb-8 max-w-md mx-auto">
            Börja spela matcher för att träffa nya spelare och bygga ditt nätverk!
          </p>
          <button className="inline-flex h-12 items-center justify-center gap-2 rounded-[16px] bg-[#FFFFFF]/16 px-6 text-[#EAF6EE] ring-1 ring-[#FFFFFF]/30 transition-all hover:bg-[#FFFFFF]/24 hover:ring-[#FFFFFF]/45 hover:scale-[1.02] font-semibold">
            <UserPlus className="w-5 h-5" />
            Utforska spelare
          </button>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
      {uniqueFriends.map((friend, index) => {
        const friendSkill = SKILL_LEVEL_CONFIG[friend.skill_level || 'intermediate'];
        const FriendSkillIcon = friendSkill.icon;

        return (
          <motion.div
            key={friend.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
          >
            <Card className="bg-[#121715] border border-[#223029] hover:border-[#2BA84A] transition-all shadow-[0_6px_18px_rgba(0,0,0,0.22)] hover:scale-[1.02] rounded-[16px]">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#2BA84A] to-[#248232] rounded-2xl flex items-center justify-center flex-shrink-0">
                    {friend.profile_image_url ? 
                      <img src={friend.profile_image_url} alt={friend.display_name || friend.full_name} className="w-full h-full object-cover rounded-2xl" /> :
                      <span className="text-[#EAF6EE] font-semibold text-xl">
                        {(friend.display_name || friend.full_name)?.[0] || 'U'}
                      </span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#F4F7F5] text-[16px] leading-[24px] truncate">{friend.display_name || friend.full_name}</h3>
                    <div className="flex items-center gap-1 text-[13px] leading-[18px] text-[#B6C2BC]">
                      <MapPin className="w-4 h-4 text-[#9FC9AC]" />
                      {friend.city}
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

                <div className="space-y-2 mb-6">
                  <div className="flex items-center justify-between p-3 bg-[#18221E] rounded-xl border border-[#223029]">
                    <span className="text-[13px] leading-[18px] text-[#B6C2BC] font-medium">Matcher</span>
                    <span className="font-semibold text-[#F4F7F5] text-[14px] leading-[20px]">{friend.matches_played || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#18221E] rounded-xl border border-[#223029]">
                    <span className="text-[13px] leading-[18px] text-[#B6C2BC] font-medium flex items-center gap-1">
                      <Trophy className="w-4 h-4 text-[#F4743B]" />
                      MVPs
                    </span>
                    <span className="font-semibold text-[#F4743B] text-[#14px] leading-[20px]">{friend.mvp_count || 0}</span>
                  </div>
                </div>

                <button className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border border-[#2BA84A]/35 px-5 text-[#CFE8D6] transition-all hover:bg-[#2BA84A]/10 font-semibold">
                  <MessageCircle className="w-4 h-4" />
                  Skicka meddelande
                </button>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
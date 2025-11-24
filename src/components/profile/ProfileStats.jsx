
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Trophy, Target, Flame, Calendar, Star, Award, Shield, Crown, Gem, TrendingUp } from "lucide-react";
import { User } from "@/entities/User";

const skillLevelConfig = {
  beginner: {
    label: 'Nybörjare',
    icon: Target,
    color: 'from-[#10B981] to-[#059669]',
    textColor: 'text-[#A7F3D0]',
    ringColor: 'ring-[#10B981]/30',
    bgColor: 'bg-[#10B981]/10'
  },
  intermediate: {
    label: 'Medel',
    icon: TrendingUp,
    color: 'from-[#14B8A6] to-[#0D9488]',
    textColor: 'text-[#99F6E4]',
    ringColor: 'ring-[#14B8A6]/30',
    bgColor: 'bg-[#14B8A6]/10'
  },
  advanced: {
    label: 'Avancerad',
    icon: Shield,
    color: 'from-[#8B5CF6] to-[#7C3AED]',
    textColor: 'text-[#DDD6FE]',
    ringColor: 'ring-[#8B5CF6]/30',
    bgColor: 'bg-[#8B5CF6]/10'
  },
  elite: {
    label: 'Elite',
    icon: Crown,
    color: 'from-[#F59E0B] to-[#D97706]',
    textColor: 'text-[#FDE68A]',
    ringColor: 'ring-[#F59E0B]/30',
    bgColor: 'bg-[#F59E0B]/10'
  }
};

export default function ProfileStats({ user, isOwnProfile = true }) {
  const [isEditingSkill, setIsEditingSkill] = React.useState(false);
  const [selectedSkill, setSelectedSkill] = React.useState(user?.skill_level || 'intermediate');

  const handleSkillUpdate = async () => {
    try {
      await User.updateMyUserData({ skill_level: selectedSkill });
      setIsEditingSkill(false);
      window.location.reload();
    } catch (error) {
      console.error("Error updating skill level:", error);
      alert("Kunde inte uppdatera nivå. Försök igen.");
    }
  };

  const currentSkill = skillLevelConfig[user?.skill_level || 'intermediate'];
  const SkillIcon = currentSkill.icon;

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Player Skill Level */}
      <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[20px]">
        <CardHeader className="border-b border-[#223029] p-5">
          <CardTitle className="text-[16px] leading-[24px] text-[#F4F7F5] flex items-center gap-2 font-semibold">
            <Target className="w-5 h-5 text-[#9FC9AC]" />
            {isOwnProfile ? 'Min spelarnivå' : 'Spelarnivå'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {isEditingSkill && isOwnProfile ? (
            <div className="space-y-4">
              <Label className="text-[#B6C2BC] text-[13px] leading-[18px] font-medium">
                Välj din nivå – påverkar vilka matcher du ser
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(skillLevelConfig).map(([value, config]) => {
                  const Icon = config.icon;
                  return (
                    <button
                      key={value}
                      onClick={() => setSelectedSkill(value)}
                      className={`p-4 rounded-xl font-semibold text-[13px] leading-[18px] transition-all border flex flex-col items-center gap-2 ${
                        selectedSkill === value
                          ? `bg-gradient-to-br ${config.color} ${config.textColor} border-transparent shadow-[0_4px_12px_rgba(0,0,0,0.3)]`
                          : 'bg-[#18221E] text-[#B6C2BC] border-[#223029] hover:border-[#2BA84A]'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                      {config.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleSkillUpdate}
                  className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-[#2BA84A]/16 px-5 text-[#EAF6EE] ring-1 ring-[#2BA84A]/30 transition-all hover:bg-[#2BA84A]/24 hover:ring-[#2BA84A]/45 font-semibold"
                >
                  Spara
                </button>
                <button
                  onClick={() => setIsEditingSkill(false)}
                  className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border border-[#223029] px-5 text-[#B6C2BC] transition-all hover:bg-[#18221E] font-semibold"
                >
                  Avbryt
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="relative mb-6">
                <div className={`w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br ${currentSkill.color} flex items-center justify-center shadow-[0_6px_18px_rgba(0,0,0,0.22)] ring-2 ${currentSkill.ringColor}`}>
                  <SkillIcon className="w-12 h-12 text-[#EAF6EE]" />
                </div>
              </div>
              <div className="text-center mb-4">
                <div className={`text-[20px] leading-[28px] font-semibold ${currentSkill.textColor} mb-1`}>
                  {currentSkill.label}
                </div>
                <p className="text-[13px] leading-[18px] text-[#B6C2BC]">
                  {isOwnProfile ? 'Din nuvarande nivå för vanliga matcher' : 'Spelarnivå för vanliga matcher'}
                </p>
              </div>
              {isOwnProfile && (
                <button
                  onClick={() => setIsEditingSkill(true)}
                  className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border border-[#2BA84A]/35 px-5 text-[#CFE8D6] transition-all hover:bg-[#2BA84A]/10 font-semibold"
                >
                  Ändra nivå
                </button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* General Stats */}
      <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[20px]">
        <CardHeader className="border-b border-[#223029] p-5">
          <CardTitle className="text-[16px] leading-[24px] text-[#F4F7F5] flex items-center gap-2 font-semibold">
            <Trophy className="w-5 h-5 text-[#9FC9AC]" />
            Statistik
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-3">
          <div className="flex items-center justify-between p-4 bg-[#18221E] rounded-xl border border-[#223029]">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#9FC9AC]" />
              <span className="text-[14px] leading-[20px] text-[#B6C2BC]">Matcher spelade</span>
            </div>
            <span className="text-[20px] leading-[28px] font-semibold text-[#F4F7F5]">{user?.matches_played || 0}</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-[#18221E] rounded-xl border border-[#223029]">
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-[#F4743B]" />
              <span className="text-[14px] leading-[20px] text-[#B6C2BC]">MVPs</span>
            </div>
            <span className="text-[20px] leading-[28px] font-semibold text-[#F4743B]">{user?.mvp_count || 0}</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-[#18221E] rounded-xl border border-[#223029]">
            <div className="flex items-center gap-3">
              <Flame className="w-5 h-5 text-[#F4743B]" />
              <span className="text-[14px] leading-[20px] text-[#B6C2BC]">Nuvarande streak</span>
            </div>
            <span className="text-[20px] leading-[28px] font-semibold text-[#F4743B]">{user?.current_streak || 0}</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-[#18221E] rounded-xl border border-[#223029]">
            <div className="flex items-center gap-3">
              <Award className="w-5 h-5 text-[#9FC9AC]" />
              <span className="text-[14px] leading-[20px] text-[#B6C2BC]">Längsta streak</span>
            </div>
            <span className="text-[20px] leading-[28px] font-semibold text-[#F4F7F5]">{user?.longest_streak || 0}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

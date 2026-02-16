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
    emoji: '🌱',
    color: 'from-[#10B981] to-[#059669]',
    textColor: 'text-[#A7F3D0]',
    ringColor: 'ring-[#10B981]/30',
    bgColor: 'bg-[#10B981]/10'
  },
  intermediate: {
    label: 'Medel',
    icon: TrendingUp,
    emoji: '⚡',
    color: 'from-[#14B8A6] to-[#0D9488]',
    textColor: 'text-[#99F6E4]',
    ringColor: 'ring-[#14B8A6]/30',
    bgColor: 'bg-[#14B8A6]/10'
  },
  advanced: {
    label: 'Avancerad',
    icon: Shield,
    emoji: '🔥',
    color: 'from-[#8B5CF6] to-[#7C3AED]',
    textColor: 'text-[#DDD6FE]',
    ringColor: 'ring-[#8B5CF6]/30',
    bgColor: 'bg-[#8B5CF6]/10'
  },
  elite: {
    label: 'Elit',
    icon: Crown,
    emoji: '👑',
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
    <div className="grid md:grid-cols-2 gap-4">
      {/* Player Skill Level */}
      <Card className="bg-[#121715] border border-[#223029] rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-[#223029] px-5 py-4">
          <CardTitle className="text-sm text-[#F4F7F5] flex items-center gap-2 font-bold">
            <div className="w-7 h-7 rounded-lg bg-[#2BA84A]/12 flex items-center justify-center">
              <Target className="w-3.5 h-3.5 text-[#2BA84A]" />
            </div>
            {isOwnProfile ? 'Min spelarnivå' : 'Spelarnivå'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
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
                  <span className="text-4xl">{currentSkill.emoji}</span>
                </div>
              </div>
              <div className="text-center mb-4">
                <div className={`text-[20px] leading-[28px] font-bold ${currentSkill.textColor} mb-1`}>
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
      <Card className="bg-[#121715] border border-[#223029] rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-[#223029] px-5 py-4">
          <CardTitle className="text-sm text-[#F4F7F5] flex items-center gap-2 font-bold">
            <div className="w-7 h-7 rounded-lg bg-[#F4743B]/12 flex items-center justify-center">
              <Trophy className="w-3.5 h-3.5 text-[#F4743B]" />
            </div>
            Statistik
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 space-y-1.5">
          {[
            { icon: Calendar, label: 'Matcher spelade', value: user?.matches_played || 0, color: 'text-[#F4F7F5]', iconColor: 'text-[#2BA84A]' },
            { icon: Star, label: 'MVPs', value: user?.mvp_count || 0, color: 'text-[#F4743B]', iconColor: 'text-[#F4743B]' },
            { icon: Flame, label: 'Nuvarande streak', value: user?.current_streak || 0, color: 'text-[#F4743B]', iconColor: 'text-[#F4743B]' },
            { icon: Award, label: 'Längsta streak', value: user?.longest_streak || 0, color: 'text-[#F4F7F5]', iconColor: 'text-[#2BA84A]' },
          ].map((stat, idx) => {
            const StatIcon = stat.icon;
            return (
              <div key={idx} className="flex items-center justify-between p-3.5 bg-[#18221E] rounded-xl">
                <div className="flex items-center gap-2.5">
                  <StatIcon className={`w-4 h-4 ${stat.iconColor}`} />
                  <span className="text-[13px] text-[#B6C2BC] font-medium">{stat.label}</span>
                </div>
                <span className={`text-lg font-bold tabular-nums ${stat.color}`}>{stat.value}</span>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
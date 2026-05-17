import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Trophy, Target, Flame, Calendar, Star, Award, Shield, Crown,
  TrendingUp, MapPin, Percent, CheckCircle2, Activity
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useSupabaseAuth } from "@/components/supabase/AuthProvider";
import { updateProfile } from "@/components/supabase/services";
import { motion } from "framer-motion";
import { useT } from "@/i18n/LanguageProvider";

const SKILL_LEVEL_STYLE = {
  beginner:     { icon: Target,     color: 'from-[#10B981] to-[#059669]', textColor: 'text-[#A7F3D0]', ringColor: 'ring-[#10B981]/30' },
  intermediate: { icon: TrendingUp, color: 'from-[#14B8A6] to-[#0D9488]', textColor: 'text-[#99F6E4]', ringColor: 'ring-[#14B8A6]/30' },
  advanced:     { icon: Shield,     color: 'from-[#8B5CF6] to-[#7C3AED]', textColor: 'text-[#DDD6FE]', ringColor: 'ring-[#8B5CF6]/30' },
  elite:        { icon: Crown,      color: 'from-[#F59E0B] to-[#D97706]', textColor: 'text-[#FDE68A]', ringColor: 'ring-[#F59E0B]/30' },
};

/**
 * Computes derived stats from match history when the user object's
 * counters are missing or stale. Backend counters (matches_played,
 * mvp_count) take precedence when present.
 */
function computeStats(user, matchHistory = []) {
  const completed = matchHistory.filter(m => m.status === 'completed' || m.status === 'finished');
  const upcomingCount = matchHistory.filter(m => m.status === 'upcoming').length;

  // Win/loss derived from final_score (best-effort — we can't know which side user was on
  // without participant team data, so we only show total played + completion rate).
  const totalPlayed = user?.matches_played ?? completed.length;
  const completionRate = matchHistory.length > 0
    ? Math.round((completed.length / matchHistory.length) * 100)
    : 0;

  // Most-visited venue
  const venueCounts = {};
  matchHistory.forEach(m => {
    const key = m.venue_name || m._venue_name || m.pitch_name;
    if (key) venueCounts[key] = (venueCounts[key] || 0) + 1;
  });
  const topVenue = Object.entries(venueCounts).sort((a, b) => b[1] - a[1])[0];

  return {
    totalPlayed,
    completedCount: completed.length,
    upcomingCount,
    mvpCount: user?.mvp_count ?? 0,
    currentStreak: user?.current_streak ?? 0,
    longestStreak: user?.longest_streak ?? 0,
    eloRating: user?.elo_rating ?? null,
    completionRate,
    topVenue: topVenue ? { name: topVenue[0], count: topVenue[1] } : null,
  };
}

function StatTile({ icon: Icon, label, value, sub, accent = '#2BA84A', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="relative overflow-hidden rounded-2xl bg-[#18221E] border border-[#223029] p-4"
    >
      <div
        className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-30 pointer-events-none"
        style={{ background: accent }}
      />
      <div className="relative flex items-start justify-between mb-2">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${accent}22`, border: `1px solid ${accent}33` }}
        >
          <Icon className="w-4 h-4" style={{ color: accent }} strokeWidth={2.4} />
        </div>
      </div>
      <div className="relative">
        <div className="text-[26px] leading-none font-black text-white tabular-nums">
          {value}
        </div>
        <div className="text-[11px] text-[#9EAAA4] font-semibold uppercase tracking-wider mt-1.5">
          {label}
        </div>
        {sub && (
          <div className="text-[11px] text-[#6B7C74] mt-0.5 truncate">{sub}</div>
        )}
      </div>
    </motion.div>
  );
}

export default function ProfileStats({ user, matchHistory = [], isOwnProfile = true }) {
  const { t } = useT();
  const [isEditingSkill, setIsEditingSkill] = React.useState(false);
  const [isSavingSkill, setIsSavingSkill] = React.useState(false);
  const [selectedSkill, setSelectedSkill] = React.useState(user?.skill_level || 'intermediate');
  const queryClient = useQueryClient();
  const { user: authUser } = useSupabaseAuth();

  const stats = useMemo(() => computeStats(user, matchHistory), [user, matchHistory]);

  const skillLevelConfig = Object.fromEntries(
    Object.entries(SKILL_LEVEL_STYLE).map(([key, val]) => [key, { ...val, label: t(`profile.skill.${key}`) }])
  );

  const handleSkillUpdate = async () => {
    setIsSavingSkill(true);
    try {
      await updateProfile({ skill_level: selectedSkill });
      queryClient.setQueryData(['supabase-userProfile', authUser?.id], (old) => ({
        ...old,
        skill_level: selectedSkill,
      }));
      queryClient.invalidateQueries({ queryKey: ['supabase-userProfile'] });
      setIsEditingSkill(false);
    } catch (error) {
      console.error('Error updating skill level:', error);
    } finally {
      setIsSavingSkill(false);
    }
  };

  const currentSkill = skillLevelConfig[user?.skill_level || 'intermediate'];
  const SkillIcon = currentSkill.icon;

  return (
    <div className="space-y-4">
      {/* ── Key stats grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile
          icon={Calendar}
          label={t('profile.stats.tile_matches')}
          value={stats.totalPlayed}
          sub={stats.upcomingCount > 0 ? t('profile.stats.upcoming', { n: stats.upcomingCount }) : null}
          accent="#2BA84A"
          delay={0}
        />
        <StatTile
          icon={Crown}
          label={t('profile.stats.tile_mvp')}
          value={stats.mvpCount}
          sub={stats.mvpCount > 0 ? t('profile.stats.voted_best') : t('profile.stats.none_yet')}
          accent="#F4743B"
          delay={0.05}
        />
        <StatTile
          icon={Flame}
          label={t('profile.stats.tile_streak')}
          value={stats.currentStreak}
          sub={stats.longestStreak > stats.currentStreak ? `${t('profile.stats.long_streak')}: ${stats.longestStreak}` : null}
          accent="#F59E0B"
          delay={0.1}
        />
        <StatTile
          icon={Activity}
          label={t('profile.stats.tile_activity')}
          value={`${stats.completionRate}%`}
          sub={t('profile.stats.completed_count', { n: stats.completedCount })}
          accent="#4169E1"
          delay={0.15}
        />
      </div>

      {/* ── Detail row ── */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Skill level card */}
        <Card className="bg-[#121715] border border-[#223029] rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-[#223029] px-5 py-4">
            <CardTitle className="text-sm text-[#F4F7F5] flex items-center gap-2 font-bold">
              <div className="w-7 h-7 rounded-lg bg-[#2BA84A]/12 flex items-center justify-center">
                <Target className="w-3.5 h-3.5 text-[#2BA84A]" />
              </div>
              {isOwnProfile ? t('profile.stats.my_level') : t('profile.stats.player_level')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {isEditingSkill && isOwnProfile ? (
              <div className="space-y-4">
                <Label className="text-[#B6C2BC] text-[13px] font-medium">
                  {t('profile.stats.choose_level')}
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(skillLevelConfig).map(([value, config]) => {
                    const Icon = config.icon;
                    return (
                      <button
                        key={value}
                        onClick={() => setSelectedSkill(value)}
                        className={`p-4 rounded-xl font-semibold text-[13px] transition-all border flex flex-col items-center gap-2 ${
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
                    disabled={isSavingSkill}
                    className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-[#2BA84A] px-5 text-white transition-all hover:bg-[#248232] font-semibold disabled:opacity-50"
                  >
                    {isSavingSkill ? t('profile.stats.saving') : t('common.save')}
                  </button>
                  <button
                    onClick={() => setIsEditingSkill(false)}
                    className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border border-[#223029] px-5 text-[#B6C2BC] transition-all hover:bg-[#18221E] font-semibold"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center mb-5">
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${currentSkill.color} flex items-center justify-center shadow-[0_6px_18px_rgba(0,0,0,0.22)] ring-2 ${currentSkill.ringColor}`}>
                    <SkillIcon className="w-10 h-10 text-white" />
                  </div>
                </div>
                <div className="text-center mb-4">
                  <div className={`text-lg font-bold ${currentSkill.textColor}`}>
                    {currentSkill.label}
                  </div>
                  <p className="text-xs text-[#B6C2BC] mt-0.5">
                    {isOwnProfile ? t('profile.stats.your_level') : t('profile.stats.their_level')}
                  </p>
                </div>
                {isOwnProfile && (
                  <button
                    onClick={() => setIsEditingSkill(true)}
                    className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border border-[#2BA84A]/35 px-5 text-[#CFE8D6] transition-all hover:bg-[#2BA84A]/10 font-semibold"
                  >
                    {t('profile.stats.change_level')}
                  </button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Performance detail card */}
        <Card className="bg-[#121715] border border-[#223029] rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-[#223029] px-5 py-4">
            <CardTitle className="text-sm text-[#F4F7F5] flex items-center gap-2 font-bold">
              <div className="w-7 h-7 rounded-lg bg-[#F4743B]/12 flex items-center justify-center">
                <Trophy className="w-3.5 h-3.5 text-[#F4743B]" />
              </div>
              {t('profile.stats.performance')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-1.5">
            {[
              { icon: CheckCircle2, label: t('profile.stats.completed_matches'), value: stats.completedCount, iconColor: 'text-[#2BA84A]' },
              { icon: Star, label: t('profile.stats.mvp_votes'), value: stats.mvpCount, iconColor: 'text-[#F4743B]', valueColor: 'text-[#F4743B]' },
              { icon: Flame, label: t('profile.stats.cur_streak'), value: stats.currentStreak, iconColor: 'text-[#F59E0B]', valueColor: 'text-[#FCD34D]' },
              { icon: Award, label: t('profile.stats.long_streak'), value: stats.longestStreak, iconColor: 'text-[#2BA84A]' },
              ...(stats.eloRating ? [{ icon: TrendingUp, label: t('profile.stats.elo'), value: stats.eloRating, iconColor: 'text-[#4169E1]', valueColor: 'text-[#93B4F5]' }] : []),
              ...(stats.topVenue ? [{ icon: MapPin, label: t('profile.stats.fav_venue'), value: `${stats.topVenue.count}x`, sub: stats.topVenue.name, iconColor: 'text-[#9370DB]' }] : []),
            ].map((stat, idx) => {
              const StatIcon = stat.icon;
              return (
                <div key={idx} className="flex items-center justify-between p-3 bg-[#18221E] rounded-xl">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <StatIcon className={`w-4 h-4 flex-shrink-0 ${stat.iconColor}`} />
                    <div className="min-w-0">
                      <span className="text-[13px] text-[#B6C2BC] font-medium truncate block">{stat.label}</span>
                      {stat.sub && (
                        <span className="text-[11px] text-[#6B7C74] truncate block">{stat.sub}</span>
                      )}
                    </div>
                  </div>
                  <span className={`text-lg font-bold tabular-nums flex-shrink-0 ml-2 ${stat.valueColor || 'text-[#F4F7F5]'}`}>
                    {stat.value}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
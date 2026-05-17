import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, UserPlus, Users as UsersIcon, Clock, Crown } from "lucide-react";
import { createPageUrl } from "@/utils";
import RankBadge from "@/components/rank/RankBadge";
import { useT } from "@/i18n/LanguageProvider";

const SKILL_DOTS = {
  beginner: "#86EFAC",
  intermediate: "#34C257",
  advanced: "#A78BFA",
  elite: "#FBBF24",
  pro: "#FBBF24",
};

export default function ParticipantGrid({
  participants,
  currentUserId,
  maxPlayers,
  isSpontaneous,
  friendStatusMap,
  onAddFriend,
  onMvpVote,
  mvpUserId,
  isCompleted,
}) {
  const { t } = useT();
  const safeParticipants = Array.isArray(participants) ? participants : [];
  const checkedInCount = safeParticipants.filter(p => p.participantInfo?.checked_in).length;
  const emptySlots = !isSpontaneous && maxPlayers ? Math.max(0, maxPlayers - safeParticipants.length) : 0;

  if (safeParticipants.length === 0) {
    return (
      <div className="text-center py-12 rounded-2xl bg-[#121715] ring-1 ring-[#223029]">
        <div className="w-16 h-16 rounded-2xl bg-[#2BA84A]/12 ring-1 ring-[#2BA84A]/25 flex items-center justify-center mx-auto mb-4">
          <UsersIcon className="w-7 h-7 text-[#86EFAC]" />
        </div>
        <h3 className="text-[17px] font-bold text-[#F4F7F5] mb-1">{t('participants.empty_title')}</h3>
        <p className="text-sm text-[#9EAAA4]">{t('participants.be_first')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Check-in stat bar */}
      {!isCompleted && (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#121715] ring-1 ring-[#223029]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#2BA84A]/12 ring-1 ring-[#2BA84A]/25 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-[#86EFAC]" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#F4F7F5]">
                {t('participants.checked_in', { n: checkedInCount, total: safeParticipants.length })}
              </div>
              <div className="text-[11px] text-[#9EAAA4]">{t('participants.checkin_opens')}</div>
            </div>
          </div>
          <div className="text-xs font-bold text-[#86EFAC] tabular-nums">
            {safeParticipants.length > 0 ? Math.round((checkedInCount / safeParticipants.length) * 100) : 0}%
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {safeParticipants.map((p, idx) => (
          <ParticipantCard
            key={p.id || p.user_id || idx}
            participant={p}
            isCurrentUser={p.id === currentUserId}
            friendStatus={friendStatusMap?.[p.id]}
            onAddFriend={() => onAddFriend?.(p.id)}
            onMvpVote={isCompleted ? () => onMvpVote?.(p.id) : null}
            isMvp={mvpUserId === p.id}
            index={idx}
            t={t}
          />
        ))}

        {/* Empty slot placeholders */}
        {!isCompleted && Array.from({ length: Math.min(emptySlots, 8) }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="h-[172px] rounded-2xl border-2 border-dashed border-[#223029] flex flex-col items-center justify-center text-[#5A6660]"
          >
            <UserPlus className="w-5 h-5 mb-1 opacity-50" />
            <span className="text-[11px] font-medium">{t('participants.empty_slot')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ParticipantCard({ participant, isCurrentUser, friendStatus, onAddFriend, onMvpVote, isMvp, index, t }) {
  const name = participant.display_name || participant.full_name || t('common.player');
  const initial = (name[0] || "?").toUpperCase();
  const dot = SKILL_DOTS[participant.skill_level];
  const checkedIn = participant.participantInfo?.checked_in;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3) }}
      className={`relative rounded-2xl bg-[#121715] ring-1 ${isMvp ? "ring-[#F4743B]/50" : "ring-[#223029]"} overflow-hidden hover:ring-[#2BA84A]/40 transition-all`}
    >
      {isMvp && (
        <div className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 h-6 rounded-full bg-[#F4743B] text-white shadow-[0_4px_12px_rgba(244,116,59,0.4)] z-10">
          <Crown className="w-3 h-3" />
          <span className="text-[9px] font-black uppercase">MVP</span>
        </div>
      )}

      <Link to={`${createPageUrl("Profile")}?userId=${participant.id}`} className="block p-3">
        <div className="flex items-start gap-3 mb-3">
          <div className="relative flex-shrink-0">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#2BA84A] to-[#1E7A36] flex items-center justify-center overflow-hidden ring-2 ring-[#18221E]">
              {participant.avatar_url ? (
                <img src={participant.avatar_url} alt={name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-sm">{initial}</span>
              )}
            </div>
            {checkedIn && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#2BA84A] ring-2 ring-[#121715] flex items-center justify-center">
                <CheckCircle2 className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-bold text-[#F4F7F5] truncate">{name}</div>
            {participant.city && (
              <div className="text-[11px] text-[#9EAAA4] truncate">{participant.city}</div>
            )}
            {dot && (
              <div className="flex items-center gap-1 mt-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: dot }} />
                <span className="text-[10px] text-[#9EAAA4] capitalize">{participant.skill_level}</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <StatPill label={t('profile.hero.matches_label')} value={participant.matches_played || 0} />
          <StatPill label="MVP" value={participant.mvp_count || 0} accent />
        </div>
        <div className="mt-2 flex justify-center">
          <RankBadge matchesPlayed={participant.matches_played || 0} size="sm" showLabel currentStreak={participant.current_streak || 0} />
        </div>
      </Link>

      {/* Actions */}
      {!isCurrentUser && (onMvpVote || friendStatus === "none") && (
        <div className="px-3 pb-3 pt-0">
          {onMvpVote ? (
            <button
              onClick={onMvpVote}
              className="w-full h-8 rounded-lg bg-[#F4743B]/12 ring-1 ring-[#F4743B]/30 text-[#FED7AA] text-[11px] font-bold hover:bg-[#F4743B]/20 transition-all flex items-center justify-center gap-1"
            >
              <Crown className="w-3 h-3" />
              {t('participants.vote_mvp')}
            </button>
          ) : friendStatus === "none" ? (
            <button
              onClick={(e) => { e.preventDefault(); onAddFriend?.(); }}
              className="w-full h-8 rounded-lg bg-[#2BA84A]/12 ring-1 ring-[#2BA84A]/30 text-[#CFE8D6] text-[11px] font-bold hover:bg-[#2BA84A]/20 transition-all flex items-center justify-center gap-1"
            >
              <UserPlus className="w-3 h-3" />
              {t('participants.add_friend')}
            </button>
          ) : friendStatus === "friends" ? (
            <div className="w-full h-8 rounded-lg bg-[#2BA84A]/8 text-[#86EFAC] text-[11px] font-bold flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {t('participants.friend')}
            </div>
          ) : friendStatus === "pending_sent" ? (
            <div className="w-full h-8 rounded-lg bg-[#18221E] text-[#9EAAA4] text-[11px] font-medium flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" />
              {t('participants.sent')}
            </div>
          ) : null}
        </div>
      )}
    </motion.div>
  );
}

function StatPill({ label, value, accent }) {
  return (
    <div className="px-2 py-1.5 rounded-lg bg-[#0F1513] text-center">
      <div className="text-[9px] font-bold text-[#9EAAA4] uppercase tracking-wider">{label}</div>
      <div className={`text-sm font-black tabular-nums ${accent ? "text-[#F4743B]" : "text-[#F4F7F5]"}`}>{value}</div>
    </div>
  );
}

import React from "react";
import { UserPlus, Share2, LogOut, Trophy, Calendar, Crown, Users, Loader2, Trash2 } from "lucide-react";
import { useT } from "@/i18n/LanguageProvider";

export default function MatchActionBar({
  match,
  isParticipant,
  isOrganizer,
  isAdmin,
  isCupMatch,
  canJoin,
  isCompleted,
  isActionLoading,
  onJoin,
  onLeave,
  onShare,
  onInvite,
  onCalendar,
  onEnd,
  onMvpVote,
  onDelete,
  onShowPlayers,
  checkInButton,
}) {
  const { t } = useT();

  return (
    <div className="relative z-10 -mx-4 sm:mx-0">
      <div className="bg-[#121715] ring-1 ring-[#223029] sm:rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.4)] p-3 sm:p-4">
        <div className="flex items-center gap-2">
          {/* Primary action */}
          <div className="flex-1 min-w-0">
            {isCupMatch && !isCompleted ? (
              <div className="h-12 flex items-center justify-center gap-2 rounded-xl bg-[#F59E0B]/12 ring-1 ring-[#F59E0B]/30 text-[#FCD34D] font-bold text-sm">
                <Crown className="w-4 h-4" />
                {t('match_action.cup_match')}
              </div>
            ) : canJoin ? (
              <PrimaryButton onClick={onJoin} disabled={isActionLoading} loading={isActionLoading} icon={UserPlus}>
                {t('match_action.join')}
              </PrimaryButton>
            ) : isCompleted && isParticipant ? (
              <PrimaryButton onClick={onMvpVote} icon={Crown} variant="accent">
                {t('match_action.vote_mvp')}
              </PrimaryButton>
            ) : isCompleted ? (
              <PrimaryButton onClick={onShowPlayers} icon={Users} variant="ghost">
                {t('match_action.see_players')}
              </PrimaryButton>
            ) : isOrganizer && match.status === "upcoming" ? (
              <PrimaryButton onClick={onEnd} icon={Trophy} variant="accent">
                {t('match_action.end_match')}
              </PrimaryButton>
            ) : isParticipant && checkInButton ? (
              <div className="w-full">{checkInButton}</div>
            ) : (
              <div className="h-12 flex items-center justify-center text-[#9EAAA4] font-medium text-sm">
                {match.status === "cancelled" ? t('match_action.cancelled') : t('match_action.full')}
              </div>
            )}
          </div>

          {/* Secondary icons */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isParticipant && match.status === "upcoming" && (
              <>
                <IconButton onClick={onInvite} icon={Share2} label={t('match_action.invite_friends')} />
                <IconButton onClick={onCalendar} icon={Calendar} label={t('match_action.add_calendar')} />
                <IconButton onClick={onLeave} icon={LogOut} label={t('match_action.leave')} variant="danger" disabled={isActionLoading} />
              </>
            )}
            {!isParticipant && match.status === "upcoming" && !isCupMatch && (
              <IconButton onClick={onShare || onInvite} icon={Share2} label={t('match_action.share')} />
            )}
            {(isOrganizer || isAdmin) && !isCompleted && (
              <IconButton onClick={onDelete} icon={Trash2} label={t('match_action.delete')} variant="danger" disabled={isActionLoading} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PrimaryButton({ children, onClick, disabled, loading, icon: Icon, variant = "primary" }) {
  const styles = {
    primary: "bg-[#2BA84A] hover:bg-[#34C257] text-white shadow-[0_8px_24px_rgba(43,168,74,0.35)]",
    accent: "bg-[#F4743B] hover:bg-[#FF8A4D] text-white shadow-[0_8px_24px_rgba(244,116,59,0.35)]",
    ghost: "bg-[#18221E] hover:bg-[#223029] text-[#F4F7F5] ring-1 ring-[#2A3A32]",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full h-12 flex items-center justify-center gap-2 rounded-xl font-bold text-sm transition-all ${styles[variant]} ${disabled ? "opacity-60 cursor-not-allowed" : "hover:scale-[1.01] active:scale-[0.99]"}`}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : Icon && <Icon className="w-4 h-4" />}
      <span className="truncate">{children}</span>
    </button>
  );
}

function IconButton({ onClick, icon: Icon, label, variant = "default", disabled }) {
  const styles = {
    default: "bg-[#18221E] hover:bg-[#223029] text-[#C2CEC8] ring-1 ring-[#223029]",
    danger: "bg-[#18221E] hover:bg-[#DC2626]/15 text-[#F87171] ring-1 ring-[#DC2626]/20",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`h-12 w-12 flex items-center justify-center rounded-xl transition-all ${styles[variant]} ${disabled ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.04] active:scale-[0.96]"}`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

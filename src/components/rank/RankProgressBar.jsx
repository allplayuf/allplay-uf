import { getRankFromMatches, getProgressToNext } from '@/lib/rankEngine';

export default function RankProgressBar({ matchesPlayed = 0, currentStreak = 0, className = '' }) {
  const rank     = getRankFromMatches(matchesPlayed, currentStreak);
  const progress = getProgressToNext(matchesPlayed, currentStreak);
  const maxed    = !progress.nextLabel;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {rank.streakBonus && (
        <p className="text-[11px] font-semibold text-amber-400 text-center leading-tight">
          🔥 Streakbonus aktiv — varje match räknas dubbelt
        </p>
      )}

      <div
        className="h-2 rounded-full w-full overflow-hidden"
        style={{ background: `${rank.accent}25` }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${maxed ? 100 : progress.percent}%`,
            background: `linear-gradient(90deg, ${rank.accent}BB, ${rank.accent})`,
            boxShadow: `0 0 8px ${rank.accent}77`,
          }}
        />
      </div>

      <p className="text-[11px] text-center" style={{ color: `${rank.accent}88` }}>
        {maxed ? (
          'Maxrang uppnådd'
        ) : (
          <>
            {progress.matchesNeeded} matcher till{' '}
            <span style={{ color: rank.accent, fontWeight: 600 }}>{progress.nextLabel}</span>
          </>
        )}
      </p>
    </div>
  );
}

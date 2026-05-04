import { getRankFromMatches, getProgressToNext } from '@/lib/rankEngine';

export default function RankProgressBar({ matchesPlayed = 0, className = '' }) {
  const rank    = getRankFromMatches(matchesPlayed);
  const progress = getProgressToNext(matchesPlayed);

  if (progress.percent === 100 && !progress.nextLabel) {
    return (
      <div className={`flex flex-col gap-1 ${className}`}>
        <div className="h-1.5 rounded-full w-full" style={{ background: `${rank.accent}30` }}>
          <div className="h-full rounded-full w-full" style={{ background: rank.accent }} />
        </div>
        <p className="text-xs text-center" style={{ color: `${rank.accent}99` }}>
          Maxrang uppnådd
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div
        className="h-1.5 rounded-full w-full overflow-hidden"
        style={{ background: `${rank.accent}25` }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${progress.percent}%`,
            background: `linear-gradient(90deg, ${rank.accent}BB, ${rank.accent})`,
            boxShadow: `0 0 6px ${rank.accent}66`,
          }}
        />
      </div>
      {progress.nextLabel && (
        <p className="text-[11px] text-center" style={{ color: `${rank.accent}88` }}>
          {progress.matchesNeeded} matcher till{' '}
          <span style={{ color: rank.accent, fontWeight: 600 }}>{progress.nextLabel}</span>
        </p>
      )}
    </div>
  );
}

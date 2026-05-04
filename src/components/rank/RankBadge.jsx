import { getRankFromMatches } from '@/lib/rankEngine';

const C = 50;

function poly(n, r, angleDeg = -90) {
  return Array.from({ length: n }, (_, i) => {
    const a = ((i / n) * 360 + angleDeg) * (Math.PI / 180);
    return `${(C + r * Math.cos(a)).toFixed(2)},${(C + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
}

function star(n, rO, rI, angleDeg = -90) {
  return Array.from({ length: n * 2 }, (_, i) => {
    const a = ((i / (n * 2)) * 360 + angleDeg) * (Math.PI / 180);
    const radius = i % 2 === 0 ? rO : rI;
    return `${(C + radius * Math.cos(a)).toFixed(2)},${(C + radius * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
}

// viewBox "0 0 100 100". Outer: accent25 fill + accent stroke. Inner: accent fill ~0.82 opacity.
const SHAPES = {
  1: (a) => (
    <>
      <circle cx={C} cy={C} r={40} fill={`${a}25`} stroke={a} strokeWidth={5} />
      <circle cx={C} cy={C} r={23} fill={a} opacity={0.82} />
    </>
  ),
  2: (a) => (
    <>
      <polygon points={poly(4, 40, 0)} fill={`${a}25`} stroke={a} strokeWidth={5} />
      <polygon points={poly(4, 24, 0)} fill={a} opacity={0.82} />
    </>
  ),
  3: (a) => (
    <>
      <polygon points={poly(3, 40, -90)} fill={`${a}25`} stroke={a} strokeWidth={5} />
      <polygon points={poly(3, 24, -90)} fill={a} opacity={0.82} />
    </>
  ),
  4: (a) => (
    <>
      <polygon points={poly(5, 40, -90)} fill={`${a}25`} stroke={a} strokeWidth={5} />
      <polygon points={poly(5, 24, -90)} fill={a} opacity={0.82} />
    </>
  ),
  5: (a) => (
    <>
      <polygon points={poly(6, 40, -30)} fill={`${a}25`} stroke={a} strokeWidth={5} />
      <polygon points={poly(6, 24, -30)} fill={a} opacity={0.82} />
    </>
  ),
  6: (a) => (
    <>
      <polygon points={star(8, 40, 20, -90)} fill={`${a}25`} stroke={a} strokeWidth={4} />
      <polygon points={star(8, 24, 12, -90)} fill={a} opacity={0.82} />
    </>
  ),
  7: (a) => (
    <>
      <polygon points={star(6, 40, 20, -90)} fill={`${a}25`} stroke={a} strokeWidth={4} />
      <polygon points={star(6, 24, 12, -90)} fill={a} opacity={0.82} />
    </>
  ),
  8: (a) => (
    <>
      <polygon points="15,78 15,34 50,20 85,34 85,78" fill={`${a}25`} stroke={a} strokeWidth={5} />
      <circle cx={15} cy={34} r={7} fill={a} opacity={0.85} />
      <circle cx={50} cy={20} r={7} fill={a} opacity={0.85} />
      <circle cx={85} cy={34} r={7} fill={a} opacity={0.85} />
    </>
  ),
  9: (a) => (
    <>
      <polygon points={star(8, 40, 26, -90)} fill={`${a}25`} stroke={a} strokeWidth={4} />
      <polygon points={star(8, 24, 16, -90)} fill={a} opacity={0.82} />
    </>
  ),
  10: (a) => (
    <>
      <polygon points={star(12, 40, 28, -90)} fill={`${a}25`} stroke={a} strokeWidth={4} />
      <polygon points={star(12, 24, 17, -90)} fill={a} opacity={0.82} />
    </>
  ),
};

const SIZES = { sm: 24, md: 44, lg: 68 };

function DivChip({ roman, division, divColor, fontSize = 11 }) {
  if (!roman || !division) return null;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: 100,
      background: `${divColor}25`,
      border: `1px solid ${divColor}`,
      fontSize,
      fontWeight: 700,
      color: divColor,
      letterSpacing: '0.05em',
      lineHeight: 1.5,
      whiteSpace: 'nowrap',
    }}>
      {roman} · {division}
    </span>
  );
}

export default function RankBadge({ matchesPlayed = 0, currentStreak = 0, size = 'md', showLabel = false }) {
  const rank = getRankFromMatches(matchesPlayed, currentStreak);
  const { accent, divColor, tier, name, roman, division, label } = rank;
  const ShapeFn = SHAPES[tier];
  const px = SIZES[size] ?? SIZES.md;

  if (size === 'sm') {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 8px 3px 4px',
        borderRadius: 100,
        background: `${accent}18`,
        border: `1px solid ${accent}40`,
      }}>
        <span style={{ position: 'relative', display: 'inline-block', width: px, height: px, flexShrink: 0 }}>
          <svg width={px} height={px} viewBox="0 0 100 100" style={{ display: 'block', filter: `drop-shadow(0 0 3px ${accent}80)` }}>
            <rect width={100} height={100} rx={20} fill="#0F1513" />
            {ShapeFn ? ShapeFn(accent) : null}
          </svg>
          {currentStreak > 0 && (
            <span style={{ position: 'absolute', bottom: -3, right: -4, fontSize: 8, lineHeight: 1 }}>🔥</span>
          )}
        </span>
        {showLabel && (
          <span style={{ fontSize: 10, fontWeight: 700, color: accent, letterSpacing: '0.04em', lineHeight: 1, whiteSpace: 'nowrap' }}>
            {label}
          </span>
        )}
      </span>
    );
  }

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <span style={{ position: 'relative', display: 'inline-block' }}>
        <svg
          width={px}
          height={px}
          viewBox="0 0 100 100"
          style={{ display: 'block', filter: `drop-shadow(0 0 ${Math.round(px * 0.12)}px ${accent}88)` }}
        >
          <rect width={100} height={100} rx={20} fill="#0F1513" />
          {ShapeFn ? ShapeFn(accent) : null}
        </svg>
        {currentStreak > 0 && (
          <span style={{
            position: 'absolute',
            bottom: -5,
            right: -8,
            fontSize: size === 'lg' ? 11 : 9,
            fontWeight: 800,
            background: 'rgba(0,0,0,0.78)',
            borderRadius: 8,
            padding: '1px 4px',
            color: '#FDE68A',
            lineHeight: 1.4,
            whiteSpace: 'nowrap',
          }}>🔥×2</span>
        )}
      </span>

      <DivChip roman={roman} division={division} divColor={divColor} fontSize={size === 'lg' ? 11 : 9} />

      {showLabel && (
        <span style={{
          fontSize: size === 'lg' ? 12 : 9,
          fontWeight: 700,
          color: accent,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          lineHeight: 1,
        }}>
          {name}
        </span>
      )}
    </div>
  );
}

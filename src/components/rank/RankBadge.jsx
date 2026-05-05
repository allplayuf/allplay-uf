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

const SHAPES = {
  // Tier 1 – Nykomlingen: circle + soccer ball
  1: (a) => (
    <>
      <circle cx="50" cy="50" r="40" fill={`${a}25`} stroke={a} strokeWidth="5" />
      <circle cx="50" cy="50" r="20" fill="none" stroke={a} strokeWidth="2.5" opacity="0.65" />
      <polygon points={poly(5, 9, -90)} fill={a} opacity="0.9" />
      <line x1="50" y1="41" x2="50" y2="30" stroke={a} strokeWidth="2" opacity="0.6" />
      <line x1="59" y1="47" x2="69" y2="44" stroke={a} strokeWidth="2" opacity="0.6" />
      <line x1="55" y1="57" x2="62" y2="66" stroke={a} strokeWidth="2" opacity="0.6" />
      <line x1="45" y1="57" x2="38" y2="66" stroke={a} strokeWidth="2" opacity="0.6" />
      <line x1="41" y1="47" x2="31" y2="44" stroke={a} strokeWidth="2" opacity="0.6" />
    </>
  ),

  // Tier 2 – Gatubollaren: flat-top hex + double upward chevron
  2: (a) => (
    <>
      <polygon points={poly(6, 40, -30)} fill={`${a}25`} stroke={a} strokeWidth="5" />
      <polyline points="33,68 50,52 67,68" fill="none" stroke={a} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
      <polyline points="33,48 50,32 67,48" fill="none" stroke={a} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
    </>
  ),

  // Tier 3 – Regularen: circle + crosshair target
  3: (a) => (
    <>
      <circle cx="50" cy="50" r="40" fill={`${a}25`} stroke={a} strokeWidth="5" />
      <circle cx="50" cy="50" r="18" fill="none" stroke={a} strokeWidth="3" opacity="0.85" />
      <circle cx="50" cy="50" r="5" fill={a} opacity="0.9" />
      <line x1="50" y1="20" x2="50" y2="29" stroke={a} strokeWidth="3.5" strokeLinecap="round" opacity="0.85" />
      <line x1="50" y1="71" x2="50" y2="80" stroke={a} strokeWidth="3.5" strokeLinecap="round" opacity="0.85" />
      <line x1="20" y1="50" x2="29" y2="50" stroke={a} strokeWidth="3.5" strokeLinecap="round" opacity="0.85" />
      <line x1="71" y1="50" x2="80" y2="50" stroke={a} strokeWidth="3.5" strokeLinecap="round" opacity="0.85" />
    </>
  ),

  // Tier 4 – Hustlern: pentagon + lightning bolt
  4: (a) => (
    <>
      <polygon points={poly(5, 40, -90)} fill={`${a}25`} stroke={a} strokeWidth="5" />
      <polyline points="55,22 40,52 53,52 45,78" fill="none" stroke={a} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.88" />
    </>
  ),

  // Tier 5 – Veteranen: vertex-top hex + three rising signal bars
  5: (a) => (
    <>
      <polygon points={poly(6, 40, -90)} fill={`${a}25`} stroke={a} strokeWidth="5" />
      <rect x="28" y="58" width="11" height="14" rx="3" fill={a} opacity="0.85" />
      <rect x="44" y="48" width="11" height="24" rx="3" fill={a} opacity="0.85" />
      <rect x="60" y="38" width="11" height="34" rx="3" fill={a} opacity="0.85" />
    </>
  ),

  // Tier 6 – Specialisten: flat-top hex + faceted diamond gem
  6: (a) => (
    <>
      <polygon points={poly(6, 40, -30)} fill={`${a}25`} stroke={a} strokeWidth="5" />
      <polygon points="30,50 50,26 70,50" fill={a} opacity="0.85" />
      <polygon points="30,50 70,50 50,74" fill={a} opacity="0.65" />
      <line x1="50" y1="26" x2="40" y2="50" stroke={a} strokeWidth="2" opacity="0.4" />
      <line x1="50" y1="26" x2="60" y2="50" stroke={a} strokeWidth="2" opacity="0.4" />
    </>
  ),

  // Tier 7 – Elitspelaren: flat-top hex + crown
  7: (a) => (
    <>
      <polygon points={poly(6, 40, -30)} fill={`${a}25`} stroke={a} strokeWidth="5" />
      <path d="M28,70 L28,46 L38,57 L50,30 L62,57 L72,46 L72,70 Z" fill={a} opacity="0.82" />
      <circle cx="28" cy="44" r="5" fill={a} opacity="0.92" />
      <circle cx="50" cy="28" r="5" fill={a} opacity="0.92" />
      <circle cx="72" cy="44" r="5" fill={a} opacity="0.92" />
    </>
  ),

  // Tier 8 – Legenden: octagon + 4-point star
  8: (a) => (
    <>
      <polygon points={poly(8, 40, -22.5)} fill={`${a}25`} stroke={a} strokeWidth="5" />
      <polygon points={star(4, 26, 10, -90)} fill={a} opacity="0.85" />
    </>
  ),

  // Tier 9 – Ikonen: octagon + 5-point star
  9: (a) => (
    <>
      <polygon points={poly(8, 40, -22.5)} fill={`${a}25`} stroke={a} strokeWidth="5" />
      <polygon points={star(5, 26, 11, -90)} fill={a} opacity="0.85" />
    </>
  ),

  // Tier 10 – Odödlig: double-ring circle + 8-point radiant star + accent diamond
  10: (a) => (
    <>
      <circle cx="50" cy="50" r="40" fill={`${a}25`} stroke={a} strokeWidth="4" />
      <circle cx="50" cy="50" r="33" fill="none" stroke={a} strokeWidth="1.5" opacity="0.4" />
      <polygon points={star(8, 22, 9, -90)} fill={a} opacity="0.88" />
      <polygon points={star(4, 36, 33, -45)} fill={a} opacity="0.32" />
    </>
  ),
};

const SIZES = { sm: 24, md: 44, lg: 68 };

function DivChip({ division, divColor, fontSize = 11 }) {
  if (!division) return null;
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
      {division}
    </span>
  );
}

export default function RankBadge({ matchesPlayed = 0, currentStreak = 0, size = 'md', showLabel = false, showDivChip = true }) {
  const rank = getRankFromMatches(matchesPlayed, currentStreak);
  const { accent, divColor, tier, name, division, label } = rank;
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

      {showDivChip && <DivChip division={division} divColor={divColor} fontSize={size === 'lg' ? 11 : 9} />}

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

import { getRankFromMatches } from '@/lib/rankEngine';

const DIVISION_COLORS = {
  Brons:  '#CD7F32',
  Silver: '#C0C0C0',
  Guld:   '#FFD700',
};

const SIZE = { sm: 28, md: 40, lg: 56 };
const FONT = { sm: 6, md: 8, lg: 11 };
const DOT  = { sm: 3, md: 4, lg: 5.5 };

// Each tier: a function(accent, s) => SVG inner content (no <svg> wrapper)
const SHAPES = {
  // Tier 1 — simple ring
  1: (accent, s) => (
    <circle cx={s/2} cy={s/2} r={s*0.38} fill="none" stroke={accent} strokeWidth={s*0.08} />
  ),
  // Tier 2 — diamond (rotated square)
  2: (accent, s) => {
    const c = s / 2, r = s * 0.38;
    const pts = `${c},${c-r} ${c+r},${c} ${c},${c+r} ${c-r},${c}`;
    return <polygon points={pts} fill="none" stroke={accent} strokeWidth={s*0.07} />;
  },
  // Tier 3 — upward triangle
  3: (accent, s) => {
    const c = s / 2, r = s * 0.40;
    const pts = `${c},${c-r} ${c+r*0.87},${c+r*0.5} ${c-r*0.87},${c+r*0.5}`;
    return <polygon points={pts} fill="none" stroke={accent} strokeWidth={s*0.07} />;
  },
  // Tier 4 — pentagon shield
  4: (accent, s) => {
    const c = s / 2, r = s * 0.38;
    const pts = Array.from({ length: 5 }, (_, i) => {
      const a = (i * 72 - 90) * (Math.PI / 180);
      return `${c + r * Math.cos(a)},${c + r * Math.sin(a)}`;
    }).join(' ');
    return <polygon points={pts} fill="none" stroke={accent} strokeWidth={s*0.07} />;
  },
  // Tier 5 — hexagon
  5: (accent, s) => {
    const c = s / 2, r = s * 0.40;
    const pts = Array.from({ length: 6 }, (_, i) => {
      const a = (i * 60 - 30) * (Math.PI / 180);
      return `${c + r * Math.cos(a)},${c + r * Math.sin(a)}`;
    }).join(' ');
    return <polygon points={pts} fill={`${accent}18`} stroke={accent} strokeWidth={s*0.07} />;
  },
  // Tier 6 — 8-pointed star (two overlapping squares)
  6: (accent, s) => {
    const c = s / 2, r = s * 0.38, ri = r * 0.55;
    const pts = Array.from({ length: 16 }, (_, i) => {
      const a = (i * 22.5 - 90) * (Math.PI / 180);
      const radius = i % 2 === 0 ? r : ri;
      return `${c + radius * Math.cos(a)},${c + radius * Math.sin(a)}`;
    }).join(' ');
    return <polygon points={pts} fill={`${accent}22`} stroke={accent} strokeWidth={s*0.06} />;
  },
  // Tier 7 — 6-pointed star (hexagram)
  7: (accent, s) => {
    const c = s / 2, r = s * 0.40, ri = r * 0.5;
    const pts = Array.from({ length: 12 }, (_, i) => {
      const a = (i * 30 - 90) * (Math.PI / 180);
      const radius = i % 2 === 0 ? r : ri;
      return `${c + radius * Math.cos(a)},${c + radius * Math.sin(a)}`;
    }).join(' ');
    return <polygon points={pts} fill={`${accent}22`} stroke={accent} strokeWidth={s*0.06} />;
  },
  // Tier 8 — crown
  8: (accent, s) => {
    const c = s / 2, t = s * 0.18, b = s * 0.72, spike = s * 0.15;
    const pts = [
      `${s*0.15},${b}`,
      `${s*0.15},${t+spike}`,
      `${c},${t+spike*1.8}`,
      `${s*0.85},${t+spike}`,
      `${s*0.85},${b}`,
    ].join(' ');
    return (
      <>
        <polygon points={pts} fill={`${accent}25`} stroke={accent} strokeWidth={s*0.06} />
        <circle cx={s*0.15} cy={t+spike} r={s*0.05} fill={accent} />
        <circle cx={c}      cy={t+spike*0.4} r={s*0.05} fill={accent} />
        <circle cx={s*0.85} cy={t+spike} r={s*0.05} fill={accent} />
      </>
    );
  },
  // Tier 9 — faceted crystal (elongated octagon)
  9: (accent, s) => {
    const c = s / 2, r = s * 0.40, ri = r * 0.65;
    const pts = Array.from({ length: 8 }, (_, i) => {
      const a = (i * 45 - 90) * (Math.PI / 180);
      const radius = i % 2 === 0 ? r : ri;
      return `${c + radius * Math.cos(a)},${c + radius * Math.sin(a)}`;
    }).join(' ');
    return (
      <>
        <polygon points={pts} fill={`${accent}28`} stroke={accent} strokeWidth={s*0.07} />
        <line x1={c} y1={s*0.12} x2={c} y2={s*0.88} stroke={`${accent}55`} strokeWidth={s*0.03} />
        <line x1={s*0.12} y1={c} x2={s*0.88} y2={c} stroke={`${accent}55`} strokeWidth={s*0.03} />
      </>
    );
  },
  // Tier 10 — 12-pointed burst
  10: (accent, s) => {
    const c = s / 2, r = s * 0.42, ri = r * 0.72;
    const pts = Array.from({ length: 24 }, (_, i) => {
      const a = (i * 15 - 90) * (Math.PI / 180);
      const radius = i % 2 === 0 ? r : ri;
      return `${c + radius * Math.cos(a)},${c + radius * Math.sin(a)}`;
    }).join(' ');
    return (
      <>
        <polygon points={pts} fill={`${accent}30`} stroke={accent} strokeWidth={s*0.055} />
        <circle cx={c} cy={c} r={s*0.14} fill={`${accent}60`} stroke={accent} strokeWidth={s*0.04} />
      </>
    );
  },
};

function DivisionDots({ division, accent, size }) {
  if (!division) return null;
  const count = division === 'Brons' ? 1 : division === 'Silver' ? 2 : 3;
  const color = DIVISION_COLORS[division];
  const r = DOT[size];
  const gap = r * 2.6;
  const total = count * gap - (gap - r * 2);

  return (
    <svg
      width={total + r * 2}
      height={r * 2 + 2}
      style={{ display: 'block', margin: '2px auto 0' }}
    >
      {Array.from({ length: count }, (_, i) => (
        <circle
          key={i}
          cx={r + i * gap}
          cy={r + 1}
          r={r}
          fill={color}
        />
      ))}
    </svg>
  );
}

export default function RankBadge({ matchesPlayed = 0, size = 'md', showLabel = false }) {
  const rank = getRankFromMatches(matchesPlayed);
  const s = SIZE[size] ?? SIZE.md;
  const ShapeFn = SHAPES[rank.tier];

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <svg
        width={s}
        height={s}
        viewBox={`0 0 ${s} ${s}`}
        style={{ display: 'block', filter: `drop-shadow(0 0 ${s*0.08}px ${rank.accent}88)` }}
      >
        <rect width={s} height={s} rx={s * 0.18} fill="#0F1513" />
        {ShapeFn ? ShapeFn(rank.accent, s) : null}
      </svg>

      <DivisionDots division={rank.division} accent={rank.accent} size={size} />

      {showLabel && (
        <span
          style={{
            fontSize: FONT[size],
            fontWeight: 600,
            color: rank.accent,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginTop: 2,
            lineHeight: 1,
          }}
        >
          {rank.label}
        </span>
      )}
    </div>
  );
}

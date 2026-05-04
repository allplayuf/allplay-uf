const TIERS = [
  { tier: 1,  name: 'Nykomlingen',   min: 0,   max: 2,   accent: '#94A3B8' },
  { tier: 2,  name: 'Gatubollaren',  min: 3,   max: 7,   accent: '#F97316' },
  { tier: 3,  name: 'Regularen',     min: 8,   max: 14,  accent: '#EAB308' },
  { tier: 4,  name: 'Hustlern',      min: 15,  max: 24,  accent: '#3B82F6' },
  { tier: 5,  name: 'Veteranen',     min: 25,  max: 44,  accent: '#10B981' },
  { tier: 6,  name: 'Specialisten',  min: 45,  max: 74,  accent: '#8B5CF6' },
  { tier: 7,  name: 'Elitspelaren',  min: 75,  max: 119, accent: '#F59E0B' },
  { tier: 8,  name: 'Legenden',      min: 120, max: 179, accent: '#EF4444' },
  { tier: 9,  name: 'Ikonen',        min: 180, max: 269, accent: '#06B6D4' },
  { tier: 10, name: 'Odödlig',       min: 270, max: Infinity, accent: '#E879F9' },
];

const DIVISIONS   = ['Brons', 'Silver', 'Guld'];
const ROMAN       = ['I', 'II', 'III'];
const DIV_COLORS  = { Brons: '#CD7F32', Silver: '#C0C0C0', Guld: '#FFD700' };

// When on a streak, every raw match counts double toward rank
export function effectiveMatches(n, streak = 0) {
  return streak > 0 ? (n || 0) * 2 : (n || 0);
}

function divIdx(n, min, max) {
  if (max === Infinity) return null;
  const third = Math.floor((max - min + 1) / 3);
  if (n < min + third)     return 0;
  if (n < min + third * 2) return 1;
  return 2;
}

export function getRankFromMatches(n, streak = 0) {
  const raw = Math.max(0, n || 0);
  const eff = effectiveMatches(raw, streak);
  const td  = TIERS.find(t => eff <= t.max) || TIERS[TIERS.length - 1];
  const di  = divIdx(eff, td.min, td.max);
  const division = di !== null ? DIVISIONS[di] : null;
  const roman    = di !== null ? ROMAN[di] : null;
  return {
    tier:        td.tier,
    name:        td.name,
    division,
    roman,
    divColor:    division ? DIV_COLORS[division] : td.accent,
    label:       division ? `${td.name} ${roman}` : td.name,
    accent:      td.accent,
    streakBonus: streak > 0,
  };
}

export function getProgressToNext(n, streak = 0) {
  const raw = Math.max(0, n || 0);
  const eff = effectiveMatches(raw, streak);
  const td  = TIERS.find(t => eff <= t.max);

  if (!td || td.max === Infinity) {
    return { percent: 100, matchesNeeded: 0, nextLabel: null };
  }

  const third = Math.floor((td.max - td.min + 1) / 3);
  const di = divIdx(eff, td.min, td.max);

  const divStart = td.min + di * third;
  const divEnd   = di < 2 ? td.min + (di + 1) * third - 1 : td.max;
  const isLast   = divEnd === td.max;
  const nextTd   = isLast ? TIERS[td.tier] : null;

  const divRange = divEnd - divStart + 1;
  const percent  = Math.min(100, Math.round(((eff - divStart) / divRange) * 100));

  // report actual matches the user needs to play (halved when streak active)
  const effNeeded = divEnd + 1 - eff;
  const rawNeeded = streak > 0 ? Math.max(1, Math.ceil(effNeeded / 2)) : effNeeded;

  let nextLabel;
  if (isLast && nextTd) {
    nextLabel = nextTd.name;
  } else if (!isLast) {
    nextLabel = `${td.name} ${ROMAN[di + 1]}`;
  } else {
    nextLabel = null;
  }

  return { percent, matchesNeeded: rawNeeded, nextLabel };
}

export { TIERS, DIVISIONS, DIV_COLORS, ROMAN };

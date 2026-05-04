const TIERS = [
  { tier: 1,  name: 'Nykomlingen',   min: 0,   max: 2,   accent: '#94A3B8' },
  { tier: 2,  name: 'Gatubollaren',  min: 3,   max: 7,   accent: '#F97316' },
  { tier: 3,  name: 'Regularen',     min: 8,   max: 14,  accent: '#D97706' },
  { tier: 4,  name: 'Hustlern',      min: 15,  max: 24,  accent: '#3B82F6' },
  { tier: 5,  name: 'Veteranen',     min: 25,  max: 44,  accent: '#10B981' },
  { tier: 6,  name: 'Specialisten',  min: 45,  max: 74,  accent: '#8B5CF6' },
  { tier: 7,  name: 'Elitspelaren',  min: 75,  max: 119, accent: '#FBBF24' },
  { tier: 8,  name: 'Legenden',      min: 120, max: 179, accent: '#F43F5E' },
  { tier: 9,  name: 'Ikonen',        min: 180, max: 269, accent: '#06B6D4' },
  { tier: 10, name: 'Odödlig',       min: 270, max: Infinity, accent: '#E879F9' },
];

function getDivision(n, min, max) {
  if (max === Infinity) return null;
  const range = max - min + 1;
  const third = Math.floor(range / 3);
  if (n < min + third)       return 'Brons';
  if (n < min + third * 2)   return 'Silver';
  return 'Guld';
}

export function getRankFromMatches(n) {
  const matches = Math.max(0, n || 0);
  const tierData = TIERS.find(t => matches <= t.max) || TIERS[TIERS.length - 1];
  const division = getDivision(matches, tierData.min, tierData.max);
  return {
    tier: tierData.tier,
    name: tierData.name,
    division,
    label: division ? `${tierData.name} ${division}` : tierData.name,
    accent: tierData.accent,
  };
}

export function getProgressToNext(n) {
  const matches = Math.max(0, n || 0);
  const tierData = TIERS.find(t => matches <= t.max);

  // Max rank
  if (!tierData || tierData.max === Infinity) {
    return { percent: 100, matchesNeeded: 0, nextLabel: null };
  }

  const range = tierData.max - tierData.min + 1;
  const third = Math.floor(range / 3);
  const divStart =
    matches < tierData.min + third     ? tierData.min :
    matches < tierData.min + third * 2 ? tierData.min + third :
                                         tierData.min + third * 2;

  const divEnd =
    matches < tierData.min + third     ? tierData.min + third - 1 :
    matches < tierData.min + third * 2 ? tierData.min + third * 2 - 1 :
                                         tierData.max;

  const isLastDivision = divEnd === tierData.max;
  const nextTierData = isLastDivision ? TIERS[tierData.tier] : null; // TIERS is 0-indexed, tier is 1-indexed

  const divRange = divEnd - divStart + 1;
  const progress = matches - divStart;
  const percent = Math.round((progress / divRange) * 100);

  let nextLabel;
  if (isLastDivision && nextTierData) {
    nextLabel = nextTierData.name;
  } else if (!isLastDivision) {
    const nextDiv = matches < tierData.min + third ? 'Silver' : 'Guld';
    nextLabel = `${tierData.name} ${nextDiv}`;
  } else {
    nextLabel = null;
  }

  return {
    percent: Math.min(100, percent),
    matchesNeeded: divEnd + 1 - matches,
    nextLabel,
  };
}

export { TIERS };

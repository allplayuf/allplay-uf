/**
 * Match Levels — Single Source of Truth
 * 
 * Used across: CreateMatchForm, MatchCard, MapView, Matches page, filters
 */

export const LEVELS = ['beginner', 'intermediate', 'advanced', 'pro'];

export const LEVEL_LABELS = {
  beginner: 'Nybörjare',
  intermediate: 'Medel',
  advanced: 'Avancerad',
  pro: 'Proffs',
};

export const LEVEL_COLORS = {
  beginner: { bg: 'bg-green-500/15', text: 'text-green-400', ring: 'ring-green-500/30' },
  intermediate: { bg: 'bg-blue-500/15', text: 'text-blue-400', ring: 'ring-blue-500/30' },
  advanced: { bg: 'bg-orange-500/15', text: 'text-orange-400', ring: 'ring-orange-500/30' },
  pro: { bg: 'bg-red-500/15', text: 'text-red-400', ring: 'ring-red-500/30' },
};

export function getLevelLabel(level) {
  return LEVEL_LABELS[level] || LEVEL_LABELS.intermediate;
}

export function getLevelColor(level) {
  return LEVEL_COLORS[level] || LEVEL_COLORS.intermediate;
}
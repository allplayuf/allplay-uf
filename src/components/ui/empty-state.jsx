import React from 'react';
import PremiumEmptyState from "@/components/ui/premium-empty-state";

/**
 * EmptyState — unified premium empty state.
 * Wraps PremiumEmptyState so existing callers keep working.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  variant = 'default',
  accent = 'green'
}) {
  const iconSize = variant === 'inline' ? 'w-6 h-6' : variant === 'compact' ? 'w-8 h-8' : 'w-9 h-9';

  return (
    <PremiumEmptyState
      icon={Icon ? <Icon className={iconSize} /> : null}
      title={title}
      description={description}
      actionLabel={actionLabel}
      onAction={onAction}
      secondaryLabel={secondaryActionLabel}
      onSecondary={onSecondaryAction}
      accent={accent}
    />
  );
}

// Preset empty states for common scenarios
export function NoMatchesFound({ onCreateMatch }) {
  return (
    <EmptyState
      icon={() => <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
      title="Inga matcher just nu"
      description="Det finns inga matcher som matchar dina filter. Justera filtren eller skapa en ny match på 10 sekunder!"
      actionLabel="Skapa match"
      onAction={onCreateMatch}
      secondaryActionLabel="Rensa filter"
      onSecondaryAction={() => window.location.reload()}
    />
  );
}

export function NoPlayersFound() {
  return (
    <EmptyState
      icon={() => <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
      title="Inga spelare hittades"
      description="Det finns inga spelare som matchar dina sökkriterier. Prova att ändra dina filter eller sök efter något annat."
      variant="compact"
    />
  );
}

export function NoTeamsFound({ onCreateTeam }) {
  return (
    <EmptyState
      icon={() => <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
      title="Inga lag ännu"
      description="Det finns inga lag i ditt område ännu – skapa ett på 10 sekunder!"
      actionLabel="Skapa lag"
      onAction={onCreateTeam}
      variant="compact"
    />
  );
}
/**
 * Normalizes a raw match object from different backends (Supabase edge function,
 * Base44 entity, public view) into a single, predictable shape used throughout
 * the match detail page.
 *
 * Handles:
 *  - Nested { match: {...} } vs flat objects
 *  - Legacy status values ("finished", "ended" → "completed")
 *  - Dual field names (venue_id vs pitch_id, title vs name, etc.)
 *  - starts_at ISO string → separate date + time fields
 */
export function normalizeMatch(raw) {
  if (!raw) return null;
  const m = raw.match || raw;

  let parsedDate = m.date;
  let parsedTime = m.time;
  if (m.starts_at && (!parsedDate || !parsedTime)) {
    const startsAt = new Date(m.starts_at);
    parsedDate = parsedDate || startsAt.toISOString().split("T")[0];
    parsedTime = parsedTime || startsAt.toTimeString().substring(0, 5);
  }

  return {
    ...m,
    status: m.status === "finished" || m.status === "ended" ? "completed" : m.status,
    skill_bracket: m.level || m.skill_bracket,
    venue_id: m.venue_id || m.pitch_id,
    title: m.title || m.name || "Match",
    date: parsedDate,
    time: parsedTime,
    duration_minutes: m.duration_minutes || m.duration || 90,
    max_players: m.max_players || m.capacity,
    organizer_id: m.organizer_id || m.created_by,
  };
}
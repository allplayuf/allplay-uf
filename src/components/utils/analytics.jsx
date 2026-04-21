/**
 * Analytics wrapper — Vercel/Supabase-ready.
 *
 * Currently a safe no-op so we can drop base44.analytics without breaking builds.
 * Swap the implementation later (e.g. Vercel Analytics, PostHog, Plausible, Supabase `events` table).
 *
 * Usage:
 *   import { track } from '@/components/utils/analytics';
 *   track('button_clicked', { name: 'create_match' });
 */

export function track(eventName, properties = {}) {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug('[analytics]', eventName, properties);
  }
  // TODO: plug in Vercel Analytics / PostHog / Supabase events table here.
}

// Compatibility shim for code that used `base44.analytics.track({ eventName, properties })`
export const analytics = {
  track: (arg) => {
    if (arg && typeof arg === 'object' && 'eventName' in arg) {
      track(arg.eventName, arg.properties || {});
    } else if (typeof arg === 'string') {
      track(arg);
    }
  },
};

export default analytics;
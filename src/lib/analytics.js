/**
 * Analytics — PostHog wrapper (single source of truth for product analytics).
 *
 * All app code calls track()/identifyUser()/resetAnalytics() from here —
 * never import posthog-js directly elsewhere. Every helper is a safe no-op
 * when VITE_POSTHOG_API_KEY is missing (local dev without a .env) and never
 * throws, so analytics can never break a user-facing flow.
 *
 * Event naming convention: snake_case, object_verb ("match_joined").
 */

import posthog from 'posthog-js';

const API_KEY = import.meta.env.VITE_POSTHOG_API_KEY;
const HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://eu.i.posthog.com';

let initialized = false;

export function initAnalytics() {
  if (initialized) return;
  if (!API_KEY) {
    if (import.meta.env.DEV) console.warn('[analytics] VITE_POSTHOG_API_KEY missing — analytics disabled');
    return;
  }
  try {
    posthog.init(API_KEY, {
      api_host: HOST,
      // SPA + Capacitor: pageviews are captured manually on route change
      capture_pageview: false,
      capture_pageleave: true,
      // Explicit events only — autocapture is noise on a gesture-heavy PWA
      autocapture: false,
      person_profiles: 'identified_only',
      persistence: 'localStorage',
    });
    initialized = true;
    track('app_opened', {
      platform: typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.() ? 'ios' : 'web',
    });
  } catch (e) {
    console.warn('[analytics] init failed', e);
  }
}

/** Capture an event. Safe to call before init / when disabled. */
export function track(event, properties = {}) {
  if (!initialized) return;
  try {
    posthog.capture(event, properties);
  } catch (e) {
    if (import.meta.env.DEV) console.warn('[analytics] capture failed', event, e);
  }
}

/** Manual SPA pageview — called by Layout on every route change. */
export function trackPageview(path) {
  if (!initialized) return;
  try {
    posthog.capture('$pageview', { $current_url: window.location.href, path });
  } catch (_) { /* noop */ }
}

/**
 * Tie events to the logged-in user. Idempotent — safe to call on every
 * auth-state emission (login, token refresh, session restore).
 */
export function identifyUser(user) {
  if (!initialized || !user?.id) return;
  try {
    const meta = user.user_metadata || {};
    posthog.identify(user.id, {
      email: user.email,
      name: user.display_name || user.full_name || meta.full_name || meta.name,
      city: user.city || undefined,
      skill_level: user.skill_level || undefined,
    });
  } catch (_) { /* noop */ }
}

/** Clear the identified user on logout so events stop linking to them. */
export function resetAnalytics() {
  if (!initialized) return;
  try {
    posthog.reset();
  } catch (_) { /* noop */ }
}

/**
 * Feature flags for AllPlay
 *
 * Flip these to true to re-enable hidden features.
 * Nothing in the database is deleted when a flag is off — only UI is hidden.
 *
 * To reactivate cups:
 *   1. Set CUPS_ENABLED to true below.
 *   2. Ask the assistant to do a pass over the cup flow to verify everything
 *      still works end-to-end ("take back cup mode").
 */

export const FEATURE_FLAGS = {
  // Cups / tournaments (Community tab, Dashboard widget, Cup stat, CupDetail page).
  // Set to true to bring cup functionality back.
  CUPS_ENABLED: false,
};

export const isCupsEnabled = () => FEATURE_FLAGS.CUPS_ENABLED;
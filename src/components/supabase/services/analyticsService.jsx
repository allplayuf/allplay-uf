/**
 * Analytics Service (admin only)
 *
 * Reads the business-metric views (analytics_* in Postgres) through the
 * single admin-gated RPC `get_admin_analytics`. The views themselves are
 * revoked from anon/authenticated — the SECURITY DEFINER function checks
 * profiles.is_admin and returns everything as one jsonb payload.
 */

import { getAuthHeaders, SUPABASE_URL } from '../config';

/**
 * Fetch the full analytics payload for the Admin dashboard.
 *
 * @returns {Promise<{
 *   kpis: object,
 *   weekly_liquidity: Array,
 *   activation_funnel: Array,
 *   retention_cohorts: Array,
 *   top_venues: Array,
 *   no_show_weekly: Array,
 *   generated_at: string
 * }>}
 */
export async function getAdminAnalytics() {
  const headers = await getAuthHeaders();

  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_admin_analytics`, {
    method: 'POST',
    headers,
    body: '{}'
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    if (res.status === 401 || res.status === 403 || text.includes('Admin access required')) {
      throw new Error('Endast administratörer kan se statistik.');
    }
    throw new Error(`Kunde inte hämta statistik: ${res.status}`);
  }

  return res.json();
}

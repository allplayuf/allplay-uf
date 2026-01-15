/**
 * Reports Service
 * 
 * User reporting operations using Supabase Edge Functions.
 */

import { callEdgeFunction } from '../callEdgeFunction';

/**
 * Report a user
 * 
 * @param {object} reportData - Report payload
 * @param {string} reportData.reported_user_id - User being reported
 * @param {string} reportData.category - Report category (harassment/threats/etc)
 * @param {string} [reportData.details] - Additional details
 * @param {string} [reportData.match_id] - Related match ID if applicable
 */
export async function reportUser(reportData) {
  const { reported_user_id, category, details, match_id } = reportData;
  
  if (!reported_user_id || !category) {
    throw new Error('Användar-ID och kategori krävs för att rapportera');
  }
  
  return callEdgeFunction('report_user', {
    reported_user_id,
    category,
    details: details || null,
    match_id: match_id || null
  });
}

/**
 * Get reports (admin/moderator only)
 * 
 * @param {object} filters - Optional filters
 * @param {string} [filters.status] - Filter by status
 */
export async function getReports(filters = {}) {
  return callEdgeFunction('get_reports', filters);
}

/**
 * Handle a report (admin/moderator only)
 * 
 * @param {string} reportId - Report UUID
 * @param {string} action - Action to take
 * @param {string} [notes] - Moderator notes
 */
export async function handleReport(reportId, action, notes) {
  return callEdgeFunction('handle_report', {
    report_id: reportId,
    action,
    notes: notes || null
  });
}
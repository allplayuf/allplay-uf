/**
 * Reports Service
 * 
 * ARCHITECTURE: Backend (RLS) is source of truth
 * - All operations go through Edge Functions
 * - Backend decides authorization (admin/moderator checks)
 * - No frontend role guards
 */

import { callEdgeFunction } from '../callEdgeFunction';

/**
 * Report a user
 * Backend validates reporter is authenticated and payload is valid
 */
export async function reportUser(reportData) {
  const { reported_user_id, category, details, match_id } = reportData;
  
  // Only validate required fields - backend handles auth
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
 * Get reports
 * Backend RLS ensures only admin/moderator can access
 */
export async function getReports(filters = {}) {
  return callEdgeFunction('get_reports', filters);
}

/**
 * Handle a report
 * Backend RLS ensures only admin/moderator can execute
 */
export async function handleReport(reportId, action, notes) {
  return callEdgeFunction('handle_report', {
    report_id: reportId,
    action,
    notes: notes || null
  });
}

/**
 * Report a match or match-related issue
 * Backend validates reporter is authenticated and payload is valid
 */
export async function reportMatch(reportData) {
  const { match_id, reported_user_id, category, details } = reportData;
  
  // Validate required fields - backend handles auth
  if (!match_id) {
    throw new Error('Match-ID krävs för att rapportera en match');
  }
  if (!category) {
    throw new Error('Kategori krävs för att rapportera');
  }
  
  return callEdgeFunction('report_match', {
    match_id,
    reported_user_id: reported_user_id || null,
    category,
    details: details || null
  });
}
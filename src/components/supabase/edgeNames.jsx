/**
 * Edge Function Names - Single Source of Truth
 * All edge function endpoints use snake_case
 * 
 * USAGE: Import EDGE constant and use instead of magic strings
 * Example: callEdgeFunction(EDGE.joinMatch, {...})
 */
export const EDGE = {
  // Auth & User
  me: 'me',
  getUsersByIds: 'get_users_by_ids',
  getMyProfile: 'get_my_profile',
  updateProfile: 'update_profile',
  
  // Matches
  createMatch: 'create_match',
  joinMatch: 'join_match',
  leaveMatch: 'leave_match',
  checkInMatch: 'check_in_match',
  getMatchDetails: 'get_match_details',
  getMatchParticipants: 'get_match_participants',
  getMyParticipation: 'my_participation',
  endMatch: 'end_match',
  finishMatch: 'finish_match',
  deleteMatch: 'delete_match',
  
  // Venues
  getVenues: 'get_venues',
  
  // Reports
  submitReport: 'submit_report',
  
  // Cups
  getCupDetails: 'get_cup_details',
  signupToCup: 'signup_to_cup',

  // Teams
  createTeam: 'create_team',
  deleteTeam: 'delete_team',

  // File upload
  uploadFile: 'upload_file',
  
  // Account
  deleteAccount: 'delete_account',

  // Friendships
  friendshipsAction: 'friendships_action',

  // Push notifications
  sendPush: 'send_push',
  processNotifications: 'process_notifications',

  // Legacy mappings (for migration period)
  checkInToMatch: 'check_in_match', // Old name -> new name
};
/**
 * Cleanup Orphaned Records
 * Finds and removes records that reference deleted entities
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { requireAdmin } from '../utils/authorization.js';
import { withErrorHandler, successResponse } from '../utils/errorHandler.js';

const handler = async (req, logger) => {
  const { dryRun = true } = await req.json();
  
  // Only admins can run cleanup
  const { base44, user } = await requireAdmin(req);
  
  logger.info('Starting orphaned records cleanup', { userId: user.id, dryRun });
  
  const results = {
    matchParticipants: { orphaned: 0, deleted: 0 },
    teamMembers: { orphaned: 0, deleted: 0 },
    cupParticipants: { orphaned: 0, deleted: 0 },
    mvpVotes: { orphaned: 0, deleted: 0 },
    checkIns: { orphaned: 0, deleted: 0 }
  };
  
  // Step 1: Clean up MatchParticipant records with deleted matches
  logger.info('Checking MatchParticipant orphans');
  const allParticipants = await base44.asServiceRole.entities.MatchParticipant.list();
  const allMatches = await base44.asServiceRole.entities.Match.list();
  const matchIds = new Set(allMatches.map(m => m.id));
  
  const orphanedParticipants = allParticipants.filter(p => !matchIds.has(p.match_id));
  results.matchParticipants.orphaned = orphanedParticipants.length;
  
  if (!dryRun) {
    for (const participant of orphanedParticipants) {
      await base44.asServiceRole.entities.MatchParticipant.delete(participant.id);
      results.matchParticipants.deleted++;
    }
  }
  
  // Step 2: Clean up TeamMember records with deleted teams
  logger.info('Checking TeamMember orphans');
  const allTeamMembers = await base44.asServiceRole.entities.TeamMember.list();
  const allTeams = await base44.asServiceRole.entities.Team.filter({ is_active: true });
  const teamIds = new Set(allTeams.map(t => t.id));
  
  const orphanedMembers = allTeamMembers.filter(m => !teamIds.has(m.team_id));
  results.teamMembers.orphaned = orphanedMembers.length;
  
  if (!dryRun) {
    for (const member of orphanedMembers) {
      await base44.asServiceRole.entities.TeamMember.delete(member.id);
      results.teamMembers.deleted++;
    }
  }
  
  // Step 3: Clean up CupParticipant records with deleted cups
  logger.info('Checking CupParticipant orphans');
  const allCupParticipants = await base44.asServiceRole.entities.CupParticipant.list();
  const allCups = await base44.asServiceRole.entities.Cup.list();
  const cupIds = new Set(allCups.map(c => c.id));
  
  const orphanedCupParticipants = allCupParticipants.filter(p => !cupIds.has(p.cup_id));
  results.cupParticipants.orphaned = orphanedCupParticipants.length;
  
  if (!dryRun) {
    for (const participant of orphanedCupParticipants) {
      await base44.asServiceRole.entities.CupParticipant.delete(participant.id);
      results.cupParticipants.deleted++;
    }
  }
  
  // Step 4: Clean up MVPVote records with deleted matches
  logger.info('Checking MVPVote orphans');
  const allMvpVotes = await base44.asServiceRole.entities.MVPVote.list();
  const orphanedVotes = allMvpVotes.filter(v => !matchIds.has(v.match_id));
  results.mvpVotes.orphaned = orphanedVotes.length;
  
  if (!dryRun) {
    for (const vote of orphanedVotes) {
      await base44.asServiceRole.entities.MVPVote.delete(vote.id);
      results.mvpVotes.deleted++;
    }
  }
  
  // Step 5: Clean up CheckIn records with deleted matches
  logger.info('Checking CheckIn orphans');
  const allCheckIns = await base44.asServiceRole.entities.CheckIn.list();
  const orphanedCheckIns = allCheckIns.filter(c => !matchIds.has(c.match_id));
  results.checkIns.orphaned = orphanedCheckIns.length;
  
  if (!dryRun) {
    for (const checkIn of orphanedCheckIns) {
      await base44.asServiceRole.entities.CheckIn.delete(checkIn.id);
      results.checkIns.deleted++;
    }
  }
  
  logger.info('Cleanup completed', { dryRun, results });
  
  return successResponse({
    message: dryRun ? 'Dry run completed - no records deleted' : 'Cleanup completed successfully',
    dryRun,
    results
  });
};

Deno.serve(withErrorHandler(handler, 'cleanup-orphaned-records'));
/**
 * Delete Team with Cleanup
 * Safely deletes a team and all related records (members, invites, messages, etc.)
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { requireTeamOwnership } from '../utils/authorization.js';

Deno.serve(async (req) => {
  try {
    const { teamId } = await req.json();
    
    if (!teamId) {
      return Response.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }
    
    // Verify user has permission to delete this team
    const { base44, user, team } = await requireTeamOwnership(req, teamId);
    
    // Step 1: Delete all TeamMember records
    const members = await base44.asServiceRole.entities.TeamMember.filter({
      team_id: teamId
    });
    
    for (const member of members) {
      await base44.asServiceRole.entities.TeamMember.delete(member.id);
    }
    
    // Step 2: Delete all TeamInvitation records
    const invitations = await base44.asServiceRole.entities.TeamInvitation.filter({
      team_id: teamId
    });
    
    for (const invitation of invitations) {
      await base44.asServiceRole.entities.TeamInvitation.delete(invitation.id);
    }
    
    // Step 3: Delete all TeamMessage records
    const messages = await base44.asServiceRole.entities.TeamMessage.filter({
      team_id: teamId
    });
    
    for (const message of messages) {
      await base44.asServiceRole.entities.TeamMessage.delete(message.id);
    }
    
    // Step 4: Delete all TeamPoll records
    const polls = await base44.asServiceRole.entities.TeamPoll.filter({
      team_id: teamId
    });
    
    for (const poll of polls) {
      await base44.asServiceRole.entities.TeamPoll.delete(poll.id);
    }
    
    // Step 5: Delete all TeamHighlight records
    const highlights = await base44.asServiceRole.entities.TeamHighlight.filter({
      team_id: teamId
    });
    
    for (const highlight of highlights) {
      await base44.asServiceRole.entities.TeamHighlight.delete(highlight.id);
    }
    
    // Step 6: Delete all TeamChallenge records
    const challenges = await base44.asServiceRole.entities.TeamChallenge.filter({
      team_id: teamId
    });
    
    for (const challenge of challenges) {
      await base44.asServiceRole.entities.TeamChallenge.delete(challenge.id);
    }
    
    // Step 7: Delete matches organized by this team
    const teamMatches = await base44.asServiceRole.entities.Match.filter({
      team_a_id: teamId
    });
    const teamBMatches = await base44.asServiceRole.entities.Match.filter({
      team_b_id: teamId
    });
    
    const matchesToUpdate = [...teamMatches, ...teamBMatches];
    for (const match of matchesToUpdate) {
      // Set team references to null instead of deleting matches
      const updates = {};
      if (match.team_a_id === teamId) updates.team_a_id = null;
      if (match.team_b_id === teamId) updates.team_b_id = null;
      
      await base44.asServiceRole.entities.Match.update(match.id, updates);
    }
    
    // Step 8: Finally, delete the team itself
    await base44.asServiceRole.entities.Team.delete(teamId);
    
    return Response.json({
      success: true,
      message: 'Team and all related records deleted successfully',
      deletedRecords: {
        members: members.length,
        invitations: invitations.length,
        messages: messages.length,
        polls: polls.length,
        highlights: highlights.length,
        challenges: challenges.length,
        matchesUpdated: matchesToUpdate.length
      }
    });
    
  } catch (error) {
    console.error('Error deleting team:', error);
    
    const status = error.message.includes('required') || 
                   error.message.includes('permission') ? 403 : 500;
    
    return Response.json(
      { error: error.message || 'Failed to delete team' },
      { status }
    );
  }
});
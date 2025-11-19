// Cleanup utilities for orphaned records

export async function cleanupMatchRecords(base44, matchId) {
  const deleted = {
    participants: 0,
    cupMatches: 0,
    results: 0,
    mvpVotes: 0,
    checkIns: 0
  };

  // Delete participants
  const participants = await base44.entities.MatchParticipant.filter({ match_id: matchId });
  for (const p of participants) {
    await base44.entities.MatchParticipant.delete(p.id);
    deleted.participants++;
  }

  // Delete cup matches
  const cupMatches = await base44.entities.CupMatch.filter({ match_id: matchId });
  for (const cm of cupMatches) {
    await base44.entities.CupMatch.delete(cm.id);
    deleted.cupMatches++;
  }

  // Delete results
  const results = await base44.entities.MatchResult.filter({ match_id: matchId });
  for (const r of results) {
    await base44.entities.MatchResult.delete(r.id);
    deleted.results++;
  }

  // Delete MVP votes
  const mvpVotes = await base44.entities.MVPVote.filter({ match_id: matchId });
  for (const v of mvpVotes) {
    await base44.entities.MVPVote.delete(v.id);
    deleted.mvpVotes++;
  }

  // Delete check-ins
  const checkIns = await base44.entities.CheckIn.filter({ match_id: matchId });
  for (const c of checkIns) {
    await base44.entities.CheckIn.delete(c.id);
    deleted.checkIns++;
  }

  return deleted;
}

export async function cleanupTeamRecords(base44, teamId) {
  const deleted = {
    members: 0,
    messages: 0,
    invitations: 0,
    polls: 0,
    highlights: 0,
    challenges: 0
  };

  // Delete members
  const members = await base44.entities.TeamMember.filter({ team_id: teamId });
  for (const m of members) {
    await base44.entities.TeamMember.delete(m.id);
    deleted.members++;
  }

  // Delete messages
  const messages = await base44.entities.TeamMessage.filter({ team_id: teamId });
  for (const msg of messages) {
    await base44.entities.TeamMessage.delete(msg.id);
    deleted.messages++;
  }

  // Delete invitations
  const invitations = await base44.entities.TeamInvitation.filter({ team_id: teamId });
  for (const inv of invitations) {
    await base44.entities.TeamInvitation.delete(inv.id);
    deleted.invitations++;
  }

  // Delete polls
  const polls = await base44.entities.TeamPoll.filter({ team_id: teamId });
  for (const p of polls) {
    await base44.entities.TeamPoll.delete(p.id);
    deleted.polls++;
  }

  // Delete highlights
  const highlights = await base44.entities.TeamHighlight.filter({ team_id: teamId });
  for (const h of highlights) {
    await base44.entities.TeamHighlight.delete(h.id);
    deleted.highlights++;
  }

  // Delete challenges
  const challenges = await base44.entities.TeamChallenge.filter({ team_id: teamId });
  for (const c of challenges) {
    await base44.entities.TeamChallenge.delete(c.id);
    deleted.challenges++;
  }

  return deleted;
}
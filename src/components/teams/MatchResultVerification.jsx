import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle, Trophy } from "lucide-react";
import { Match } from "@/entities/Match";
import { MatchResultVerification as MatchResultVerificationEntity } from "@/entities/MatchResultVerification";
import { Team } from "@/entities/Team";
import { feedback } from "@/components/ui/feedback-toast";

/**
 * ELO Calculation System
 * - Winner gets +10 to +50 ELO
 * - Loser gets -50 to -10 ELO
 * - Typical change: ±30
 * - Based on goal difference and opponent strength
 */
function calculateEloChange(winnerElo, loserElo, goalDifference) {
  // Base change
  const baseChange = 30;
  
  // Adjust based on ELO difference (upset bonus/penalty)
  const eloDiff = loserElo - winnerElo;
  const upsetFactor = Math.min(10, Math.max(-10, eloDiff / 100));
  
  // Adjust based on goal difference (dominant win bonus)
  const goalFactor = Math.min(10, Math.max(0, (goalDifference - 1) * 3));
  
  // Calculate final change
  const winnerChange = Math.round(baseChange + upsetFactor + goalFactor);
  const loserChange = -winnerChange;
  
  // Clamp to allowed range
  const finalWinnerChange = Math.min(50, Math.max(10, winnerChange));
  const finalLoserChange = Math.max(-50, Math.min(-10, loserChange));
  
  return {
    winnerChange: finalWinnerChange,
    loserChange: finalLoserChange
  };
}

export default function MatchResultVerification({ match, currentUser, onVerified }) {
  const [verification, setVerification] = useState(null);
  const [teamAScore, setTeamAScore] = useState('');
  const [teamBScore, setTeamBScore] = useState('');
  const [teamA, setTeamA] = useState(null);
  const [teamB, setTeamB] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [match.id]);

  const loadData = async () => {
    try {
      const [teamAData, teamBData, verifications] = await Promise.all([
        Team.get(match.team_a_id),
        Team.get(match.team_b_id),
        MatchResultVerificationEntity.filter({ match_id: match.id })
      ]);

      setTeamA(teamAData);
      setTeamB(teamBData);
      
      if (verifications.length > 0) {
        setVerification(verifications[0]);
      }
    } catch (error) {
      console.error("Error loading verification data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isTeamACaptain = currentUser.id === teamA?.captain_id;
  const isTeamBCaptain = currentUser.id === teamB?.captain_id;
  const isCaptain = isTeamACaptain || isTeamBCaptain;

  const handleSubmitResult = async () => {
    if (!teamAScore || !teamBScore) {
      feedback.error('Ange båda lagets resultat');
      return;
    }

    setIsSubmitting(true);
    try {
      const scoreA = parseInt(teamAScore);
      const scoreB = parseInt(teamBScore);
      
      const reportData = {
        team_a_score: scoreA,
        team_b_score: scoreB,
        reported_by: currentUser.id,
        reported_at: new Date().toISOString()
      };

      if (!verification) {
        // First report
        const newVerification = await MatchResultVerificationEntity.create({
          match_id: match.id,
          team_a_reported_score: isTeamACaptain ? reportData : null,
          team_b_reported_score: isTeamBCaptain ? reportData : null,
          verification_status: isTeamACaptain ? 'pending_team_b' : 'pending_team_a'
        });
        setVerification(newVerification);
        feedback.success('Resultat rapporterat!', { description: 'Väntar på motståndare att verifiera.' });
      } else {
        // Second report - check if scores match
        const existingReport = isTeamACaptain ? verification.team_b_reported_score : verification.team_a_reported_score;
        
        if (existingReport.team_a_score === scoreA && existingReport.team_b_score === scoreB) {
          // Scores match - verify and calculate ELO
          const goalDifference = Math.abs(scoreA - scoreB);
          const winnerElo = scoreA > scoreB ? teamA.elo_rating : teamB.elo_rating;
          const loserElo = scoreA > scoreB ? teamB.elo_rating : teamA.elo_rating;
          
          const { winnerChange, loserChange } = calculateEloChange(winnerElo, loserElo, goalDifference);
          
          const teamAChange = scoreA > scoreB ? winnerChange : (scoreA < scoreB ? loserChange : 0);
          const teamBChange = scoreB > scoreA ? winnerChange : (scoreB < scoreA ? loserChange : 0);

          // Update verification
          await MatchResultVerificationEntity.update(verification.id, {
            team_a_reported_score: isTeamACaptain ? reportData : verification.team_a_reported_score,
            team_b_reported_score: isTeamBCaptain ? reportData : verification.team_b_reported_score,
            verification_status: 'verified',
            verified_at: new Date().toISOString(),
            final_elo_changes: {
              team_a_change: teamAChange,
              team_b_change: teamBChange
            }
          });

          // Update match
          await Match.update(match.id, {
            status: 'completed',
            team_a_score: scoreA,
            team_b_score: scoreB,
            completed_at: new Date().toISOString()
          });

          // Update teams' ELO and history
          await Promise.all([
            Team.update(teamA.id, {
              elo_rating: teamA.elo_rating + teamAChange,
              rank_history: [
                ...(teamA.rank_history || []).slice(-4),
                { elo: teamA.elo_rating + teamAChange, date: new Date().toISOString() }
              ],
              matches_played: teamA.matches_played + 1,
              wins: scoreA > scoreB ? teamA.wins + 1 : teamA.wins,
              losses: scoreA < scoreB ? teamA.losses + 1 : teamA.losses,
              draws: scoreA === scoreB ? teamA.draws + 1 : teamA.draws
            }),
            Team.update(teamB.id, {
              elo_rating: teamB.elo_rating + teamBChange,
              rank_history: [
                ...(teamB.rank_history || []).slice(-4),
                { elo: teamB.elo_rating + teamBChange, date: new Date().toISOString() }
              ],
              matches_played: teamB.matches_played + 1,
              wins: scoreB > scoreA ? teamB.wins + 1 : teamB.wins,
              losses: scoreB < scoreA ? teamB.losses + 1 : teamB.losses,
              draws: scoreB === scoreA ? teamB.draws + 1 : teamB.draws
            })
          ]);

          feedback.success('Match verifierad!', {
            description: `${teamA.name} ${teamAChange > 0 ? '+' : ''}${teamAChange} ELO · ${teamB.name} ${teamBChange > 0 ? '+' : ''}${teamBChange} ELO`,
          });
          
          if (onVerified) onVerified();
        } else {
          // Scores don't match - dispute
          await MatchResultVerificationEntity.update(verification.id, {
            team_a_reported_score: isTeamACaptain ? reportData : verification.team_a_reported_score,
            team_b_reported_score: isTeamBCaptain ? reportData : verification.team_b_reported_score,
            verification_status: 'disputed'
          });
          feedback.error('Resultat matchar inte!', { description: 'Kontakta support för att lösa dispyten.' });
        }
      }
      
      loadData();
    } catch (error) {
      console.error("Error submitting result:", error);
      feedback.error('Kunde inte rapportera resultat. Försök igen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-[#121715] border border-[#223029]">
        <CardContent className="p-6 text-center">
          <div className="w-8 h-8 border-2 border-[#2BA84A] border-t-transparent rounded-full animate-spin mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  if (!isCaptain) {
    return (
      <Card className="bg-[#121715] border border-[#223029]">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-[#F4743B] mx-auto mb-3" />
          <p className="text-[#B6C2BC]">Endast lagkaptener kan rapportera matchresultat</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#121715] border border-[#223029] rounded-[16px]">
      <CardHeader className="border-b border-[#223029]">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#F4743B]" />
          Matchresultat & Verifiering
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        
        {/* Verification Status */}
        {verification && (
          <div className="p-4 bg-[#18221E] rounded-xl border border-[#223029]">
            {verification.verification_status === 'verified' && (
              <div className="flex items-center gap-2 text-[#2BA84A]">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">Resultat verifierat!</span>
              </div>
            )}
            {verification.verification_status === 'disputed' && (
              <div className="flex items-center gap-2 text-[#F4743B]">
                <XCircle className="w-5 h-5" />
                <span className="font-semibold">Resultat skiljer sig - kontakta support</span>
              </div>
            )}
            {(verification.verification_status === 'pending_team_a' || verification.verification_status === 'pending_team_b') && (
              <div className="flex items-center gap-2 text-[#F59E0B]">
                <AlertCircle className="w-5 h-5" />
                <span className="font-semibold">Väntar på {verification.verification_status === 'pending_team_a' ? teamA?.name : teamB?.name} att verifiera</span>
              </div>
            )}
          </div>
        )}

        {/* Score Input */}
        {verification?.verification_status !== 'verified' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label className="text-[#F4F7F5] mb-2 block">{teamA?.name} - Mål</Label>
              <Input
                type="number"
                min="0"
                value={teamAScore}
                onChange={(e) => setTeamAScore(e.target.value)}
                className="bg-[#18221E] border-[#223029] text-[#F4F7F5] h-12 text-center text-xl font-semibold"
                placeholder="0"
              />
            </div>
            <div>
              <Label className="text-[#F4F7F5] mb-2 block">{teamB?.name} - Mål</Label>
              <Input
                type="number"
                min="0"
                value={teamBScore}
                onChange={(e) => setTeamBScore(e.target.value)}
                className="bg-[#18221E] border-[#223029] text-[#F4F7F5] h-12 text-center text-xl font-semibold"
                placeholder="0"
              />
            </div>
          </div>
        )}

        {/* Reported Scores */}
        {verification && (verification.team_a_reported_score || verification.team_b_reported_score) && (
          <div className="space-y-3">
            <h4 className="font-semibold text-[#F4F7F5]">Rapporterade resultat:</h4>
            {verification.team_a_reported_score && (
              <div className="p-3 bg-[#18221E] rounded-lg border border-[#223029]">
                <p className="text-[#B6C2BC] text-sm">Rapporterat av {teamA?.name}:</p>
                <p className="text-[#F4F7F5] font-semibold">
                  {verification.team_a_reported_score.team_a_score} - {verification.team_a_reported_score.team_b_score}
                </p>
              </div>
            )}
            {verification.team_b_reported_score && (
              <div className="p-3 bg-[#18221E] rounded-lg border border-[#223029]">
                <p className="text-[#B6C2BC] text-sm">Rapporterat av {teamB?.name}:</p>
                <p className="text-[#F4F7F5] font-semibold">
                  {verification.team_b_reported_score.team_a_score} - {verification.team_b_reported_score.team_b_score}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        {verification?.verification_status !== 'verified' && (
          <Button
            onClick={handleSubmitResult}
            disabled={!teamAScore || !teamBScore || isSubmitting}
            className="w-full h-12 bg-[#2BA84A] hover:bg-[#248232] text-[#FFFFFF] font-semibold rounded-[14px]"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Sparar...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Rapportera resultat
              </>
            )}
          </Button>
        )}

        {/* ELO Preview */}
        {verification?.verification_status === 'verified' && verification.final_elo_changes && (
          <div className="p-4 bg-gradient-to-br from-[#2BA84A]/10 to-[#0F2917]/10 rounded-xl border border-[#2BA84A]/30">
            <h4 className="font-semibold text-[#F4F7F5] mb-3 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#F4743B]" />
              ELO-ändringar
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[#B6C2BC] text-sm mb-1">{teamA?.name}</p>
                <p className={`text-2xl font-bold ${verification.final_elo_changes.team_a_change > 0 ? 'text-[#2BA84A]' : 'text-[#DC2626]'}`}>
                  {verification.final_elo_changes.team_a_change > 0 ? '+' : ''}{verification.final_elo_changes.team_a_change}
                </p>
              </div>
              <div>
                <p className="text-[#B6C2BC] text-sm mb-1">{teamB?.name}</p>
                <p className={`text-2xl font-bold ${verification.final_elo_changes.team_b_change > 0 ? 'text-[#2BA84A]' : 'text-[#DC2626]'}`}>
                  {verification.final_elo_changes.team_b_change > 0 ? '+' : ''}{verification.final_elo_changes.team_b_change}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
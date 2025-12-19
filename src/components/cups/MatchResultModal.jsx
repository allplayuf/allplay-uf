import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { Trophy, Plus, Trash2, Target } from 'lucide-react';
import { useCustomDialog } from "../ui/custom-dialog";
import { useQuery } from "@tanstack/react-query";

export default function MatchResultModal({ match, onClose, onSuccess }) {
  const [teamAScore, setTeamAScore] = useState(match.team_a_score ?? '');
  const [teamBScore, setTeamBScore] = useState(match.team_b_score ?? '');
  const [extraTime, setExtraTime] = useState(match.extra_time || false);
  const [penalties, setPenalties] = useState(match.penalties || false);
  const [goals, setGoals] = useState([]);
  
  const existingPenaltyScore = match.penalty_score ? match.penalty_score.split('-') : ['', ''];
  const [penaltyScoreA, setPenaltyScoreA] = useState(existingPenaltyScore[0] || '');
  const [penaltyScoreB, setPenaltyScoreB] = useState(existingPenaltyScore[1] || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { alert } = useCustomDialog();

  // Fetch cup players for both teams
  const { data: cupPlayers = [] } = useQuery({
    queryKey: ['cupPlayers', match.cup_id, match.team_a_id, match.team_b_id],
    queryFn: async () => {
      const [teamAPlayers, teamBPlayers] = await Promise.all([
        base44.entities.CupPlayer.filter({ cup_id: match.cup_id, team_id: match.team_a_id }),
        base44.entities.CupPlayer.filter({ cup_id: match.cup_id, team_id: match.team_b_id })
      ]);
      return [...teamAPlayers, ...teamBPlayers];
    },
    enabled: !!match.cup_id && !!match.team_a_id && !!match.team_b_id,
  });

  const teamAPlayers = cupPlayers.filter(p => p.team_id === match.team_a_id);
  const teamBPlayers = cupPlayers.filter(p => p.team_id === match.team_b_id);

  const isDraw = teamAScore !== '' && teamBScore !== '' && parseInt(teamAScore) === parseInt(teamBScore);
  const totalGoals = (parseInt(teamAScore) || 0) + (parseInt(teamBScore) || 0);

  // Initialize goals array when scores change
  useEffect(() => {
    if (teamAScore !== '' && teamBScore !== '') {
      const total = parseInt(teamAScore) + parseInt(teamBScore);
      const currentGoalsCount = goals.length;
      
      if (total > currentGoalsCount) {
        // Add missing goals
        const newGoals = [...goals];
        for (let i = currentGoalsCount; i < total; i++) {
          newGoals.push({ team_id: '', player_id: '', minute: '' });
        }
        setGoals(newGoals);
      } else if (total < currentGoalsCount) {
        // Remove extra goals
        setGoals(goals.slice(0, total));
      }
    } else {
      setGoals([]);
    }
  }, [teamAScore, teamBScore]);

  const handleGoalChange = (index, field, value) => {
    const newGoals = [...goals];
    newGoals[index] = { ...newGoals[index], [field]: value };
    setGoals(newGoals);
  };

  const handleSubmit = async () => {
    if (teamAScore === '' || teamBScore === '') {
        await alert('Felaktig inmatning', 'Vänligen fyll i båda resultaten.', { type: 'warning' });
        return;
    }

    if (penalties && (penaltyScoreA === '' || penaltyScoreB === '')) {
        await alert('Straffresultat saknas', 'Ange resultatet för straffar.', { type: 'warning' });
        return;
    }

    // Validate goals
    for (let i = 0; i < goals.length; i++) {
      if (!goals[i].team_id || !goals[i].player_id || !goals[i].minute) {
        await alert('Ofullständig måldata', `Fyll i alla fält för mål ${i + 1}.`, { type: 'warning' });
        return;
      }
    }
    
    setIsSubmitting(true);
    try {
        const response = await base44.functions.invoke('cups/enterMatchResult', {
            cup_match_id: match.id,
            team_a_score: parseInt(teamAScore),
            team_b_score: parseInt(teamBScore),
            extra_time: extraTime,
            penalties: penalties,
            penalty_score: penalties ? `${penaltyScoreA}-${penaltyScoreB}` : null,
            goals: goals
        });
        
        if (onSuccess) await onSuccess();
        onClose();
    } catch (error) {
        console.error("Error reporting result:", error);
        await alert('Ett fel uppstod', error.response?.data?.error || 'Kunde inte spara resultatet. Försök igen.', { type: 'alert' });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#121715] border border-[#223029] rounded-2xl lg:rounded-[20px] w-full p-4 lg:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
      <div className="flex items-center gap-2 lg:gap-3 mb-4 lg:mb-6 text-[#F59E0B]">
          <Trophy className="w-5 h-5 lg:w-6 lg:h-6" />
          <h2 className="text-lg lg:text-xl font-bold">Rapportera Resultat</h2>
      </div>
      
      <div className="flex items-center justify-between gap-2 lg:gap-4 mb-4 lg:mb-6">
          <div className="text-center flex-1">
              <div className="font-bold text-white text-xs lg:text-sm mb-1 lg:mb-2 truncate">{match.team_a_name}</div>
              <Input 
                  type="number" 
                  value={teamAScore}
                  onChange={(e) => setTeamAScore(e.target.value)}
                  className="bg-[#18221E] border-[#223029] text-white text-center text-xl lg:text-2xl h-12 lg:h-16 font-bold"
              />
          </div>
          <div className="text-[#7B8A83] font-bold text-lg lg:text-xl pt-4 lg:pt-6">-</div>
          <div className="text-center flex-1">
              <div className="font-bold text-white text-xs lg:text-sm mb-1 lg:mb-2 truncate">{match.team_b_name}</div>
              <Input 
                  type="number" 
                  value={teamBScore}
                  onChange={(e) => setTeamBScore(e.target.value)}
                  className="bg-[#18221E] border-[#223029] text-white text-center text-xl lg:text-2xl h-12 lg:h-16 font-bold"
              />
          </div>
      </div>

      {/* Goals Details */}
      {goals.length > 0 && (
        <div className="mb-4 lg:mb-6 space-y-3">
          <div className="flex items-center gap-2 text-[#F59E0B]">
            <Target className="w-4 h-4" />
            <h3 className="text-sm font-bold">Måldetaljer ({goals.length} mål)</h3>
          </div>
          
          {goals.map((goal, index) => (
            <div key={index} className="bg-[#18221E] p-3 rounded-lg border border-[#223029] space-y-2">
              <div className="text-xs font-bold text-[#B6C2BC] mb-2">Mål {index + 1}</div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-[#7B8A83] mb-1 block">Lag</label>
                  <Select 
                    value={goal.team_id} 
                    onValueChange={(value) => handleGoalChange(index, 'team_id', value)}
                  >
                    <SelectTrigger className="bg-[#0F1513] border-[#223029] text-white h-9">
                      <SelectValue placeholder="Välj lag" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={match.team_a_id}>{match.team_a_name}</SelectItem>
                      <SelectItem value={match.team_b_id}>{match.team_b_name}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-xs text-[#7B8A83] mb-1 block">Minut</label>
                  <Input 
                    type="number"
                    min="1"
                    max="120"
                    value={goal.minute}
                    onChange={(e) => handleGoalChange(index, 'minute', e.target.value)}
                    placeholder="Ex: 23"
                    className="bg-[#0F1513] border-[#223029] text-white h-9"
                  />
                </div>
              </div>

              {goal.team_id && (
                <div>
                  <label className="text-xs text-[#7B8A83] mb-1 block">Målskytt</label>
                  <Select 
                    value={goal.player_id} 
                    onValueChange={(value) => handleGoalChange(index, 'player_id', value)}
                  >
                    <SelectTrigger className="bg-[#0F1513] border-[#223029] text-white h-9">
                      <SelectValue placeholder="Välj spelare" />
                    </SelectTrigger>
                    <SelectContent>
                      {(goal.team_id === match.team_a_id ? teamAPlayers : teamBPlayers).map(player => (
                        <SelectItem key={player.id} value={player.id}>
                          {player.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Extra Options */}
      <div className="space-y-2 lg:space-y-3 mb-4 lg:mb-6">
          <div className="flex items-center justify-between bg-[#18221E] p-2.5 lg:p-3 rounded-lg border border-[#223029]">
              <span className="text-xs lg:text-sm font-medium text-white">Förlängning</span>
              <button
                  type="button"
                  onClick={() => setExtraTime(!extraTime)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      extraTime 
                          ? 'bg-[#F59E0B] text-white' 
                          : 'bg-[#0F1513] text-[#7B8A83] hover:bg-[#223029]'
                  }`}
              >
                  {extraTime ? 'Ja' : 'Nej'}
              </button>
          </div>

          {isDraw && (
              <div className="bg-[#18221E] p-2.5 lg:p-3 rounded-lg border border-[#F59E0B]/30 space-y-2 lg:space-y-3">
                  <div className="flex items-center justify-between">
                      <span className="text-xs lg:text-sm font-medium text-white">Straffar (oavgjort)</span>
                      <button
                          type="button"
                          onClick={() => {
                              setPenalties(!penalties);
                              if (penalties) {
                                  setPenaltyScoreA('');
                                  setPenaltyScoreB('');
                              }
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              penalties 
                                  ? 'bg-[#EF4444] text-white' 
                                  : 'bg-[#0F1513] text-[#7B8A83] hover:bg-[#223029]'
                          }`}
                      >
                          {penalties ? 'Ja' : 'Nej'}
                      </button>
                  </div>

                  {penalties && (
                      <div className="flex items-center gap-1.5 lg:gap-2">
                          <div className="flex-1 text-center">
                              <div className="text-[10px] lg:text-xs text-[#B6C2BC] mb-1 truncate">Straffar {match.team_a_name}</div>
                              <Input 
                                  type="number"
                                  min="0"
                                  max="10"
                                  value={penaltyScoreA}
                                  onChange={(e) => setPenaltyScoreA(e.target.value)}
                                  className="bg-[#0F1513] border-[#223029] text-white text-center h-9 lg:h-10 font-bold text-sm lg:text-base"
                                  placeholder="0"
                              />
                          </div>
                          <div className="text-[#7B8A83] font-bold text-xs lg:text-sm pt-3 lg:pt-4">-</div>
                          <div className="flex-1 text-center">
                              <div className="text-[10px] lg:text-xs text-[#B6C2BC] mb-1 truncate">Straffar {match.team_b_name}</div>
                              <Input 
                                  type="number"
                                  min="0"
                                  max="10"
                                  value={penaltyScoreB}
                                  onChange={(e) => setPenaltyScoreB(e.target.value)}
                                  className="bg-[#0F1513] border-[#223029] text-white text-center h-9 lg:h-10 font-bold text-sm lg:text-base"
                                  placeholder="0"
                              />
                          </div>
                      </div>
                  )}
              </div>
          )}
      </div>

      <div className="flex gap-2 lg:gap-3">
          <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1 border-[#223029] text-[#B6C2BC] hover:bg-[#18221E] hover:text-white h-10 lg:h-11 text-sm lg:text-base"
          >
              Avbryt
          </Button>
          <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || teamAScore === '' || teamBScore === ''}
              className="flex-1 bg-[#2BA84A] hover:bg-[#248232] text-white h-10 lg:h-11 text-sm lg:text-base"
          >
              {isSubmitting ? 'Sparar...' : 'Spara resultat'}
          </Button>
      </div>
    </div>
  );
}
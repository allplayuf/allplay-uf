import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { Trophy } from 'lucide-react';
import { useCustomDialog } from "../ui/custom-dialog";

export default function MatchResultModal({ match, onClose, onSuccess }) {
  const [teamAScore, setTeamAScore] = useState(match.team_a_score ?? '');
  const [teamBScore, setTeamBScore] = useState(match.team_b_score ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { alert } = useCustomDialog();

  const handleSubmit = async () => {
    if (teamAScore === '' || teamBScore === '') {
        await alert('Felaktig inmatning', 'Vänligen fyll i båda resultaten.', { type: 'warning' });
        return;
    }
    
    setIsSubmitting(true);
    try {
        await base44.functions.invoke('cups/enterMatchResult', {
            cup_match_id: match.id,
            team_a_score: parseInt(teamAScore),
            team_b_score: parseInt(teamBScore),
            extra_time: false,
            penalties: false
        });
        if (onSuccess) onSuccess();
        onClose();
    } catch (error) {
        console.error("Error reporting result:", error);
        await alert('Ett fel uppstod', error.response?.data?.error || 'Kunde inte spara resultatet. Försök igen.', { type: 'alert' });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#121715] border border-[#223029] rounded-[20px] w-full p-6 shadow-2xl">
      <div className="flex items-center gap-3 mb-6 text-[#F59E0B]">
          <Trophy className="w-6 h-6" />
          <h2 className="text-xl font-bold">Rapportera Resultat</h2>
      </div>
      
      <div className="flex items-center justify-between gap-4 mb-8">
          <div className="text-center flex-1">
              <div className="font-bold text-white mb-2 truncate">{match.team_a_name}</div>
              <Input 
                  type="number" 
                  value={teamAScore}
                  onChange={(e) => setTeamAScore(e.target.value)}
                  className="bg-[#18221E] border-[#223029] text-white text-center text-2xl h-16 font-bold"
              />
          </div>
          <div className="text-[#7B8A83] font-bold text-xl pt-6">-</div>
          <div className="text-center flex-1">
              <div className="font-bold text-white mb-2 truncate">{match.team_b_name}</div>
              <Input 
                  type="number" 
                  value={teamBScore}
                  onChange={(e) => setTeamBScore(e.target.value)}
                  className="bg-[#18221E] border-[#223029] text-white text-center text-2xl h-16 font-bold"
              />
          </div>
      </div>

      <div className="flex gap-3">
          <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1 border-[#223029] text-[#B6C2BC] hover:bg-[#18221E] hover:text-white"
          >
              Avbryt
          </Button>
          <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || teamAScore === '' || teamBScore === ''}
              className="flex-1 bg-[#2BA84A] hover:bg-[#248232] text-white"
          >
              {isSubmitting ? 'Sparar...' : 'Spara resultat'}
          </Button>
      </div>
    </div>
  );
}
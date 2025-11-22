import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Trophy,
  Star,
  Users,
  RefreshCw,
  Save,
  X,
  ThumbsUp,
  Award,
  Sparkles,
  CheckCircle,
  Medal,
  BarChart2
} from 'lucide-react';
import { Match } from '@/entities/Match';
import { MatchParticipant } from '@/entities/MatchParticipant';
import { MVPVote } from '@/entities/MVPVote';
import { User } from '@/entities/User';
import Confetti from '@/components/ui/confetti';
import { motion, AnimatePresence } from 'framer-motion';

export default function MatchEndModal({
  match,
  participants,
  currentUser,
  onClose,
  onSubmit
}) {
  const [step, setStep] = useState(1); // 1: MVP Vote, 2: Result, 3: Complete
  const [selectedMVP, setSelectedMVP] = useState(null);
  const [finalScore, setFinalScore] = useState('');
  const [matchRating, setMatchRating] = useState(0); // New: Match Rating
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    loadParticipantsDetails();
  }, [participants]); // Changed dependency from [participants, currentUser] to [participants]

  const loadParticipantsDetails = async () => {
    try {
      if (!currentUser?.id) {
        console.error('No currentUser provided to MatchEndModal or currentUser.id is missing.');
        // Optionally, handle this by showing a message or closing the modal
        return;
      }

      const allUsers = await User.list();
      const participantUsers = participants.
      map((p) => allUsers.find((u) => u.id === p.user_id)).
      filter((u) => u && u.id !== currentUser.id); // Ensure not to include current user in the vote list
      setUsersList(participantUsers);
    } catch (error) {
      console.error('Error loading participants:', error);
    }
  };

  const handleMVPVote = async () => {
    if (!selectedMVP) {
      // Allow skipping MVP if none selected? No, forcing selection or skip button is better.
      // But let's allow proceeding without MVP if they click "Skip"
    }

    setIsSubmitting(true);
    try {
      if (selectedMVP && currentUser?.id) {
        await MVPVote.create({
          match_id: match.id,
          voter_id: currentUser.id,
          nominee_id: selectedMVP,
          voted_at: new Date().toISOString()
        });

        // Update MVP count for the selected user
        const mvpUser = usersList.find((u) => u.id === selectedMVP);
        if (mvpUser) {
          await User.update(selectedMVP, {
            mvp_count: (mvpUser.mvp_count || 0) + 1
          });
        }
      }

      if (match.is_spontaneous) {
        await completeMatch();
        setShowConfetti(true);
        setStep(3);
      } else {
        setStep(2);
      }
    } catch (error) {
      console.error('Error submitting MVP vote:', error);
      // alert('Kunde inte spara MVP-röst. Försök igen.'); // Silent fail is better UX here sometimes
    } finally {
      setIsSubmitting(false);
    }
  };

  const completeMatch = async (score = null) => {
    const updateData = {
      status: 'completed',
      completed_at: new Date().toISOString(),
      result_reported_by: currentUser.id,
      rating: matchRating // Save organizer rating if we had a field for it (optional)
    };

    if (score) updateData.final_score = score;

    await Match.update(match.id, updateData);
    
    await User.updateMyUserData({
      matches_played: (currentUser.matches_played || 0) + 1
    });
  };

  const handleResultSubmit = async () => {
    if (!match.is_spontaneous && !finalScore.trim()) {
      // alert('Ange matchens resultat!'); 
      // Allow empty result if they really want? No, standard matches should have result.
    }

    setIsSubmitting(true);
    try {
      await completeMatch(finalScore.trim());
      setShowConfetti(true);
      setStep(3);
    } catch (error) {
      console.error('Error submitting result:', error);
      alert('Kunde inte spara resultat. Försök igen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePlayAgain = async () => {
    if (!currentUser?.id) {
      alert('Kunde inte identifiera användare för att skapa återmatch. Försök igen.');
      return;
    }

    try {
      // Create new match with same settings
      const newMatchData = {
        title: `${match.title} (Återmatch)`,
        venue_id: match.venue_id,
        organizer_id: currentUser.id,
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Next week
        time: match.time,
        format: match.format,
        max_players: match.max_players,
        is_spontaneous: match.is_spontaneous,
        skill_bracket: match.skill_bracket,
        duration_minutes: match.duration_minutes,
        notes: 'Återmatch - samma gäng!'
      };

      const newMatch = await Match.create(newMatchData);

      // Invite all participants
      for (const participant of participants) {
        await MatchParticipant.create({
          match_id: newMatch.id,
          user_id: participant.user_id,
          status: 'registered'
        });
      }

      alert('Återmatch skapad! Alla deltagare har bjudits in.');
      onClose(); // Close the modal after creating the rematch
    } catch (error) {
      console.error('Error creating rematch:', error);
      alert('Kunde inte skapa återmatch. Försök igen.');
    }
  };

  // Safety check: Render a loading state if currentUser is not available
  if (!currentUser) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
        <Card className="relative w-full max-w-lg bg-[#121715] border border-[#223029] shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-3xl p-6">
          <p className="text-[#F4F7F5] text-center">Laddar...</p>
        </Card>
      </div>);

  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose} />


      <Card className="relative w-full max-w-lg bg-[#121715] border border-[#223029] shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-3xl animate-in zoom-in-95 duration-300">

        {/* Step 1: MVP Voting */}
        {step === 1 &&
        <>
            <div className="p-6 border-b border-[#223029]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#F4743B] to-[#E5683A] rounded-2xl flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#F4F7F5]">Rösta på MVP</h2>
                    <p className="text-sm text-[#B6C2BC]">Vem spelade bäst?</p>
                  </div>
                </div>
                <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[#223029] text-[#B6C2BC] transition-colors">

                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <CardContent className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {usersList.length === 0 ?
            <div className="text-center py-8">
                  <Users className="w-12 h-12 text-[#248232] mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-[#B6C2BC]">Inga andra spelare att rösta på</p>
                </div> :

            <div className="space-y-2">
                  {usersList.map((user) =>
              <button
                key={user.id}
                onClick={() => setSelectedMVP(user.id)}
                className={`w-full p-4 rounded-2xl border-2 transition-all ${
                selectedMVP === user.id ?
                'border-[#F4743B] bg-[#F4743B]/10' :
                'border-[#223029] hover:border-[#2BA84A] bg-[#18221E]'}`
                }>

                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#2BA84A] to-[#248232] rounded-xl flex items-center justify-center flex-shrink-0">
                          {user.profile_image_url ?
                    <img src={user.profile_image_url} alt={user.full_name} className="w-full h-full object-cover rounded-xl" /> :

                    <span className="text-white font-semibold text-lg">{user.full_name?.[0] || 'U'}</span>
                    }
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-semibold text-[#F4F7F5]">{user.full_name}</p>
                          <p className="text-sm text-[#B6C2BC]">{user.city}</p>
                        </div>
                        {selectedMVP === user.id &&
                  <CheckCircle className="w-6 h-6 text-[#F4743B]" />
                  }
                      </div>
                    </button>
              )}
                </div>
            }
            </CardContent>

            <div className="p-6 border-t border-[#223029] space-y-2">
              <Button
              onClick={handleMVPVote}
              disabled={!selectedMVP || isSubmitting}
              className="w-full h-12 bg-[#F4743B] hover:bg-[#E5683A] text-white font-semibold rounded-2xl disabled:opacity-50">

                {isSubmitting ?
              <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Sparar...
                  </> :

              <>
                    <ThumbsUp className="w-5 h-5 mr-2" />
                    Rösta på MVP
                  </>
              }
              </Button>
              <button
                onClick={async () => {
                  if (match.is_spontaneous) {
                    // For spontaneous, complete match immediately
                    await Match.update(match.id, {
                      status: 'completed',
                      completed_at: new Date().toISOString(),
                      result_reported_by: currentUser.id
                    });
                    await User.updateMyUserData({
                      matches_played: (currentUser.matches_played || 0) + 1
                    });
                    setStep(3);
                  } else {
                    setStep(2);
                  }
                }}
                className="w-full h-10 text-sm text-[#B6C2BC] hover:text-[#F4F7F5] transition-colors"
              >
                Hoppa över
              </button>
            </div>
          </>
        }

        {/* Step 2: Result Entry */}
        {step === 2 && !match.is_spontaneous &&
        <>
            <div className="p-6 border-b border-[#223029]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#2BA84A] to-[#248232] rounded-2xl flex items-center justify-center">
                    <Save className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#F4F7F5]">Rapportera resultat</h2>
                    <p className="text-sm text-[#B6C2BC]">Hur blev det?</p>
                  </div>
                </div>
                <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[#223029] text-[#B6C2BC] transition-colors">

                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <CardContent className="p-6 space-y-6">
              <div>
                <Label className="text-[#F4F7F5] font-semibold mb-3 block">Slutresultat</Label>
                <Input
                placeholder="t.ex. 5-3 eller 2-2"
                value={finalScore}
                onChange={(e) => setFinalScore(e.target.value)}
                className="h-14 bg-[#18221E] border-[#223029] text-[#F4F7F5] text-lg text-center font-semibold rounded-2xl focus:border-[#2BA84A]" />

                <p className="text-xs text-[#B6C2BC] mt-2 text-center">Skriv resultatet som [hemma]-[borta]</p>
              </div>
            </CardContent>

            <div className="p-6 border-t border-[#223029] space-y-2">
              <Button
              onClick={handleResultSubmit}
              disabled={!finalScore.trim() || isSubmitting}
              className="w-full h-12 bg-[#2BA84A] hover:bg-[#248232] text-white font-semibold rounded-2xl disabled:opacity-50">

                {isSubmitting ?
              <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Sparar...
                  </> :

              <>
                    <Save className="w-5 h-5 mr-2" />
                    Spara resultat
                  </>
              }
              </Button>
              <button
              onClick={() => setStep(3)}
              className="w-full h-10 text-sm text-[#B6C2BC] hover:text-[#F4F7F5] transition-colors">

                Hoppa över
              </button>
            </div>
          </>
        }

        {/* Step 3: Complete / Play Again */}
        {step === 3 &&
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center relative overflow-hidden">
            {/* Background glow effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-64 bg-gradient-to-b from-[#2BA84A]/20 to-transparent blur-3xl pointer-events-none" />
            
            <div className="p-8 pb-0 relative z-10">
              <motion.div 
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", duration: 0.8 }}
                className="w-24 h-24 bg-gradient-to-br from-[#FFD700] to-[#FFA500] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[0_10px_40px_rgba(255,215,0,0.3)] ring-4 ring-[#FFD700]/20"
              >
                <Trophy className="w-12 h-12 text-white drop-shadow-md" />
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-3xl border-2 border-white/30 border-dashed opacity-50" 
                />
              </motion.div>

              <h2 className="text-3xl font-black text-white mb-2 drop-shadow-lg">BRA SPELAT!</h2>
              <p className="text-[#CFE8D6] mb-8 text-lg">Matchen är avslutad och statistiken uppdaterad.</p>

              {match.final_score && (
                <div className="mb-8 p-4 bg-[#18221E] rounded-2xl border border-[#223029]">
                  <div className="text-xs font-bold text-[#7B8A83] uppercase tracking-widest mb-1">Resultat</div>
                  <div className="text-4xl font-black text-white tracking-tight">{match.final_score}</div>
                </div>
              )}

              {selectedMVP &&
                <div className="p-4 bg-[#F4743B]/10 border border-[#F4743B]/30 rounded-2xl mb-6">
                  <div className="flex items-center justify-center gap-3">
                    <div className="bg-[#F4743B] p-1.5 rounded-lg">
                      <Award className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-base font-bold text-[#F4743B]">Din MVP-röst är registrerad!</span>
                  </div>
                </div>
              }
            </div>

            <div className="p-6 space-y-3 bg-[#0F1513] relative z-10 border-t border-[#223029]">
              <Button
                onClick={handlePlayAgain}
                className="w-full h-14 bg-[#2BA84A] hover:bg-[#248232] text-white font-bold text-lg rounded-2xl shadow-[0_4px_14px_rgba(43,168,74,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]">
                <RefreshCw className="w-5 h-5 mr-2" />
                Spela igen
              </Button>

              <Button
                onClick={() => {
                  if (onSubmit) onSubmit();
                  onClose();
                }}
                variant="ghost" 
                className="w-full h-12 text-[#7B8A83] hover:text-white hover:bg-[#18221E] rounded-2xl font-medium"
              >
                Stäng
              </Button>
            </div>
          </motion.div>
        }
      </Card>
    </div>);

}
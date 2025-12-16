import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
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
  BarChart2,
  Crown,
  Zap,
  Heart
} from 'lucide-react';
import Confetti from '@/components/ui/confetti';
import { motion, AnimatePresence } from 'framer-motion';

export default function MatchEndModal({
  match,
  participants,
  currentUser,
  onClose,
  onSubmit
}) {
  const [step, setStep] = useState(1); // 1: MVP Vote, 2: Player Ratings, 3: Result, 4: Complete
  const [selectedMVP, setSelectedMVP] = useState(null);
  const [playerRatings, setPlayerRatings] = useState({}); // Store ratings per player
  const [finalScore, setFinalScore] = useState('');
  const [matchRating, setMatchRating] = useState(0);
  const [matchFeedback, setMatchFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    if (participants && currentUser) {
      const voteablePlayers = participants.filter(p => p.id !== currentUser.id);
      setUsersList(voteablePlayers);
      
      // Initialize ratings for all players
      const initialRatings = {};
      voteablePlayers.forEach(p => {
        initialRatings[p.id] = 0;
      });
      setPlayerRatings(initialRatings);
    }
  }, [participants, currentUser]);

  // Check if user has already voted
  useEffect(() => {
    const checkExistingVote = async () => {
      if (currentUser?.id && match?.id) {
        try {
          const existingVotes = await base44.entities.MVPVote.filter({
            match_id: match.id,
            voter_id: currentUser.id
          });
          if (existingVotes && existingVotes.length > 0) {
            setHasVoted(true);
            setSelectedMVP(existingVotes[0].nominee_id);
          }
        } catch (error) {
          console.error('Error checking existing vote:', error);
        }
      }
    };
    checkExistingVote();
  }, [currentUser, match]);

  const handleMVPVote = async () => {
    if (!selectedMVP) return;

    setIsSubmitting(true);
    try {
      // Save MVP vote
      await base44.entities.MVPVote.create({
        match_id: match.id,
        voter_id: currentUser.id,
        nominee_id: selectedMVP,
        voted_at: new Date().toISOString()
      });

      setHasVoted(true);
      setStep(2); // Go to player ratings
    } catch (error) {
      console.error('Error submitting MVP vote:', error);
      alert('Kunde inte spara MVP-röst. Försök igen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingsSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Save player ratings as performance_rating in MatchParticipant
      for (const [userId, rating] of Object.entries(playerRatings)) {
        if (rating > 0) {
          const participant = participants.find(p => p.id === userId);
          if (participant && participant.participantInfo) {
            await base44.entities.MatchParticipant.update(
              participant.participantInfo.id,
              { performance_rating: rating }
            );
          }
        }
      }

      if (match.is_spontaneous) {
        await completeMatch();
        setShowConfetti(true);
        setStep(4);
      } else {
        setStep(3);
      }
    } catch (error) {
      console.error('Error submitting ratings:', error);
      alert('Kunde inte spara betyg. Försök igen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const completeMatch = async (score = null) => {
    const updateData = {
      status: 'completed',
      completed_at: new Date().toISOString(),
      result_reported_by: currentUser.id
    };

    if (score) updateData.final_score = score;
    if (matchFeedback) updateData.notes = matchFeedback;

    await base44.entities.Match.update(match.id, updateData);
    
    // Calculate MVP winner based on all votes
    try {
      const allVotes = await base44.entities.MVPVote.filter({ match_id: match.id });
      if (allVotes && allVotes.length > 0) {
        const voteCounts = {};
        allVotes.forEach(vote => {
          voteCounts[vote.nominee_id] = (voteCounts[vote.nominee_id] || 0) + 1;
        });
        
        const mvpId = Object.keys(voteCounts).reduce((a, b) => 
          voteCounts[a] > voteCounts[b] ? a : b
        );
        
        // Update match with MVP and increment MVP count
        await base44.entities.Match.update(match.id, { mvp_user_id: mvpId });
        
        const mvpUser = participants.find(p => p.id === mvpId);
        if (mvpUser) {
          await base44.auth.updateMe({ 
            mvp_count: (mvpUser.mvp_count || 0) + 1 
          });
        }
      }
    } catch (error) {
      console.error('Error calculating MVP:', error);
    }

    await base44.auth.updateMe({
      matches_played: (currentUser.matches_played || 0) + 1
    });
  };

  const handleResultSubmit = async () => {
    if (!match.is_spontaneous && !finalScore.trim()) {
      alert('Ange matchens resultat!');
      return;
    }

    setIsSubmitting(true);
    try {
      await completeMatch(finalScore.trim());
      setShowConfetti(true);
      setStep(4);
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

    setIsSubmitting(true);
    try {
      const newMatchData = {
        title: `${match.title} (Återmatch)`,
        venue_id: match.venue_id,
        organizer_id: currentUser.id,
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: match.time,
        format: match.format,
        max_players: match.max_players,
        is_spontaneous: match.is_spontaneous,
        skill_bracket: match.skill_bracket,
        duration_minutes: match.duration_minutes,
        notes: 'Återmatch - samma gäng!'
      };

      const newMatch = await base44.entities.Match.create(newMatchData);

      for (const participant of participants) {
        await base44.entities.MatchParticipant.create({
          match_id: newMatch.id,
          user_id: participant.id,
          status: 'registered'
        });
      }

      alert('Återmatch skapad! Alla deltagare har bjudits in.');
      onClose();
    } catch (error) {
      console.error('Error creating rematch:', error);
      alert('Kunde inte skapa återmatch. Försök igen.');
    } finally {
      setIsSubmitting(false);
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
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
        onClick={onClose} />

      {showConfetti && <Confetti />}

      <Card className="relative w-full max-w-2xl bg-gradient-to-br from-[#121715] to-[#0F1513] border border-[#2BA84A]/20 shadow-[0_20px_60px_rgba(0,0,0,0.8)] rounded-[32px]">

        {/* Step 1: MVP Voting */}
        {step === 1 &&
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          exit={{ opacity: 0, y: -20 }}
          className="relative"
        >
            {/* Gradient header background */}
            <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-[#F4743B]/20 to-transparent rounded-t-[32px] pointer-events-none" />
            
            <div className="p-8 border-b border-[#223029]/50 relative">
              <button
                onClick={onClose}
                className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center rounded-2xl bg-[#18221E]/80 backdrop-blur-sm hover:bg-[#223029] text-[#B6C2BC] hover:text-white transition-all">
                <X className="w-6 h-6" />
              </button>

              <div className="text-center">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", duration: 0.8 }}
                  className="w-20 h-20 bg-gradient-to-br from-[#FFD700] to-[#F4743B] rounded-[24px] flex items-center justify-center mx-auto mb-4 shadow-[0_12px_40px_rgba(255,215,0,0.4)] ring-4 ring-[#FFD700]/20"
                >
                  <Crown className="w-10 h-10 text-white drop-shadow-md" />
                </motion.div>
                <h2 className="text-3xl font-black text-white mb-2 drop-shadow-lg">Rösta på MVP</h2>
                <p className="text-base text-[#CFE8D6]">Vem var matchens bästa spelare?</p>
              </div>
            </div>

            <CardContent className="p-8 space-y-4 max-h-[50vh] overflow-y-auto">
              {hasVoted && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 p-5 bg-gradient-to-r from-[#2BA84A]/20 to-[#248232]/10 border border-[#2BA84A]/30 rounded-[24px] backdrop-blur-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-[#2BA84A] p-2 rounded-xl">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-[#2BA84A] text-lg">Du har redan röstat!</p>
                      <p className="text-sm text-[#CFE8D6]">Din röst har registrerats</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {usersList.length === 0 ?
            <div className="text-center py-16 bg-gradient-to-br from-[#18221E] to-[#0F1513] rounded-[24px] border border-[#223029]">
                  <Users className="w-16 h-16 text-[#248232] mx-auto mb-4 opacity-50" />
                  <p className="text-base text-[#B6C2BC]">Inga andra spelare att rösta på</p>
                </div> :

            <div className="grid grid-cols-1 gap-4">
                  {usersList.map((user) =>
              <motion.button
                key={user.id}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedMVP(user.id)}
                disabled={hasVoted}
                className={`w-full p-5 rounded-[20px] border-2 transition-all relative overflow-hidden shadow-lg ${
                selectedMVP === user.id ?
                'border-[#FFD700] bg-gradient-to-br from-[#FFD700]/20 to-[#F4743B]/10 shadow-[#FFD700]/20' :
                'border-[#223029] hover:border-[#2BA84A]/50 bg-gradient-to-br from-[#18221E] to-[#121715] hover:shadow-[#2BA84A]/10'} ${hasVoted ? 'opacity-50 cursor-not-allowed' : ''}`
                }>
                      {selectedMVP === user.id && (
                        <motion.div 
                          layoutId="mvp-highlight"
                          className="absolute inset-0 bg-gradient-to-r from-[#FFD700]/10 via-[#F4743B]/10 to-transparent"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}

                      <div className="flex items-center gap-5 relative z-10">
                        <div className="relative">
                          <div className={`w-16 h-16 rounded-[18px] flex items-center justify-center flex-shrink-0 overflow-hidden transition-all ${
                            selectedMVP === user.id 
                              ? 'bg-gradient-to-br from-[#FFD700] to-[#F4743B] shadow-[0_8px_24px_rgba(255,215,0,0.4)]' 
                              : 'bg-gradient-to-br from-[#2BA84A] to-[#248232]'
                          }`}>
                            {user.profile_image_url ?
                      <img src={user.profile_image_url} alt={user.full_name} className="w-full h-full object-cover" /> :
                      <span className="text-white font-bold text-2xl">{user.full_name?.[0] || 'U'}</span>
                      }
                          </div>
                          {selectedMVP === user.id && 
                            <motion.div 
                              initial={{ scale: 0, rotate: -180 }} 
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ type: "spring", duration: 0.6 }}
                              className="absolute -top-2 -right-2 w-8 h-8 bg-[#FFD700] rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(255,215,0,0.6)] border-2 border-[#121715]">
                              <Crown className="w-4 h-4 text-[#1A1A1A]" />
                            </motion.div>
                          }
                        </div>
                        <div className="flex-1 text-left">
                          <p className={`font-black text-xl transition-colors ${selectedMVP === user.id ? 'text-[#FFD700]' : 'text-[#F4F7F5]'}`}>
                            {user.full_name}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-sm text-[#B6C2BC]">{user.city}</p>
                            <div className="flex items-center gap-1">
                              <Trophy className="w-3.5 h-3.5 text-[#F4743B]" />
                              <span className="text-xs font-bold text-[#F4743B]">{user.mvp_count || 0} MVPs</span>
                            </div>
                          </div>
                        </div>
                        {selectedMVP === user.id &&
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <CheckCircle className="w-8 h-8 text-[#FFD700]" />
                          </motion.div>
                        }
                      </div>
                    </motion.button>
              )}
                </div>
            }
            </CardContent>

            <div className="p-8 pt-6 border-t border-[#223029]/50 space-y-3 bg-gradient-to-b from-transparent to-[#0A0D0B]">
              <Button
              onClick={handleMVPVote}
              disabled={!selectedMVP || isSubmitting || hasVoted}
              className="w-full h-16 text-xl bg-gradient-to-r from-[#FFD700] to-[#F4743B] hover:from-[#FFC700] hover:to-[#E5683A] text-white font-black rounded-[20px] shadow-[0_8px_24px_rgba(255,215,0,0.4)] disabled:opacity-50 disabled:shadow-none transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed">

                {isSubmitting ?
              <>
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin mr-3" />
                    Sparar...
                  </> : hasVoted ?
              <>
                    <CheckCircle className="w-6 h-6 mr-3" />
                    Röst registrerad
                  </> :
              <>
                    <Crown className="w-6 h-6 mr-3" />
                    Rösta på {usersList.find(u => u.id === selectedMVP)?.full_name?.split(' ')[0] || 'spelare'}
                  </>
              }
              </Button>
              <button
                onClick={() => setStep(2)}
                disabled={hasVoted}
                className="w-full py-3 text-base font-semibold text-[#7B8A83] hover:text-[#F4F7F5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hoppa över MVP-röstning
              </button>
            </div>
          </motion.div>
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
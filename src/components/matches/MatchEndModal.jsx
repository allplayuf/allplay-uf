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
  Award,
  CheckCircle,
  Sparkles,
  TrendingUp,
  Search,
  Crown,
  Medal
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
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
  const [matchRating, setMatchRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mvpSubmitted, setMvpSubmitted] = useState(false);
  const [hasUserVoted, setHasUserVoted] = useState(false);

  useEffect(() => {
    loadData();
  }, [participants, currentUser]);

  const loadData = async () => {
    if (participants && currentUser) {
      // Include ALL participants in the voting list (including current user)
      setUsersList(participants);

      // Check if user has already voted
      try {
        const existingVotes = await base44.entities.MVPVote.filter({
          match_id: match.id,
          voter_id: currentUser.id
        });
        setHasUserVoted(existingVotes.length > 0);
      } catch (err) {
        console.error('Error checking vote status:', err);
      }
    }
  };

  // Skip MVP for cup matches
  useEffect(() => {
    if (match.is_cup_match && step === 1) {
      setStep(2);
    }
  }, [match.is_cup_match, step]);

  const handleMVPVote = async () => {
    if (!selectedMVP) {
      // Allow skipping without selection
      if (match.is_spontaneous) {
        await completeMatch();
        setShowConfetti(true);
        setStep(3);
      } else {
        setStep(2);
      }
      return;
    }

    setIsSubmitting(true);
    try {
      // Create MVP vote
      await base44.entities.MVPVote.create({
        match_id: match.id,
        voter_id: currentUser.id,
        nominee_id: selectedMVP,
        voted_at: new Date().toISOString()
      });

      // Update MVP count for the selected user
      const mvpUser = usersList.find((u) => u.id === selectedMVP);
      if (mvpUser) {
        await base44.entities.User.update(selectedMVP, {
          mvp_count: (mvpUser.mvp_count || 0) + 1
        });
      }

      setMvpSubmitted(true);

      if (match.is_spontaneous) {
        await completeMatch();
        setShowConfetti(true);
        setStep(3);
      } else {
        setStep(2);
      }
    } catch (error) {
      console.error('Error submitting MVP vote:', error);
      alert('Kunde inte spara MVP-röst. Försök igen.');
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
    if (matchRating > 0) updateData.rating = matchRating;

    await base44.entities.Match.update(match.id, updateData);

    // Update user's match count
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
    }
  };

  const filteredUsers = usersList.filter(user =>
    (user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.city?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!currentUser) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
        <Card className="relative w-full max-w-lg bg-[#121715] border border-[#223029] shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-3xl p-6">
          <p className="text-[#F4F7F5] text-center">Laddar...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="relative w-full max-w-2xl"
      >
        <Card className="bg-[#121715] border border-[#223029] shadow-[0_20px_60px_rgba(0,0,0,0.6)] rounded-3xl overflow-hidden">
          {/* Step 1: MVP Voting */}
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="mvp"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Header */}
                <div className="p-6 border-b border-[#223029] bg-gradient-to-r from-[#F4743B]/10 to-transparent">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#F4743B] to-[#E5683A] rounded-2xl flex items-center justify-center shadow-lg">
                        <Trophy className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-[#F4F7F5] mb-1">Rösta på MVP</h2>
                        <p className="text-sm text-[#B6C2BC]">
                          {hasUserVoted ? 'Du har redan röstat i denna match' : 'Vem var matchens bästa spelare?'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[#223029] text-[#B6C2BC] hover:text-white transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <CardContent className="p-6">
                  {hasUserVoted ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-[#2BA84A]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-10 h-10 text-[#2BA84A]" />
                      </div>
                      <h3 className="text-xl font-bold text-[#F4F7F5] mb-2">Tack för din röst!</h3>
                      <p className="text-[#B6C2BC] mb-6">Du har redan röstat på MVP för denna match</p>
                      <Button
                        onClick={() => {
                          if (match.is_spontaneous) {
                            setStep(3);
                          } else {
                            setStep(2);
                          }
                        }}
                        className="bg-[#2BA84A] hover:bg-[#248232] text-white"
                      >
                        Fortsätt
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* Search Bar */}
                      {usersList.length > 6 && (
                        <div className="mb-4">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7B8A83]" />
                            <input
                              type="text"
                              placeholder="Sök spelare..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full h-12 pl-11 pr-4 bg-[#18221E] border border-[#223029] rounded-xl text-[#F4F7F5] placeholder:text-[#7B8A83] focus:border-[#2BA84A] focus:outline-none transition-colors"
                            />
                          </div>
                        </div>
                      )}

                      {/* Players List */}
                      <div className="max-h-[50vh] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        {filteredUsers.length === 0 ? (
                          <div className="text-center py-12 bg-[#18221E]/50 rounded-3xl border border-dashed border-[#223029]">
                            <Users className="w-12 h-12 text-[#248232] mx-auto mb-3 opacity-50" />
                            <p className="text-sm text-[#B6C2BC]">
                              {searchQuery ? 'Inga spelare hittades' : 'Inga spelare att rösta på'}
                            </p>
                          </div>
                        ) : (
                          filteredUsers.map((user) => {
                            const isCurrentUser = user.id === currentUser.id;
                            const isSelected = selectedMVP === user.id;

                            return (
                              <motion.button
                                key={user.id}
                                whileHover={{ scale: 1.02, x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedMVP(user.id)}
                                className={`w-full p-4 rounded-2xl border-2 transition-all relative overflow-hidden group ${
                                  isSelected
                                    ? 'border-[#F4743B] bg-gradient-to-r from-[#F4743B]/10 to-[#F4743B]/5 shadow-lg shadow-[#F4743B]/20'
                                    : 'border-[#223029] hover:border-[#2BA84A]/50 bg-[#18221E]'
                                }`}
                              >
                                {/* Background glow on selected */}
                                {isSelected && (
                                  <motion.div
                                    layoutId="selectedGlow"
                                    className="absolute inset-0 bg-[#F4743B]/5"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                  />
                                )}

                                <div className="flex items-center gap-4 relative z-10">
                                  {/* Avatar */}
                                  <div className="relative">
                                    <div className={`w-16 h-16 bg-gradient-to-br from-[#2BA84A] to-[#248232] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner overflow-hidden ring-2 transition-all ${
                                      isSelected ? 'ring-[#F4743B] scale-105' : 'ring-transparent'
                                    }`}>
                                      {user.profile_image_url ? (
                                        <img src={user.profile_image_url} alt={user.full_name} className="w-full h-full object-cover" />
                                      ) : (
                                        <span className="text-white font-bold text-xl">{user.full_name?.[0] || 'U'}</span>
                                      )}
                                    </div>

                                    {/* Trophy badge on selected */}
                                    {isSelected && (
                                      <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: "spring", delay: 0.1 }}
                                        className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-[#FFD700] to-[#F4743B] rounded-full flex items-center justify-center shadow-lg border-2 border-[#121715]"
                                      >
                                        <Trophy className="w-4 h-4 text-white" />
                                      </motion.div>
                                    )}

                                    {/* "Du" badge for current user */}
                                    {isCurrentUser && (
                                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#2BA84A] rounded-full text-[10px] font-bold text-white">
                                        Du
                                      </div>
                                    )}
                                  </div>

                                  {/* User Info */}
                                  <div className="flex-1 text-left">
                                    <p className={`font-bold text-lg mb-0.5 transition-colors ${
                                      isSelected ? 'text-[#F4743B]' : 'text-[#F4F7F5]'
                                    }`}>
                                      {user.display_name || user.full_name}
                                    </p>
                                    <div className="flex items-center gap-3 text-sm text-[#B6C2BC]">
                                      <span>{user.city}</span>
                                      <span>•</span>
                                      <span className="flex items-center gap-1">
                                        <Trophy className="w-3 h-3" />
                                        {user.mvp_count || 0} MVPs
                                      </span>
                                    </div>
                                  </div>

                                  {/* Check icon */}
                                  {isSelected && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{ type: "spring" }}
                                    >
                                      <CheckCircle className="w-7 h-7 text-[#F4743B]" />
                                    </motion.div>
                                  )}
                                </div>
                              </motion.button>
                            );
                          })
                        )}
                      </div>
                    </>
                  )}
                </CardContent>

                {/* Footer */}
                {!hasUserVoted && (
                  <div className="p-6 border-t border-[#223029] bg-[#0F1513] space-y-3">
                    <Button
                      onClick={handleMVPVote}
                      disabled={!selectedMVP || isSubmitting}
                      className="w-full h-14 text-lg bg-gradient-to-r from-[#F4743B] to-[#E5683A] hover:from-[#E5683A] hover:to-[#D45629] text-white font-bold rounded-2xl shadow-[0_4px_14px_rgba(244,116,59,0.4)] disabled:opacity-50 disabled:shadow-none transition-all hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Sparar röst...
                        </>
                      ) : (
                        <>
                          <Award className="w-5 h-5 mr-2" />
                          {selectedMVP ? 'Bekräfta MVP-röst' : 'Välj en spelare'}
                        </>
                      )}
                    </Button>

                    <button
                      onClick={async () => {
                        if (match.is_spontaneous) {
                          await completeMatch();
                          setShowConfetti(true);
                          setStep(3);
                        } else {
                          setStep(2);
                        }
                      }}
                      className="w-full py-3 text-sm font-medium text-[#7B8A83] hover:text-[#F4F7F5] transition-colors"
                    >
                      Hoppa över MVP-röstning
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 2: Result Entry */}
            {step === 2 && !match.is_spontaneous && (
              <motion.div
                key="result"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="p-6 border-b border-[#223029] bg-gradient-to-r from-[#2BA84A]/10 to-transparent">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#2BA84A] to-[#248232] rounded-2xl flex items-center justify-center shadow-lg">
                        <Save className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-[#F4F7F5] mb-1">Rapportera resultat</h2>
                        <p className="text-sm text-[#B6C2BC]">Hur blev det?</p>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[#223029] text-[#B6C2BC] hover:text-white transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <CardContent className="p-6 space-y-6">
                  <div>
                    <Label className="text-[#F4F7F5] font-semibold mb-3 block text-lg">Slutresultat</Label>
                    <Input
                      placeholder="t.ex. 5-3 eller 2-2"
                      value={finalScore}
                      onChange={(e) => setFinalScore(e.target.value)}
                      className="h-16 bg-[#18221E] border-[#223029] text-[#F4F7F5] text-2xl text-center font-bold rounded-2xl focus:border-[#2BA84A] focus:ring-2 focus:ring-[#2BA84A]/20"
                    />
                    <p className="text-xs text-[#B6C2BC] mt-2 text-center">Skriv resultatet som [hemma]-[borta]</p>
                  </div>

                  {/* Optional: Match Rating */}
                  <div>
                    <Label className="text-[#F4F7F5] font-semibold mb-3 block">Betygsätt matchen (valfritt)</Label>
                    <div className="flex items-center justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => setMatchRating(rating)}
                          className="group"
                        >
                          <Star
                            className={`w-10 h-10 transition-all ${
                              rating <= matchRating
                                ? 'text-[#FFD700] fill-[#FFD700]'
                                : 'text-[#223029] group-hover:text-[#7B8A83]'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>

                <div className="p-6 border-t border-[#223029] bg-[#0F1513] space-y-3">
                  <Button
                    onClick={handleResultSubmit}
                    disabled={!finalScore.trim() || isSubmitting}
                    className="w-full h-14 text-lg bg-[#2BA84A] hover:bg-[#248232] text-white font-bold rounded-2xl disabled:opacity-50 shadow-[0_4px_14px_rgba(43,168,74,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Sparar resultat...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-2" />
                        Spara och avsluta
                      </>
                    )}
                  </Button>

                  <button
                    onClick={async () => {
                      await completeMatch();
                      setShowConfetti(true);
                      setStep(3);
                    }}
                    className="w-full py-3 text-sm font-medium text-[#7B8A83] hover:text-[#F4F7F5] transition-colors"
                  >
                    Fortsätt utan resultat
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Complete */}
            {step === 3 && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="text-center relative overflow-hidden"
              >
                {showConfetti && <Confetti />}

                {/* Background glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-96 bg-gradient-to-b from-[#2BA84A]/30 to-transparent blur-3xl pointer-events-none" />

                <div className="p-8 relative z-10">
                  {/* Trophy animation */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", duration: 0.8, bounce: 0.5 }}
                    className="w-32 h-32 bg-gradient-to-br from-[#FFD700] via-[#FFA500] to-[#FF8C00] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[0_20px_60px_rgba(255,215,0,0.4)] ring-4 ring-[#FFD700]/30 relative"
                  >
                    <Trophy className="w-16 h-16 text-white drop-shadow-2xl" />
                    
                    {/* Rotating ring */}
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 rounded-3xl border-2 border-white/40 border-dashed"
                    />

                    {/* Sparkles */}
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{
                          scale: [0, 1, 0],
                          opacity: [0, 1, 0],
                          x: Math.cos((i * Math.PI) / 4) * 60,
                          y: Math.sin((i * Math.PI) / 4) * 60,
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                        className="absolute top-1/2 left-1/2 w-2 h-2 bg-[#FFD700] rounded-full"
                      />
                    ))}
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-4xl font-black text-white mb-3 drop-shadow-lg"
                  >
                    BRA SPELAT! 🎉
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-[#CFE8D6] mb-8 text-lg"
                  >
                    Matchen är avslutad och statistiken uppdaterad.
                  </motion.p>

                  {/* Stats display */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    {match.final_score && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                        className="col-span-2 p-6 bg-[#18221E] rounded-2xl border border-[#223029] shadow-inner"
                      >
                        <div className="text-xs font-bold text-[#7B8A83] uppercase tracking-widest mb-2">Resultat</div>
                        <div className="text-5xl font-black text-white tracking-tight">{match.final_score}</div>
                      </motion.div>
                    )}

                    {mvpSubmitted && selectedMVP && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 }}
                        className="col-span-2 p-4 bg-gradient-to-r from-[#F4743B]/10 to-[#E5683A]/10 border border-[#F4743B]/30 rounded-2xl"
                      >
                        <div className="flex items-center justify-center gap-3">
                          <div className="bg-[#F4743B] p-2 rounded-lg">
                            <Award className="w-5 h-5 text-white" />
                          </div>
                          <div className="text-left">
                            <div className="text-xs text-[#F4743B]/80 font-semibold uppercase">MVP-röst</div>
                            <div className="text-base font-bold text-[#F4743B]">Din röst är registrerad!</div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {matchRating > 0 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.7 }}
                        className="col-span-2 p-4 bg-[#18221E] rounded-2xl border border-[#223029]"
                      >
                        <div className="text-xs text-[#B6C2BC] font-semibold uppercase mb-2">Ditt betyg</div>
                        <div className="flex items-center justify-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-6 h-6 ${
                                i < matchRating ? 'text-[#FFD700] fill-[#FFD700]' : 'text-[#223029]'
                              }`}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                <div className="p-6 space-y-3 bg-[#0F1513] relative z-10 border-t border-[#223029]">
                  <Button
                    onClick={handlePlayAgain}
                    className="w-full h-14 bg-[#2BA84A] hover:bg-[#248232] text-white font-bold text-lg rounded-2xl shadow-[0_4px_14px_rgba(43,168,74,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
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
            )}
          </AnimatePresence>
        </Card>
      </motion.div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #18221E;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #223029;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #2BA84A;
        }
      `}</style>
    </div>
  );
}
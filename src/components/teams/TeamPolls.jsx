import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, BarChart, Check, X } from "lucide-react";
import { TeamPoll } from "@/entities/TeamPoll";
import { TeamMessage } from "@/entities/TeamMessage";

export default function TeamPolls({ team, currentUser, isMember, isCaptainOrVice }) {
  const [polls, setPolls] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPoll, setNewPoll] = useState({
    question: '',
    options: ['', '']
  });

  useEffect(() => {
    loadPolls();
  }, [team.id]);

  const loadPolls = async () => {
    try {
      const pollData = await TeamPoll.filter({ team_id: team.id }, '-created_date', 10);
      setPolls(pollData);
    } catch (error) {
      console.error('Error loading polls:', error);
    }
  };

  const handleCreatePoll = async (e) => {
    e.preventDefault();
    
    const validOptions = newPoll.options.filter(o => o.trim());
    if (!newPoll.question.trim() || validOptions.length < 2) {
      alert('Ange en fråga och minst 2 alternativ');
      return;
    }

    try {
      const pollOptions = validOptions.map(text => ({ text, votes: [] }));
      
      await TeamPoll.create({
        team_id: team.id,
        creator_id: currentUser.id,
        question: newPoll.question.trim(),
        options: pollOptions,
        status: 'active'
      });

      await TeamMessage.create({
        team_id: team.id,
        user_id: currentUser.id,
        message_type: 'poll_created',
        content: `📊 Ny omröstning: ${newPoll.question}`
      });

      setNewPoll({ question: '', options: ['', ''] });
      setShowCreateForm(false);
      loadPolls();
    } catch (error) {
      console.error('Error creating poll:', error);
      alert('Kunde inte skapa omröstning. Försök igen.');
    }
  };

  const handleVote = async (pollId, optionIndex) => {
    const poll = polls.find(p => p.id === pollId);
    if (!poll || poll.status !== 'active') return;

    try {
      const updatedOptions = poll.options.map((opt, idx) => {
        const votes = opt.votes || [];
        const hasVoted = votes.includes(currentUser.id);
        
        if (idx === optionIndex) {
          return { ...opt, votes: hasVoted ? votes : [...votes, currentUser.id] };
        } else {
          return { ...opt, votes: votes.filter(id => id !== currentUser.id) };
        }
      });

      await TeamPoll.update(pollId, { options: updatedOptions });
      loadPolls();
    } catch (error) {
      console.error('Error voting:', error);
      alert('Kunde inte registrera röst. Försök igen.');
    }
  };

  const handleClosePoll = async (pollId) => {
    try {
      await TeamPoll.update(pollId, { status: 'closed' });
      loadPolls();
    } catch (error) {
      console.error('Error closing poll:', error);
    }
  };

  const getTotalVotes = (options) => {
    return options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0);
  };

  const getVotePercentage = (votes, total) => {
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
  };

  const hasUserVoted = (options) => {
    return options.some(opt => opt.votes?.includes(currentUser.id));
  };

  if (!isMember) {
    return (
      <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[16px]">
        <CardContent className="p-12 text-center">
          <p className="text-[#B6C2BC]">Endast lagmedlemmar kan se omröstningar</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Create Poll Button */}
      {isCaptainOrVice && !showCreateForm && (
        <Button
          onClick={() => setShowCreateForm(true)}
          className="w-full bg-[#2BA84A]/16 hover:bg-[#2BA84A]/24 text-[#EAF6EE] ring-1 ring-[#2BA84A]/30 font-semibold"
        >
          <Plus className="w-5 h-5 mr-2" />
          Skapa omröstning
        </Button>
      )}

      {/* Create Poll Form */}
      {showCreateForm && (
        <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[16px]">
          <CardContent className="p-6">
            <form onSubmit={handleCreatePoll} className="space-y-4">
              <div>
                <label className="text-[13px] leading-[18px] text-[#B6C2BC] mb-2 block">Fråga</label>
                <Input
                  value={newPoll.question}
                  onChange={(e) => setNewPoll({ ...newPoll, question: e.target.value })}
                  placeholder="T.ex. Vilken dag passar bäst?"
                  className="bg-[#18221E] border border-[#223029] text-[#F4F7F5]"
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[13px] leading-[18px] text-[#B6C2BC] block">Alternativ</label>
                {newPoll.options.map((opt, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      value={opt}
                      onChange={(e) => {
                        const opts = [...newPoll.options];
                        opts[idx] = e.target.value;
                        setNewPoll({ ...newPoll, options: opts });
                      }}
                      placeholder={`Alternativ ${idx + 1}`}
                      className="bg-[#18221E] border border-[#223029] text-[#F4F7F5]"
                      maxLength={100}
                    />
                    {newPoll.options.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          const opts = newPoll.options.filter((_, i) => i !== idx);
                          setNewPoll({ ...newPoll, options: opts });
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                
                {newPoll.options.length < 6 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setNewPoll({ ...newPoll, options: [...newPoll.options, ''] })}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Lägg till alternativ
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1"
                >
                  Avbryt
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#2BA84A] hover:bg-[#248232] text-[#FFFFFF]"
                >
                  Skapa
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Polls List */}
      {polls.length === 0 ? (
        <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[16px]">
          <CardContent className="p-12 text-center">
            <BarChart className="w-12 h-12 text-[#9FC9AC] mx-auto mb-4" />
            <p className="text-[#B6C2BC]">Inga omröstningar ännu</p>
          </CardContent>
        </Card>
      ) : (
        polls.map((poll) => {
          const totalVotes = getTotalVotes(poll.options);
          const userVoted = hasUserVoted(poll.options);

          return (
            <Card key={poll.id} className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[16px]">
              <CardHeader className="border-b border-[#223029]">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-[16px] leading-[24px] text-[#F4F7F5] flex-1">
                    {poll.question}
                  </CardTitle>
                  <Badge className={poll.status === 'active' ? 'bg-[#2BA84A]/20 text-[#CFE8D6]' : 'bg-[#7B8A83]/20 text-[#B6C2BC]'}>
                    {poll.status === 'active' ? 'Aktiv' : 'Avslutad'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                {poll.options.map((option, idx) => {
                  const votes = option.votes?.length || 0;
                  const percentage = getVotePercentage(votes, totalVotes);
                  const hasVotedThis = option.votes?.includes(currentUser.id);

                  return (
                    <div key={idx}>
                      <button
                        onClick={() => poll.status === 'active' && handleVote(poll.id, idx)}
                        disabled={poll.status !== 'active'}
                        className="w-full text-left"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[14px] leading-[20px] ${hasVotedThis ? 'text-[#2BA84A] font-semibold' : 'text-[#F4F7F5]'}`}>
                            {option.text}
                            {hasVotedThis && <Check className="w-4 h-4 inline ml-2" />}
                          </span>
                          <span className="text-[13px] leading-[18px] text-[#B6C2BC]">
                            {votes} röster ({percentage}%)
                          </span>
                        </div>
                        <div className="h-2 bg-[#18221E] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${hasVotedThis ? 'bg-[#2BA84A]' : 'bg-[#7B8A83]'}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </button>
                    </div>
                  );
                })}

                <div className="flex items-center justify-between pt-3 border-t border-[#223029]">
                  <span className="text-[13px] leading-[18px] text-[#B6C2BC]">
                    {totalVotes} röster totalt
                  </span>
                  {isCaptainOrVice && poll.status === 'active' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleClosePoll(poll.id)}
                    >
                      Avsluta
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
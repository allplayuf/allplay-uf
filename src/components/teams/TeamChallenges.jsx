import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Shield, Swords, Calendar, Clock, MapPin, Check, X } from "lucide-react";
import { Team } from "@/entities/Team";
import { TeamChallenge } from "@/entities/TeamChallenge";
import { Venue } from "@/entities/Venue";
import { Match } from "@/entities/Match";

export default function TeamChallenges({ team, currentUser, isCaptainOrVice }) {
  const [challenges, setChallenges] = useState([]);
  const [showSendChallengeForm, setShowSendChallengeForm] = useState(false);
  const [teams, setTeams] = useState([]);
  const [venues, setVenues] = useState([]);
  const [newChallenge, setNewChallenge] = useState({
    challenged_team_id: '',
    proposed_date: '',
    proposed_time: '',
    venue_id: '',
    format: '5v5',
    message: ''
  });

  useEffect(() => {
    loadChallenges();
    loadTeams();
    loadVenues();
  }, [team.id]);

  const loadChallenges = async () => {
    try {
      const sent = await TeamChallenge.filter({ challenger_team_id: team.id }, '-created_date');
      const received = await TeamChallenge.filter({ challenged_team_id: team.id }, '-created_date');
      
      const allChallenges = [...sent, ...received];
      
      const challengesWithTeams = await Promise.all(
        allChallenges.map(async (c) => {
          const challengerTeam = await Team.get(c.challenger_team_id);
          const challengedTeam = await Team.get(c.challenged_team_id);
          return { ...c, challengerTeam, challengedTeam };
        })
      );
      
      setChallenges(challengesWithTeams);
    } catch (error) {
      console.error('Error loading challenges:', error);
    }
  };

  const loadTeams = async () => {
    try {
      const allTeams = await Team.list();
      const otherTeams = allTeams.filter(t => t.id !== team.id);
      setTeams(otherTeams);
    } catch (error) {
      console.error('Error loading teams:', error);
    }
  };

  const loadVenues = async () => {
    try {
      const venueData = await Venue.list();
      setVenues(venueData);
    } catch (error) {
      console.error('Error loading venues:', error);
    }
  };

  const handleSendChallenge = async (e) => {
    e.preventDefault();

    if (!newChallenge.challenged_team_id || !newChallenge.format) {
      alert('Välj ett lag och format');
      return;
    }

    try {
      await TeamChallenge.create({
        challenger_team_id: team.id,
        challenged_team_id: newChallenge.challenged_team_id,
        proposed_date: newChallenge.proposed_date || null,
        proposed_time: newChallenge.proposed_time || null,
        venue_id: newChallenge.venue_id || null,
        format: newChallenge.format,
        message: newChallenge.message.trim(),
        status: 'pending'
      });

      setNewChallenge({
        challenged_team_id: '',
        proposed_date: '',
        proposed_time: '',
        venue_id: '',
        format: '5v5',
        message: ''
      });
      setShowSendChallengeForm(false);
      loadChallenges();
      alert('Utmaning skickad!');
    } catch (error) {
      console.error('Error sending challenge:', error);
      alert('Kunde inte skicka utmaning. Försök igen.');
    }
  };

  const handleAcceptChallenge = async (challengeId) => {
    try {
      const challenge = challenges.find(c => c.id === challengeId);
      if (!challenge) return;

      // Create match
      const match = await Match.create({
        title: `${challenge.challengerTeam.name} vs ${challenge.challengedTeam.name}`,
        venue_id: challenge.venue_id,
        organizer_id: currentUser.id,
        date: challenge.proposed_date,
        time: challenge.proposed_time,
        format: challenge.format,
        max_players: parseInt(challenge.format.split('v')[0]) * 2,
        current_players: 0,
        is_team_match: true,
        is_ranked: true,
        status: 'upcoming',
        team_a_id: challenge.challenger_team_id,
        team_b_id: challenge.challenged_team_id
      });

      await TeamChallenge.update(challengeId, {
        status: 'accepted',
        match_id: match.id,
        responded_at: new Date().toISOString()
      });

      loadChallenges();
      alert('Utmaning accepterad! Match skapad.');
    } catch (error) {
      console.error('Error accepting challenge:', error);
      alert('Kunde inte acceptera utmaning. Försök igen.');
    }
  };

  const handleDeclineChallenge = async (challengeId) => {
    try {
      await TeamChallenge.update(challengeId, {
        status: 'declined',
        responded_at: new Date().toISOString()
      });
      loadChallenges();
    } catch (error) {
      console.error('Error declining challenge:', error);
    }
  };

  const pendingChallenges = challenges.filter(c => c.status === 'pending');
  const completedChallenges = challenges.filter(c => c.status !== 'pending');

  return (
    <div className="space-y-6">
      {/* Send Challenge Button */}
      {isCaptainOrVice && !showSendChallengeForm && (
        <Button
          onClick={() => setShowSendChallengeForm(true)}
          className="w-full bg-[#F4743B]/16 hover:bg-[#F4743B]/24 text-[#FDE3D2] ring-1 ring-[#F4743B]/30 font-semibold"
        >
          <Swords className="w-5 h-5 mr-2" />
          Skicka utmaning
        </Button>
      )}

      {/* Send Challenge Form */}
      {showSendChallengeForm && (
        <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[16px]">
          <CardHeader className="border-b border-[#223029]">
            <CardTitle className="text-[18px] leading-[24px] text-[#F4F7F5]">Skicka utmaning</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSendChallenge} className="space-y-4">
              <div>
                <label className="text-[13px] leading-[18px] text-[#B6C2BC] mb-2 block">Välj lag *</label>
                <Select
                  value={newChallenge.challenged_team_id}
                  onValueChange={(value) => setNewChallenge({ ...newChallenge, challenged_team_id: value })}
                >
                  <SelectTrigger className="bg-[#18221E] border border-[#223029] text-[#F4F7F5]">
                    <SelectValue placeholder="Välj ett lag" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-[13px] leading-[18px] text-[#B6C2BC] mb-2 block">Format *</label>
                <Select
                  value={newChallenge.format}
                  onValueChange={(value) => setNewChallenge({ ...newChallenge, format: value })}
                >
                  <SelectTrigger className="bg-[#18221E] border border-[#223029] text-[#F4F7F5]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5v5">5v5</SelectItem>
                    <SelectItem value="7v7">7v7</SelectItem>
                    <SelectItem value="11v11">11v11</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[13px] leading-[18px] text-[#B6C2BC] mb-2 block">Datum (valfritt)</label>
                  <Input
                    type="date"
                    value={newChallenge.proposed_date}
                    onChange={(e) => setNewChallenge({ ...newChallenge, proposed_date: e.target.value })}
                    className="bg-[#18221E] border border-[#223029] text-[#F4F7F5]"
                  />
                </div>
                <div>
                  <label className="text-[13px] leading-[18px] text-[#B6C2BC] mb-2 block">Tid (valfritt)</label>
                  <Input
                    type="time"
                    value={newChallenge.proposed_time}
                    onChange={(e) => setNewChallenge({ ...newChallenge, proposed_time: e.target.value })}
                    className="bg-[#18221E] border border-[#223029] text-[#F4F7F5]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[13px] leading-[18px] text-[#B6C2BC] mb-2 block">Plats (valfritt)</label>
                <Select
                  value={newChallenge.venue_id}
                  onValueChange={(value) => setNewChallenge({ ...newChallenge, venue_id: value })}
                >
                  <SelectTrigger className="bg-[#18221E] border border-[#223029] text-[#F4F7F5]">
                    <SelectValue placeholder="Välj plats" />
                  </SelectTrigger>
                  <SelectContent>
                    {venues.map(v => (
                      <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-[13px] leading-[18px] text-[#B6C2BC] mb-2 block">Meddelande (valfritt)</label>
                <Textarea
                  value={newChallenge.message}
                  onChange={(e) => setNewChallenge({ ...newChallenge, message: e.target.value })}
                  placeholder="Lägg till ett meddelande till motståndarlaget..."
                  className="bg-[#18221E] border border-[#223029] text-[#F4F7F5] h-24"
                  maxLength={300}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowSendChallengeForm(false)}
                  className="flex-1"
                >
                  Avbryt
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#F4743B] hover:bg-[#E5683A] text-[#FFFFFF]"
                >
                  Skicka utmaning
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Pending Challenges */}
      {pendingChallenges.length > 0 && (
        <div>
          <h3 className="text-[16px] leading-[24px] font-semibold text-[#F4F7F5] mb-3">Väntande utmaningar</h3>
          <div className="space-y-3">
            {pendingChallenges.map((challenge) => {
              const isReceived = challenge.challenged_team_id === team.id;
              const otherTeam = isReceived ? challenge.challengerTeam : challenge.challengedTeam;

              return (
                <Card key={challenge.id} className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[16px]">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#F4743B] to-[#E5683A] rounded-xl flex items-center justify-center">
                          {otherTeam.logo_url ? (
                            <img src={otherTeam.logo_url} alt={otherTeam.name} className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <Shield className="w-6 h-6 text-[#FFFFFF]" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-[14px] leading-[20px] font-semibold text-[#F4F7F5]">
                            {isReceived ? 'Utmaning från' : 'Utmanade'} {otherTeam.name}
                          </h4>
                          <Badge className="mt-1 bg-[#F4743B]/20 text-[#FDE3D2]">
                            {challenge.format}
                          </Badge>
                        </div>
                      </div>
                      {isReceived && (
                        <Badge className="bg-[#F4743B]/20 text-[#FDE3D2]">Ny</Badge>
                      )}
                    </div>

                    {(challenge.proposed_date || challenge.proposed_time || challenge.venue_id) && (
                      <div className="space-y-2 mb-3 text-[13px] leading-[18px] text-[#B6C2BC]">
                        {challenge.proposed_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {challenge.proposed_date}
                          </div>
                        )}
                        {challenge.proposed_time && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {challenge.proposed_time}
                          </div>
                        )}
                        {challenge.venue_id && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {venues.find(v => v.id === challenge.venue_id)?.name || 'Plats vald'}
                          </div>
                        )}
                      </div>
                    )}

                    {challenge.message && (
                      <p className="text-[13px] leading-[18px] text-[#B6C2BC] mb-3 p-3 bg-[#18221E] rounded-lg">
                        "{challenge.message}"
                      </p>
                    )}

                    {isReceived && isCaptainOrVice && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleDeclineChallenge(challenge.id)}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Neka
                        </Button>
                        <Button
                          onClick={() => handleAcceptChallenge(challenge.id)}
                          size="sm"
                          className="flex-1 bg-[#2BA84A] hover:bg-[#248232] text-[#FFFFFF]"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Acceptera
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Challenges */}
      {completedChallenges.length > 0 && (
        <div>
          <h3 className="text-[16px] leading-[24px] font-semibold text-[#F4F7F5] mb-3">Tidigare utmaningar</h3>
          <div className="space-y-3">
            {completedChallenges.slice(0, 5).map((challenge) => {
              const isReceived = challenge.challenged_team_id === team.id;
              const otherTeam = isReceived ? challenge.challengerTeam : challenge.challengedTeam;

              return (
                <Card key={challenge.id} className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[16px] opacity-75">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#18221E] rounded-lg flex items-center justify-center">
                          <Shield className="w-5 h-5 text-[#7B8A83]" />
                        </div>
                        <div>
                          <h4 className="text-[13px] leading-[18px] font-medium text-[#F4F7F5]">
                            {otherTeam.name}
                          </h4>
                          <p className="text-[11px] leading-[16px] text-[#7B8A83]">
                            {challenge.format} • {new Date(challenge.created_date).toLocaleDateString('sv-SE')}
                          </p>
                        </div>
                      </div>
                      <Badge className={
                        challenge.status === 'accepted'
                          ? 'bg-[#2BA84A]/20 text-[#CFE8D6]'
                          : 'bg-[#7B8A83]/20 text-[#B6C2BC]'
                      }>
                        {challenge.status === 'accepted' ? 'Accepterad' : 
                         challenge.status === 'declined' ? 'Nekad' : 'Avbruten'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {challenges.length === 0 && (
        <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[16px]">
          <CardContent className="p-12 text-center">
            <Swords className="w-12 h-12 text-[#9FC9AC] mx-auto mb-4" />
            <p className="text-[#B6C2BC]">
              {isCaptainOrVice 
                ? 'Inga utmaningar än. Utmana ett annat lag!'
                : 'Inga utmaningar än'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
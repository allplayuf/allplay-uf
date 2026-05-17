import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin, Clock, Swords, Shield, Plus, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";

const STATUS_CONFIG = {
  upcoming:   { label: 'Kommande',  bg: 'bg-[#2BA84A]/20',  text: 'text-[#CFE8D6]' },
  ongoing:    { label: 'Pågående',  bg: 'bg-[#F59E0B]/20',  text: 'text-[#FDE3D2]' },
  finished:   { label: 'Avslutad', bg: 'bg-[#7B8A83]/20',  text: 'text-[#B6C2BC]' },
  cancelled:  { label: 'Inställd', bg: 'bg-[#DC2626]/20',  text: 'text-[#FCA5A5]' },
};

function MatchCard({ match, team, index }) {
  const navigate = useNavigate();
  const status = STATUS_CONFIG[match.status] || STATUS_CONFIG.upcoming;
  const isTeamA = match.team_a_id === team.id;
  const hasOpponent = !!match.team_b_id;
  const startsAt = match.starts_at ? new Date(match.starts_at) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.04, 0.28) }}
    >
      <Card
        onClick={() => navigate(`${createPageUrl('MatchDetail')}?id=${match.id}`)}
        className="bg-[#121715] border border-[#223029] rounded-2xl overflow-hidden cursor-pointer hover:border-[#2BA84A]/40 hover:bg-[#131918] transition-all active:scale-[0.99]"
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h4 className="text-[14px] font-bold text-[#F4F7F5] truncate mb-1">
                {match.title || `Lagmatch ${match.format}`}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                <Badge className={`text-[10px] px-2 py-0.5 border-0 ${status.bg} ${status.text}`}>
                  {status.label}
                </Badge>
                {match.format && (
                  <Badge className="text-[10px] bg-[#18221E] text-[#B6C2BC] border-[#223029] px-2 py-0.5">
                    {match.format}
                  </Badge>
                )}
                {match.is_team_match && (
                  <Badge className="text-[10px] bg-[#2BA84A]/16 text-[#CFE8D6] border-0 px-2 py-0.5 flex items-center gap-1">
                    <Shield className="w-2.5 h-2.5" /> Lagmatch
                  </Badge>
                )}
              </div>
            </div>

            {/* Open match join indicator */}
            {!hasOpponent && match.status === 'upcoming' && (
              <div className="flex-shrink-0 px-2.5 py-1 bg-[#F4743B]/16 border border-[#F4743B]/30 rounded-lg">
                <span className="text-[11px] text-[#FDE3D2] font-semibold">Söker lag</span>
              </div>
            )}
          </div>

          {/* Teams row */}
          {match.is_team_match && (
            <div className="flex items-center gap-2 mb-3">
              <div className={`flex-1 text-center text-[12px] font-semibold py-1.5 px-2 rounded-lg ${
                isTeamA ? 'bg-[#2BA84A]/16 text-[#CFE8D6]' : 'bg-[#18221E] text-[#9EAAA4]'
              }`}>
                {isTeamA ? team.name : (match.team_a_name || 'Lag A')}
              </div>
              <span className="text-[11px] text-[#7B8A83] font-bold">VS</span>
              <div className={`flex-1 text-center text-[12px] font-semibold py-1.5 px-2 rounded-lg ${
                !isTeamA ? 'bg-[#2BA84A]/16 text-[#CFE8D6]' : (hasOpponent ? 'bg-[#18221E] text-[#9EAAA4]' : 'bg-[#18221E]/50 text-[#7B8A83] italic')
              }`}>
                {!isTeamA ? team.name : (hasOpponent ? (match.team_b_name || 'Lag B') : 'Ingen motst.')}
              </div>
            </div>
          )}

          {/* Details */}
          <div className="flex flex-wrap gap-3 text-[12px] text-[#9EAAA4]">
            {startsAt && (
              <>
                <span className="flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {startsAt.toLocaleDateString('sv-SE', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {startsAt.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </>
            )}
            {(match.venue_name || match.venue_city) && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {match.venue_name || match.venue_city}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function TeamMatchesList({ matches, team, isCaptainOrVice, onCreateMatch }) {
  const upcoming = matches.filter(m => m.status === 'upcoming' || m.status === 'ongoing');
  const past = matches.filter(m => m.status === 'finished' || m.status === 'cancelled');

  if (matches.length === 0) {
    return (
      <div className="space-y-4">
        {isCaptainOrVice && (
          <Button onClick={onCreateMatch}
            className="w-full h-11 bg-[#2BA84A]/16 hover:bg-[#2BA84A]/24 text-[#CFE8D6] ring-1 ring-[#2BA84A]/30 font-semibold rounded-xl">
            <Plus className="w-4 h-4 mr-2" />
            Skapa lagmatch
          </Button>
        )}
        <Card className="bg-[#121715] border border-[#223029] rounded-2xl">
          <CardContent className="py-12 text-center">
            <CalendarDays className="w-10 h-10 text-[#9EAAA4] mx-auto mb-3" />
            <p className="text-[#B6C2BC] font-medium mb-1">Inga lagmatcher än</p>
            <p className="text-[13px] text-[#7B8A83]">
              {isCaptainOrVice
                ? 'Skapa en öppen lagmatch eller utmana ett lag.'
                : 'Inga planerade eller spelade matcher hittades.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {isCaptainOrVice && (
        <Button onClick={onCreateMatch}
          className="w-full h-11 bg-[#2BA84A]/16 hover:bg-[#2BA84A]/24 text-[#CFE8D6] ring-1 ring-[#2BA84A]/30 font-semibold rounded-xl">
          <Plus className="w-4 h-4 mr-2" />
          Skapa lagmatch
        </Button>
      )}

      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[12px] font-bold text-[#9EAAA4] uppercase tracking-wider px-1">
            Kommande ({upcoming.length})
          </h3>
          {upcoming.map((m, i) => (
            <MatchCard key={m.id} match={m} team={team} index={i} />
          ))}
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[12px] font-bold text-[#9EAAA4] uppercase tracking-wider px-1 flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5" /> Historik ({past.length})
          </h3>
          {past.map((m, i) => (
            <MatchCard key={m.id} match={m} team={team} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

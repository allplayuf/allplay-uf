import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, Trophy, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

export default function CupMatches({ cup, matches, canManage }) {
  const [filter, setFilter] = useState('all'); // all, upcoming, completed

  const filteredMatches = matches.filter(match => {
    if (filter === 'upcoming') return !match.team_a_score && match.team_a_score !== 0;
    if (filter === 'completed') return match.team_a_score !== null;
    return true;
  });

  const upcomingCount = matches.filter(m => m.team_a_score === null).length;
  const completedCount = matches.filter(m => m.team_a_score !== null).length;

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#F4F7F5] flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#F4743B]" />
          Matcher ({filteredMatches.length})
        </h2>

        <div className="flex items-center gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'bg-[#F4743B] hover:bg-[#E5683A]' : 'border-[#223029] text-[#B6C2BC]'}
          >
            Alla
          </Button>
          <Button
            variant={filter === 'upcoming' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('upcoming')}
            className={filter === 'upcoming' ? 'bg-[#F4743B] hover:bg-[#E5683A]' : 'border-[#223029] text-[#B6C2BC]'}
          >
            Kommande ({upcomingCount})
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('completed')}
            className={filter === 'completed' ? 'bg-[#F4743B] hover:bg-[#E5683A]' : 'border-[#223029] text-[#B6C2BC]'}
          >
            Spelade ({completedCount})
          </Button>
        </div>
      </div>

      {/* Matches List */}
      {filteredMatches.length === 0 ? (
        <Card className="bg-[#121715] border border-[#223029] rounded-[20px] p-12 text-center">
          <Trophy className="w-16 h-16 text-[#7B8A83] mx-auto mb-4" />
          <h3 className="text-xl font-bold text-[#F4F7F5] mb-2">Inga matcher än</h3>
          <p className="text-[#B6C2BC]">Matcher kommer att skapas när schemat genereras.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredMatches.map((match, index) => (
            <MatchCard 
              key={match.id} 
              match={match} 
              index={index}
              canManage={canManage}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MatchCard({ match, index, canManage }) {
  const hasResult = match.team_a_score !== null;
  const isLive = match.is_live;

  const stageLabels = {
    group: 'Grupp',
    quarterfinal: 'Kvartsfinal',
    semifinal: 'Semifinal',
    final: 'Final',
    bronze: 'Bronsmatch'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link to={`${createPageUrl("MatchDetail")}?id=${match.match_id}`}>
        <Card className="bg-[#121715] border border-[#223029] hover:border-[#F4743B]/30 rounded-[16px] transition-all group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-[#F4743B]/20 text-[#F4743B] border-[#F4743B]/30 text-xs">
                  {stageLabels[match.stage] || match.stage}
                </Badge>
                {isLive && (
                  <Badge className="bg-[#FF6B35]/20 text-[#FF6B35] border-[#FF6B35]/30 text-xs animate-pulse">
                    🔴 LIVE
                  </Badge>
                )}
              </div>

              {hasResult && (
                <div className="flex items-center gap-2">
                  {match.extra_time && (
                    <span className="text-xs text-[#FFA500]">EF</span>
                  )}
                  {match.penalties && (
                    <span className="text-xs text-[#FF6B35]">STR</span>
                  )}
                </div>
              )}
            </div>

            {/* Teams */}
            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between p-3 bg-[#18221E] rounded-lg">
                <span className="text-sm font-semibold text-[#F4F7F5]">
                  {match.team_a_name || 'Lag A'}
                </span>
                {hasResult && (
                  <span className="text-lg font-bold text-[#F4F7F5]">{match.team_a_score}</span>
                )}
              </div>

              <div className="text-center text-xs text-[#7B8A83]">vs</div>

              <div className="flex items-center justify-between p-3 bg-[#18221E] rounded-lg">
                <span className="text-sm font-semibold text-[#F4F7F5]">
                  {match.team_b_name || 'Lag B'}
                </span>
                {hasResult && (
                  <span className="text-lg font-bold text-[#F4F7F5]">{match.team_b_score}</span>
                )}
              </div>
            </div>

            {/* Match Info */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#B6C2BC]">
              {match.date && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(match.date).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })}
                </div>
              )}
              {match.time && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {match.time}
                </div>
              )}
              {match.venue_name && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {match.venue_name}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
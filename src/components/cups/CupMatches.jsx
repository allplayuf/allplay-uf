import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function CupMatches({ cup, matches, canManage }) {
  if (matches.length === 0) {
    return (
      <Card className="bg-[#121715] border border-[#223029] rounded-[20px] p-6">
        <p className="text-center text-[#B6C2BC]">Inga matcher schemalagda än</p>
      </Card>
    );
  }

  const upcomingMatches = matches.filter(m => !m.team_a_score && !m.team_b_score);
  const completedMatches = matches.filter(m => m.team_a_score !== null && m.team_b_score !== null);

  const renderMatch = (match, index) => {
    const hasResult = match.team_a_score !== null && match.team_b_score !== null;
    const stageLabels = {
      group: 'Gruppspel',
      quarterfinal: 'Kvartsfinal',
      semifinal: 'Semifinal',
      final: 'Final',
      bronze: 'Bronsmatch'
    };

    return (
      <motion.div
        key={match.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
      >
        <Link to={`${createPageUrl("MatchDetail")}?match_id=${match.match_id}`}>
          <Card className="bg-[#18221E] border border-[#223029] rounded-xl hover:border-[#F4743B]/30 hover:shadow-lg transition-all">
            <CardContent className="p-4">
              {/* Stage badge */}
              <div className="flex items-center justify-between mb-3">
                <Badge className="bg-[#2BA84A]/20 text-[#9FC9AC] text-xs">
                  {stageLabels[match.stage] || match.stage}
                </Badge>
                {match.is_live && (
                  <Badge className="bg-[#F4743B] text-white text-xs animate-pulse">
                    🔴 LIVE
                  </Badge>
                )}
              </div>

              {/* Teams and score */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#F4F7F5]">
                    {match.team_a_name || 'Lag A'}
                  </span>
                  {hasResult && (
                    <Badge className={`font-mono font-bold ${
                      match.winner_id === match.team_a_id ? 'bg-[#2BA84A] text-white' : 'bg-[#121715] text-[#B6C2BC]'
                    }`}>
                      {match.team_a_score}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#F4F7F5]">
                    {match.team_b_name || 'Lag B'}
                  </span>
                  {hasResult && (
                    <Badge className={`font-mono font-bold ${
                      match.winner_id === match.team_b_id ? 'bg-[#2BA84A] text-white' : 'bg-[#121715] text-[#B6C2BC]'
                    }`}>
                      {match.team_b_score}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Match details */}
              <div className="flex flex-wrap gap-3 text-xs text-[#B6C2BC]">
                {match.date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(match.date).toLocaleDateString('sv-SE')}
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

              {/* Extra info */}
              {(match.extra_time || match.penalties || match.walkover) && (
                <div className="mt-3 p-2 bg-[#0F1513] rounded-lg text-xs text-[#B6C2BC]">
                  {match.walkover && <span>⚠️ Walkover</span>}
                  {match.extra_time && <span className="ml-2">📈 Förlängning</span>}
                  {match.penalties && <span className="ml-2">🎯 Straffar {match.penalty_score}</span>}
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Upcoming matches */}
      {upcomingMatches.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-[#F4F7F5] mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#2BA84A]" />
            Kommande matcher ({upcomingMatches.length})
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingMatches.map((match, idx) => renderMatch(match, idx))}
          </div>
        </div>
      )}

      {/* Completed matches */}
      {completedMatches.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-[#F4F7F5] mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#F4743B]" />
            Avslutade matcher ({completedMatches.length})
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedMatches.map((match, idx) => renderMatch(match, idx))}
          </div>
        </div>
      )}
    </div>
  );
}
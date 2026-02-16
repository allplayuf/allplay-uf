import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Trophy, Users, Clock, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function MatchHistory({ matches }) {
  const formatMatchDate = (match) => {
    try {
      const matchDate = new Date(`${match.date}T${match.time}`);
      return format(matchDate, "d MMM yyyy, HH:mm", { locale: sv });
    } catch {
      return `${match.date} ${match.time}`;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-[#2BA84A]/18 text-[#CFE8D6]';
      case 'ongoing': return 'bg-[#F4743B]/18 text-[#FDE3D2] animate-pulse';
      case 'upcoming': return 'bg-[#4D8DFF]/20 text-[#CFE8D6]';
      case 'cancelled': return 'bg-[#18221E] text-[#7B8A83]';
      default: return 'bg-[#18221E] text-[#7B8A83]';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Avslutad';
      case 'ongoing': return 'Pågår';
      case 'upcoming': return 'Kommande';
      case 'cancelled': return 'Inställd';
      default: return status;
    }
  };

  if (matches.length === 0) {
    return (
      <Card className="bg-[#121715] border border-[#223029] rounded-2xl">
        <CardContent className="p-10 text-center">
          <div className="w-14 h-14 bg-[#2BA84A]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-1 ring-[#2BA84A]/20">
            <Calendar className="w-7 h-7 text-[#2BA84A]" />
          </div>
          <h3 className="text-lg font-bold text-[#F4F7F5] mb-1.5">Ingen matchhistorik</h3>
          <p className="text-sm text-[#9EAAA4]">Spela dina första matcher för att se historik här!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#121715] border border-[#223029] rounded-2xl overflow-hidden">
      <CardHeader className="border-b border-[#223029] px-5 py-4">
        <CardTitle className="text-sm text-[#F4F7F5] flex items-center gap-2 font-bold">
          <div className="w-7 h-7 rounded-lg bg-[#2BA84A]/12 flex items-center justify-center">
            <Calendar className="w-3.5 h-3.5 text-[#2BA84A]" />
          </div>
          Matchhistorik
          <span className="text-[#9EAAA4] font-normal ml-auto text-xs">{matches.length} matcher</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="space-y-1.5">
          {matches.map((match) => (
            <Link 
              key={match.id} 
              to={`${createPageUrl("MatchDetail")}?id=${match.id}`}
              className="block"
            >
              <div className="p-3.5 bg-[#18221E] rounded-xl hover:bg-[#1E2B25] transition-all cursor-pointer group">
                <div className="flex items-center justify-between gap-3 mb-2.5">
                  <h4 className="font-bold text-[#F4F7F5] text-sm truncate group-hover:text-[#2BA84A] transition-colors">{match.title}</h4>
                  <span className={`inline-flex h-6 items-center rounded-lg px-2.5 text-[11px] font-bold flex-shrink-0 ${getStatusColor(match.status)}`}>
                    {getStatusText(match.status)}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#9EAAA4] mb-2">
                  <Clock className="w-3 h-3" />
                  {formatMatchDate(match)}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex h-6 items-center rounded-lg bg-[#2BA84A]/12 px-2.5 text-[11px] font-bold text-[#CFE8D6]">
                    {match.format}
                  </span>
                  {match.is_ranked && (
                    <span className="inline-flex h-6 items-center rounded-lg bg-[#F4743B]/12 px-2.5 text-[11px] font-bold text-[#FDE3D2]">
                      <Trophy className="w-3 h-3 mr-1" />
                      Rankad
                    </span>
                  )}
                  {match.final_score && (
                    <span className="inline-flex h-6 items-center rounded-lg bg-[#2BA84A]/12 px-2.5 text-[11px] font-bold text-[#CFE8D6]">
                      {match.final_score}
                    </span>
                  )}
                  <div className="flex items-center gap-1 text-[#9EAAA4] text-xs ml-auto">
                    <Users className="w-3 h-3" />
                    {match.current_players}/{match.max_players || '∞'}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
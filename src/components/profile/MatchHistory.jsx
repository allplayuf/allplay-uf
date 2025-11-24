import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Trophy, Users, Clock, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/components/utils/helpers";

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
      <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[20px]">
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 bg-[#2BA84A]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-[#7B8A83]" />
          </div>
          <h3 className="text-[20px] leading-[28px] font-semibold text-[#F4F7F5] mb-2">Ingen matchhistorik</h3>
          <p className="text-[14px] leading-[20px] text-[#B6C2BC]">Spela dina första matcher för att se historik här!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[20px]">
      <CardHeader className="border-b border-[#223029] p-5">
        <CardTitle className="text-[16px] leading-[24px] text-[#F4F7F5] flex items-center gap-2 font-semibold">
          <Calendar className="w-5 h-5 text-[#9FC9AC]" />
          Matchhistorik ({matches.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          {matches.map((match) => (
            <Link 
              key={match.id} 
              to={`${createPageUrl("MatchDetail")}?id=${match.id}`}
              className="block"
            >
              <div className="p-4 bg-[#18221E] border border-[#223029] rounded-xl hover:border-[#2BA84A] transition-all hover:scale-[1.01] cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-[#F4F7F5] mb-2 text-[14px] leading-[20px]">{match.title}</h4>
                    <div className="flex items-center gap-2 text-[13px] leading-[18px] text-[#B6C2BC] mb-2">
                      <Clock className="w-4 h-4 text-[#9FC9AC]" />
                      {formatMatchDate(match)}
                    </div>
                  </div>
                  <span className={`inline-flex h-7 items-center rounded-full px-3 text-[13px] leading-[18px] font-medium ring-1 ring-[#223029] flex-shrink-0 ${getStatusColor(match.status)}`}>
                    {getStatusText(match.status)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex h-7 items-center rounded-full bg-[#2BA84A]/18 px-3 text-[13px] leading-[18px] font-medium text-[#CFE8D6] ring-1 ring-[#2BA84A]/25">
                    {match.format}
                  </span>
                  {match.is_ranked && (
                    <span className="inline-flex h-7 items-center rounded-full bg-[#F4743B]/18 px-3 text-[13px] leading-[18px] font-medium text-[#FDE3D2] ring-1 ring-[#F4743B]/25">
                      <Trophy className="w-3 h-3 mr-1" />
                      Rankad
                    </span>
                  )}
                  {match.final_score && (
                    <span className="inline-flex h-7 items-center rounded-full bg-[#2BA84A]/18 px-3 text-[13px] leading-[18px] font-medium text-[#CFE8D6] ring-1 ring-[#2BA84A]/25">
                      {match.final_score}
                    </span>
                  )}
                  <div className="flex items-center gap-1 text-[#B6C2BC] text-[13px] leading-[18px] ml-auto">
                    <Users className="w-4 h-4 text-[#9FC9AC]" />
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
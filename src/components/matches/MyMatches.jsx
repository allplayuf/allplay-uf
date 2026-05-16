
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Clock, XCircle, ChevronRight, Zap, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { leaveMatch } from "@/components/supabase/services/matchesService";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { feedback } from "@/components/ui/feedback-toast";

export default function MyMatches({ matches, venues, user, onRefresh, onDeleteMatch, participants }) {

  const handleLeaveMatch = async (matchId) => {
    if (!confirm('Är du säker på att du vill lämna denna match?')) {
      return;
    }

    try {
      await leaveMatch(matchId);
      feedback.success('Du har lämnat matchen');
      onRefresh();
    } catch (error) {
      console.error("Error leaving match:", error);
      feedback.error(error?.message || 'Kunde inte lämna matchen. Försök igen.');
    }
  };

  const formatMatchDateTime = (match) => {
    try {
      const matchDate = new Date(`${match.date}T${match.time}`);
      return format(matchDate, "EEEE d MMM, HH:mm", { locale: sv });
    } catch {
      return `${match.date} ${match.time}`;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming': return 'bg-[#4169E1]/20 text-[#A8C5F5]';
      case 'ongoing': return 'bg-[#2BA84A]/20 text-[#CFE8D6] animate-pulse';
      case 'completed': return 'bg-[#18221E] text-[#7B8A83]';
      case 'cancelled': return 'bg-red-900/20 text-red-300';
      default: return 'bg-[#18221E] text-[#7B8A83]';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'upcoming': return 'Kommande';
      case 'ongoing': return 'Pågår nu';
      case 'completed': return 'Avslutad';
      case 'cancelled': return 'Avbruten';
      default: return status;
    }
  };

  if (matches.length === 0) {
    return (
      <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[16px] lg:rounded-[20px]">
        <CardContent className="p-8 sm:p-12 text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#2BA84A]/10 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 ring-1 ring-[#2BA84A]/30">
            <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-[#9FC9AC]" />
          </div>
          <h3 className="text-[18px] sm:text-[20px] leading-[24px] sm:leading-[28px] font-semibold text-[#F4F7F5] mb-2">Inga anmälda matcher</h3>
          <p className="text-[13px] sm:text-[14px] leading-[18px] sm:leading-[20px] text-[#B6C2BC] mb-4 sm:mb-6">Du har inte anmält dig till några matcher ännu.</p>
          <Link to={createPageUrl("Matches")}>
            <button className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border border-[#2BA84A]/35 px-5 text-[#CFE8D6] transition-all hover:bg-[#2BA84A]/10 active:bg-[#2BA84A]/16 font-semibold text-sm sm:text-base">
              Hitta matcher
            </button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-[18px] sm:text-[20px] leading-[24px] sm:leading-[28px] font-semibold text-[#F4F7F5]">
        Anmälda matcher ({matches.length})
      </h2>

      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        {matches.map((match) => {
          const venue = venues.find(v => v.id === match.venue_id);
          const matchParticipants = participants[match.id] || [];
          const isOrganizer = match.organizer_id === user?.id;

          return (
            <Card key={match.id} className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.28)] transition-all rounded-[16px] group">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 w-full sm:w-auto">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <h3 className="text-[15px] sm:text-[16px] leading-[20px] sm:leading-[24px] font-semibold text-[#F4F7F5] group-hover:text-[#9FC9AC] transition-colors">{match.title}</h3>
                      {isOrganizer && (
                        <span className="inline-flex h-6 sm:h-7 items-center rounded-full bg-[#F4743B]/18 px-2 sm:px-3 text-[11px] sm:text-[13px] font-medium text-[#FDE3D2] ring-1 ring-[#F4743B]/25">
                          Organisatör
                        </span>
                      )}
                      <span className={`inline-flex h-6 sm:h-7 items-center rounded-full px-2 sm:px-3 text-[11px] sm:text-[13px] font-medium ring-1 ring-[#223029] ${getStatusColor(match.status)}`}>
                        {getStatusText(match.status)}
                      </span>
                      {match.is_spontaneous && (
                        <span className="inline-flex h-6 sm:h-7 items-center rounded-full bg-[#F4743B]/18 px-2 sm:px-3 text-[11px] sm:text-[13px] font-medium text-[#FDE3D2] ring-1 ring-[#F4743B]/25">
                          <Zap className="w-3 h-3 mr-1" />
                          Spontan
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 text-[13px] sm:text-[14px] leading-[18px] sm:leading-[20px] text-[#B6C2BC]">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#9FC9AC] flex-shrink-0" />
                        <span className="truncate">{venue?.name || 'Okänd plan'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#9FC9AC] flex-shrink-0" />
                        <span className="truncate">{formatMatchDateTime(match)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#9FC9AC] flex-shrink-0" />
                        <span>
                          {match.is_spontaneous
                            ? `${matchParticipants.length} anmälda spelare`
                            : `${matchParticipants.length}/${match.max_players} spelare`
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto flex-shrink-0">
                    <Link to={`${createPageUrl("MatchDetail")}?id=${match.id}`} className="flex-1 sm:flex-initial">
                      <button className="w-full inline-flex h-10 sm:h-11 items-center justify-center gap-2 rounded-[14px] border border-[#2BA84A]/35 px-4 sm:px-5 text-[13px] sm:text-[14px] text-[#CFE8D6] transition-all hover:bg-[#2BA84A]/10 active:bg-[#2BA84A]/16 font-semibold whitespace-nowrap">
                        Detaljer
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </Link>

                    {match.status !== 'completed' && match.status !== 'cancelled' && (
                      <>
                        {isOrganizer ? (
                          <button
                            onClick={() => onDeleteMatch(match.id)}
                            className="flex-1 sm:flex-initial inline-flex h-10 sm:h-11 items-center justify-center gap-2 rounded-[14px] border border-[#F4743B]/35 px-4 sm:px-5 text-[13px] sm:text-[14px] text-[#FDE3D2] transition-all hover:bg-[#F4743B]/10 active:bg-[#F4743B]/16 font-semibold whitespace-nowrap"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Ta bort</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleLeaveMatch(match.id)}
                            className="flex-1 sm:flex-initial inline-flex h-10 sm:h-11 items-center justify-center gap-2 rounded-[14px] border border-[#223029] px-4 sm:px-5 text-[13px] sm:text-[14px] text-[#B6C2BC] transition-all hover:bg-[#18221E] active:bg-[#121715] font-semibold whitespace-nowrap"
                          >
                            <XCircle className="w-4 h-4" />
                            <span className="hidden sm:inline">Lämna</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

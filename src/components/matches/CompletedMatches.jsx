import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, MapPin, Calendar, Users, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/components/utils/helpers";
import { motion } from "framer-motion";

export default function CompletedMatches({ matches, venues, user }) {
  if (matches.length === 0) {
    return (
      <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[16px] lg:rounded-[20px]">
        <CardContent className="p-8 sm:p-12 text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#2BA84A]/10 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 ring-1 ring-[#2BA84A]/30">
            <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-[#9FC9AC]" />
          </div>
          <h3 className="text-[18px] sm:text-[20px] leading-[24px] sm:leading-[28px] font-semibold text-[#F4F7F5] mb-2">Inga spelade matcher</h3>
          <p className="text-[13px] sm:text-[14px] leading-[18px] sm:leading-[20px] text-[#B6C2BC] mb-4 sm:mb-6">
            Du har inte spelat några matcher ännu. Dags att sätta igång!
          </p>
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
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {matches.map((match, index) => {
        const venue = venues?.find(v => v.id === match.venue_id);
        const isMVP = match.mvp_user_id === user?.id;
        
        return (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
          >
            <Link to={`${createPageUrl("MatchDetail")}?id=${match.id}`}>
              <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.28)] hover:border-[#2BA84A]/30 transition-all rounded-[16px] h-full">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 pr-2">
                        <h3 className="text-[16px] leading-[24px] font-semibold text-[#F4F7F5] mb-1">
                          {match.title}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className="h-6 px-2.5 bg-[#2BA84A]/18 text-[#CFE8D6] ring-1 ring-[#2BA84A]/25 text-xs">
                            {match.format}
                          </Badge>
                          <Badge className="h-6 px-2.5 bg-[#18221E] text-[#7B8A83] text-xs flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Spelade
                          </Badge>
                        </div>
                      </div>
                      {isMVP && (
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#F4743B] to-[#E5683A] rounded-xl flex items-center justify-center shadow-md">
                            <Trophy className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Match Info */}
                    <div className="space-y-2 text-sm text-[#B6C2BC]">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#9FC9AC] flex-shrink-0" />
                        <span className="truncate">{venue?.name || 'Okänd plats'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#9FC9AC] flex-shrink-0" />
                        <span>{match.date} {match.time}</span>
                      </div>
                    </div>

                    {/* Result */}
                    {match.final_score && (
                      <div className="pt-3 border-t border-[#223029]">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#B6C2BC] font-medium">Resultat</span>
                          <span className="text-lg font-bold text-[#F4F7F5]">{match.final_score}</span>
                        </div>
                      </div>
                    )}

                    {isMVP && (
                      <div className="pt-2">
                        <Badge className="w-full justify-center py-2 bg-gradient-to-r from-[#F4743B] to-[#E5683A] text-white text-xs font-semibold">
                          <Trophy className="w-3 h-3 mr-1" />
                          Du blev MVP!
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
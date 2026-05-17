import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Calendar, ChevronRight, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useT } from "@/i18n/LanguageProvider";

export default function NearbyMatches({ matches, venues, user }) {
  const { t } = useT();

  if (!matches || matches.length === 0) {
    return (
      <Card className="bg-[#2D3A3A] border-2 border-[#248232] shadow-xl">
        <CardHeader className="border-b border-[#248232]/50 bg-[#248232]/10 p-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-[#FFFFFF]">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[#2BA84A]" />
            {t('nearby.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <MapPin className="w-12 h-12 text-[#248232] mx-auto mb-3 opacity-50" />
          <p className="text-sm text-[#FFFFFF]/60 mb-4">{t('nearby.empty')}</p>
          <Link to={createPageUrl("Map")}>
            <Button size="sm" className="bg-[#2BA84A] hover:bg-[#248232] text-[#FFFFFF] font-bold">
              {t('nearby.explore')}
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#2D3A3A] border-2 border-[#248232] shadow-xl">
      <CardHeader className="border-b border-[#248232]/50 bg-[#248232]/10 p-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-[#FFFFFF]">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[#2BA84A]" />
            {t('nearby.title')}
          </CardTitle>
          <Link to={createPageUrl("Matches")}>
            <Button variant="ghost" size="sm" className="text-[#2BA84A] hover:text-[#FFFFFF] hover:bg-[#2BA84A]">
              {t('common.see_all')}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4">
        <div className="space-y-2 sm:space-y-3">
          {matches.slice(0, 3).map((match) => {
            const venue = venues?.find(v => v.id === match.venue_id);
            return (
              <Link
                key={match.id}
                to={`${createPageUrl("MatchDetail")}?id=${match.id}`}
                className="block"
              >
                <div className="p-3 sm:p-4 bg-[#040F0F] rounded-lg sm:rounded-xl hover:bg-[#248232]/20 transition-all border border-[#248232]/30 hover:border-[#2BA84A] cursor-pointer">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-bold text-xs sm:text-sm text-[#FFFFFF] flex-1 mr-2">{match.title}</h4>
                    <div className="flex gap-1 flex-shrink-0">
                      <Badge className="bg-[#2BA84A] text-[#FFFFFF] text-[10px] sm:text-xs">
                        {match.format}
                      </Badge>
                      {match.is_spontaneous && (
                        <Badge className="bg-[#F4743B] text-[#FFFFFF] text-[10px] sm:text-xs">
                          <Zap className="w-2 h-2 mr-1" />
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] sm:text-xs text-[#FFFFFF]/70">
                      <MapPin className="w-3 h-3 text-[#2BA84A] flex-shrink-0" />
                      <span className="truncate">{venue?.name || t('common.unknown')}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] sm:text-xs text-[#FFFFFF]/70">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-[#2BA84A]" />
                        {match.date}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-[#2BA84A]" />
                        {match.is_spontaneous
                          ? `${match.current_players || 0}`
                          : `${match.current_players || 0}/${match.max_players}`
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

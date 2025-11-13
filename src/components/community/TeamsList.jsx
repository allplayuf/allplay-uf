import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Trophy, Plus, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import RankBadge from "../teams/RankBadge";

export default function TeamsList({ teams, user, onRefresh }) {
  if (teams.length === 0) {
    return (
      <Card className="relative overflow-hidden bg-gradient-to-br from-[#2BA84A] to-[#0F2917] rounded-[16px] lg:rounded-[20px] p-8 sm:p-12 lg:p-16 shadow-[0_6px_18px_rgba(0,0,0,0.22)] border border-[#223029]">
        <div className="absolute top-[-30px] right-[-30px] w-28 h-28 bg-[#2BA84A]/40 rounded-full"></div>
        <div className="absolute bottom-[-40px] left-[-40px] w-32 h-32 bg-[#0F2917]/60 rounded-full"></div>
        
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-[#FFFFFF]/15 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 border border-[#FFFFFF]/25">
            <Shield className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-[#EAF6EE]" />
          </div>
          <h3 className="text-[20px] leading-[28px] sm:text-[28px] sm:leading-[34px] font-semibold text-[#EAF6EE] mb-3">Inga lag än</h3>
          <p className="text-[14px] leading-[20px] text-[#CFE8D6] mb-8 max-w-md mx-auto">
            Skapa eller gå med i ett lag för att tävla tillsammans och bygga något större!
          </p>
          <button className="inline-flex h-12 items-center justify-center gap-2 rounded-[16px] bg-[#FFFFFF]/16 px-6 text-[#EAF6EE] ring-1 ring-[#FFFFFF]/30 transition-all hover:bg-[#FFFFFF]/24 hover:ring-[#FFFFFF]/45 hover:scale-[1.02] font-semibold">
            <Plus className="w-5 h-5" />
            Skapa ditt första lag
          </button>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-4 lg:gap-6">
      {teams.map((team) => (
        <Card key={team.id} className="bg-[#121715] border border-[#223029] hover:border-[#2BA84A] transition-all shadow-[0_6px_18px_rgba(0,0,0,0.22)] hover:scale-[1.02] rounded-[16px]">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-[#2BA84A] to-[#248232] rounded-2xl flex items-center justify-center overflow-hidden">
                  {team.logo_url ? (
                    <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                  ) : (
                    <Shield className="w-7 h-7 text-[#EAF6EE]" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-[16px] leading-[24px] text-[#F4F7F5]">{team.name}</h3>
                  <p className="text-[13px] leading-[18px] text-[#B6C2BC]">{team.city}</p>
                </div>
              </div>
            </div>

            {/* Rank Badge with Progress */}
            <div className="mb-4">
              <RankBadge 
                elo={team.elo_rating} 
                showProgress={true} 
                showTrend={true} 
                rankHistory={team.rank_history}
                size="lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="text-center p-3 bg-[#18221E] rounded-xl border border-[#223029]">
                <div className="text-xl font-semibold text-[#2BA84A]">{team.current_members || 1}</div>
                <div className="text-[13px] leading-[18px] text-[#B6C2BC]">Medlemmar</div>
              </div>
              <div className="text-center p-3 bg-[#18221E] rounded-xl border border-[#223029]">
                <div className="text-xl font-semibold text-[#2BA84A]">{team.matches_played || 0}</div>
                <div className="text-[13px] leading-[18px] text-[#B6C2BC]">Matcher</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[13px] leading-[18px] mb-6 p-4 bg-[#18221E] rounded-xl border border-[#223029]">
              <div className="space-y-1">
                <div className="text-[#B6C2BC]">Matcher: <span className="font-semibold text-[#F4F7F5]">{team.matches_played || 0}</span></div>
                <div className="text-[#2BA84A]">Vinster: <span className="font-semibold">{team.wins || 0}</span></div>
              </div>
              <div className="space-y-1 text-right">
                <div className="text-[#B6C2BC]">Oavgjort: <span className="font-semibold text-[#F4F7F5]">{team.draws || 0}</span></div>
                <div className="text-[#F4743B]">Förluster: <span className="font-semibold">{team.losses || 0}</span></div>
              </div>
            </div>

            <Link to={`${createPageUrl("TeamOverview")}?id=${team.id}`} className="block">
              <button className="w-full inline-flex h-12 items-center justify-center gap-2 rounded-[16px] bg-[#2BA84A]/16 px-6 text-[#EAF6EE] ring-1 ring-[#2BA84A]/30 transition-all hover:bg-[#2BA84A]/24 hover:ring-[#2BA84A]/45 hover:scale-[1.02] font-semibold">
                <Shield className="w-5 h-5" />
                Visa lag
                <ChevronRight className="w-5 h-5 ml-auto" />
              </button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar, MapPin, ArrowRight, Flame } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function UpcomingCupsWidget() {
  // Fetch cups
  const { data: cupsData } = useQuery({
    queryKey: ['cups', 'widget'],
    queryFn: async () => {
      const response = await base44.functions.invoke('cups/getCups', '?status=ongoing');
      return response.data;
    },
    staleTime: 60 * 1000,
  });

  const cups = cupsData?.cups || [];
  const liveCups = cups.filter(c => c.status === 'ongoing').slice(0, 2);

  if (liveCups.length === 0) return null;

  return (
    <Card className="bg-[#121715] rounded-[16px] sm:rounded-[20px] shadow-[0_6px_18px_rgba(0,0,0,0.22)] border border-[#223029]">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-5 sm:mb-6">
          <Flame className="w-5 h-5 text-[#FF6B35]" />
          <h3 className="text-[16px] leading-[24px] font-semibold text-[#F4F7F5]">Pågående Turneringar</h3>
        </div>
        
        <div className="space-y-3">
          {liveCups.map((cup) => (
            <Link 
              key={cup.id} 
              to={`${createPageUrl("CupDetail")}?cup_id=${cup.id}`}
              className="block"
            >
              <div className="p-4 bg-[#18221E] rounded-xl border border-[#F4743B]/30 hover:border-[#F4743B]/50 hover:bg-[#1C2620] transition-all group">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#F4743B]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-5 h-5 text-[#F4743B]" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-[#F4F7F5] mb-1 line-clamp-1 group-hover:text-[#F4743B] transition-colors">
                      {cup.name}
                    </h4>
                    
                    <div className="flex items-center gap-2 text-xs text-[#B6C2BC] mb-2">
                      <MapPin className="w-3 h-3" />
                      {cup.location}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className="bg-[#FF6B35]/20 text-[#FF6B35] text-xs border-[#FF6B35]/30">
                        <Flame className="w-3 h-3 mr-1" />
                        Live
                      </Badge>
                      <Badge className="bg-[#F4743B]/20 text-[#F4743B] text-xs border-[#F4743B]/30">
                        {cup.format}
                      </Badge>
                    </div>
                  </div>
                  
                  <ArrowRight className="w-4 h-4 text-[#B6C2BC] group-hover:text-[#F4743B] transition-colors flex-shrink-0" />
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        <Link to={createPageUrl("Community")} className="block mt-4">
          <button className="w-full h-10 flex items-center justify-center gap-2 rounded-xl bg-[#18221E] text-[#F4743B] text-sm font-semibold hover:bg-[#1C2620] transition-all border border-[#F4743B]/30">
            Se alla turneringar
            <ArrowRight className="w-4 h-4" />
          </button>
        </Link>
      </CardContent>
    </Card>
  );
}
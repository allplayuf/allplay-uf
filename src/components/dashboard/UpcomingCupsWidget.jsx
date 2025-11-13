import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Calendar, MapPin, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function UpcomingCupsWidget() {
  const { data: cupsData } = useQuery({
    queryKey: ['upcomingCups'],
    queryFn: async () => {
      const response = await base44.functions.invoke('cups/getCups', '?status=upcoming&limit=3');
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
  });

  const cups = cupsData?.cups || [];

  if (cups.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="bg-[#121715] border border-[#223029] rounded-[20px]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#F4743B]" />
              <h3 className="font-bold text-[#F4F7F5]">Kommande turneringar</h3>
            </div>
            <Link to={createPageUrl("Cups")}>
              <Button variant="ghost" size="sm" className="text-[#2BA84A] hover:text-[#248232] gap-1">
                Se alla
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {cups.map((cup, index) => (
              <motion.div
                key={cup.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Link to={`${createPageUrl("CupDetail")}?cup_id=${cup.id}`}>
                  <div className="p-4 bg-[#18221E] hover:bg-[#1D2A23] rounded-xl transition-all cursor-pointer group">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-[#F4F7F5] group-hover:text-[#F4743B] transition-colors line-clamp-1">
                        {cup.name}
                      </h4>
                      <Badge className="bg-[#2BA84A]/20 text-[#9FC9AC] text-xs flex-shrink-0 ml-2">
                        {cup.format}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-[#B6C2BC]">
                        <Calendar className="w-3 h-3" />
                        {new Date(cup.start_date).toLocaleDateString('sv-SE', { 
                          month: 'short', 
                          day: 'numeric'
                        })}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#B6C2BC]">
                        <MapPin className="w-3 h-3" />
                        {cup.location}
                      </div>
                    </div>

                    {cup.status === 'registration_open' && (
                      <Badge className="mt-2 bg-[#2BA84A] text-white text-xs">
                        Anmälan öppen!
                      </Badge>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
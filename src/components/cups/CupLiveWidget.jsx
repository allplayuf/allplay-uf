import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Activity, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function CupLiveWidget() {
  // Fetch live/upcoming cups
  const { data: cupsData } = useQuery({
    queryKey: ['liveCups'],
    queryFn: async () => {
      const response = await base44.functions.invoke('cups/getCups', '?status=live&limit=5');
      return response.data;
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000, // Refresh every minute
  });

  const liveCups = cupsData?.cups || [];

  if (liveCups.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="bg-gradient-to-br from-[#F4743B]/10 to-[#E5683A]/5 border border-[#F4743B]/30 rounded-[20px] overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-[#F4743B] animate-pulse" />
            <h3 className="font-bold text-[#F4F7F5]">Pågående turneringar</h3>
          </div>

          <div className="space-y-3">
            {liveCups.slice(0, 3).map(cup => (
              <Link 
                key={cup.id} 
                to={`${createPageUrl("CupDetail")}?cup_id=${cup.id}`}
                className="block"
              >
                <div className="flex items-center justify-between p-3 bg-[#121715]/50 hover:bg-[#18221E] rounded-xl transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Trophy className="w-5 h-5 text-[#F4743B] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#F4F7F5] text-sm truncate">{cup.name}</p>
                      <p className="text-xs text-[#B6C2BC]">{cup.location}</p>
                    </div>
                  </div>
                  <Badge className="bg-[#F4743B]/20 text-[#F4743B] text-xs flex-shrink-0 ml-2">
                    LIVE
                  </Badge>
                </div>
              </Link>
            ))}
          </div>

          <Link to={createPageUrl("Cups")}>
            <Button 
              variant="ghost" 
              className="w-full mt-3 text-[#F4743B] hover:bg-[#F4743B]/10"
            >
              Se alla turneringar
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}
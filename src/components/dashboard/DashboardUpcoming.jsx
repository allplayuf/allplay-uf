import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Calendar, ArrowRight, MapPin, Clock, PlayCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function DashboardUpcoming({ matches, venues, userMatchIds, title, icon: Icon, emptyText, link }) {
  const color = title === "Snabbspel" ? "#F4743B" : "#2BA84A";
  const lightColor = title === "Snabbspel" ? "bg-[#F4743B]/18 text-[#FDE3D2]" : "bg-[#2BA84A]/18 text-[#CFE8D6]";
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${title === "Snabbspel" ? 'from-[#F4743B]/20 to-[#F4743B]/10' : 'from-[#2BA84A]/20 to-[#2BA84A]/10'}`}>
            <Icon className="w-5 h-5" style={{ color }} strokeWidth={2.5} />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[#F4F7F5]">{title}</h2>
        </div>
        {link && (
          <Link to={link} className="text-sm font-semibold hover:text-[#CFE8D6] flex items-center gap-1 transition-colors group" style={{ color }}>
            Visa alla
            <motion.div animate={{ x: [0, 3, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
              <ArrowRight className="w-4 h-4" />
            </motion.div>
          </Link>
        )}
      </div>

      {matches.length === 0 ? (
        <Card className="bg-[#121715] rounded-[20px] shadow-sm border border-[#223029]">
          <CardContent className="p-8 text-center">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-gradient-to-br ${title === "Snabbspel" ? 'from-[#F4743B]/10' : 'from-[#2BA84A]/10'}`}>
              <Icon className="w-8 h-8 text-[#7B8A83]" />
            </div>
            <p className="text-sm text-[#B6C2BC] mb-6">{emptyText}</p>
            <Link to={createPageUrl("Matches")}>
              <button className={`inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border px-5 text-sm font-semibold transition-all hover:bg-white/5`} style={{ borderColor: `${color}40`, color: '#CFE8D6' }}>
                Hitta matcher
              </button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {matches.map((match, index) => {
            const venue = venues.find(v => v.id === match.venue_id);
            return (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <Link to={`${createPageUrl("MatchDetail")}?id=${match.id}`}>
                  <div className={`bg-gradient-to-br from-[#121715] to-[#18221E] rounded-[18px] shadow-sm border border-[#223029] p-4 hover:shadow-lg transition-all min-h-[90px] flex items-center gap-3 group ${title === "Snabbspel" ? 'hover:border-[#F4743B]/30' : 'hover:border-[#2BA84A]/30'}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h4 className={`text-base font-bold text-[#F4F7F5] transition-colors ${title === "Snabbspel" ? 'group-hover:text-[#F4743B]' : 'group-hover:text-[#2BA84A]'}`}>{match.title}</h4>
                        <span className={`inline-flex h-6 items-center rounded-full px-3 text-xs font-bold ring-1 ${lightColor} ring-white/10`}>
                          {match.format}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#B6C2BC] flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {venue?.name || 'Okänd'} {match.distance ? `(${match.distance.toFixed(1)}km)` : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {match.date} {match.time}
                        </span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {match.is_spontaneous ? (
                        <span className="text-sm font-semibold text-[#B6C2BC]">
                          {match.current_players || 0} anmälda
                        </span>
                      ) : (
                        <span className={`inline-flex h-8 items-center rounded-full bg-[#18221E] px-4 text-sm font-bold ring-1 ${title === "Snabbspel" ? 'text-[#F4743B] ring-[#F4743B]/25' : 'text-[#2BA84A] ring-[#2BA84A]/25'}`}>
                          {match.current_players || 0}/{match.max_players}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
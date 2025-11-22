import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, ArrowRight, MapPin, Clock, PlayCircle } from "lucide-react";

export default function DashboardMatchLists({ upcomingMatches, nearbyMatches, quickPlayMatches, venues }) {
  return (
    <div className="lg:col-span-2 space-y-5 sm:space-y-6">
      {/* Upcoming Matches */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-[#2BA84A]/20 to-[#2BA84A]/10 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-[#2BA84A]" strokeWidth={2.5} />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#F4F7F5]">Kommande matcher</h2>
          </div>
          <Link to={createPageUrl("Matches")} className="text-sm font-semibold text-[#2BA84A] hover:text-[#CFE8D6] flex items-center gap-1 transition-colors group">
            Visa alla
            <motion.div
              animate={{ x: [0, 3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ArrowRight className="w-4 h-4" />
            </motion.div>
          </Link>
        </div>

        {upcomingMatches.length === 0 ? (
          <Card className="bg-[#121715] rounded-[20px] shadow-[0_6px_18px_rgba(0,0,0,0.22)] border border-[#223029]">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-[#2BA84A]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-[#9FC9AC]" />
              </div>
              <p className="text-sm text-[#B6C2BC] mb-6">Inga kommande matcher</p>
              <Link to={createPageUrl("Matches")}>
                <button className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border border-[#2BA84A]/35 px-5 text-sm font-semibold text-[#CFE8D6] transition-all hover:bg-[#2BA84A]/10 active:bg-[#2BA84A]/16">
                  Hitta matcher
                </button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {upcomingMatches.map((match, index) => {
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
                    <div className="bg-gradient-to-br from-[#121715] to-[#18221E] rounded-[18px] shadow-[0_8px_24px_rgba(0,0,0,0.3)] border border-[#223029] p-4 hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)] hover:border-[#2BA84A]/30 transition-all min-h-[90px] flex items-center gap-3 group">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h4 className="text-base font-bold text-[#F4F7F5] group-hover:text-[#2BA84A] transition-colors">{match.title}</h4>
                          <span className="inline-flex h-6 items-center rounded-full bg-[#2BA84A]/18 px-3 text-xs font-bold text-[#CFE8D6] ring-1 ring-[#2BA84A]/25">
                            {match.format}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[#B6C2BC] flex-wrap">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {venue?.name || 'Okänd'}
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
                          <span className="inline-flex h-8 items-center rounded-full bg-[#18221E] px-4 text-sm font-bold text-[#2BA84A] ring-1 ring-[#2BA84A]/25">
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

      {nearbyMatches.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-[#2BA84A]/20 to-[#2BA84A]/10 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-[#2BA84A]" strokeWidth={2.5} />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-[#F4F7F5]">Nära dig</h2>
            </div>
            <Link to={createPageUrl("Map")} className="text-sm font-semibold text-[#2BA84A] hover:text-[#CFE8D6] flex items-center gap-1 transition-colors">
              Se karta
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {nearbyMatches.map((match, index) => {
              const venue = match.venue;
              return (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
                  whileHover={{ scale: 1.02, y: -2 }}
                >
                  <Link to={`${createPageUrl("MatchDetail")}?id=${match.id}`}>
                    <div className="bg-gradient-to-br from-[#121715] to-[#18221E] rounded-[18px] shadow-[0_8px_24px_rgba(0,0,0,0.3)] border border-[#223029] p-4 hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)] hover:border-[#2BA84A]/30 transition-all min-h-[90px] flex items-center gap-3 group">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h4 className="text-base font-bold text-[#F4F7F5] group-hover:text-[#2BA84A] transition-colors">{match.title}</h4>
                          <span className="inline-flex h-6 items-center rounded-full bg-[#2BA84A]/18 px-3 text-xs font-bold text-[#CFE8D6] ring-1 ring-[#2BA84A]/25">
                            {match.format}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[#B6C2BC] flex-wrap">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {venue?.name || 'Okänd'} ({match.distance?.toFixed(1)}km)
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
                          <span className="inline-flex h-8 items-center rounded-full bg-[#18221E] px-4 text-sm font-bold text-[#2BA84A] ring-1 ring-[#2BA84A]/25">
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
        </motion.div>
      )}

      {quickPlayMatches.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-[#F4743B]/20 to-[#F4743B]/10 rounded-xl flex items-center justify-center">
                <PlayCircle className="w-5 h-5 text-[#F4743B]" strokeWidth={2.5} />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-[#F4F7F5]">Snabbspel</h2>
            </div>
            <Link to={createPageUrl("Matches")} className="text-sm font-semibold text-[#F4743B] hover:text-[#FDE3D2] flex items-center gap-1 transition-colors">
              Se alla
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {quickPlayMatches.slice(0, 3).map((match, index) => {
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
                    <div className="bg-gradient-to-br from-[#121715] to-[#18221E] rounded-[18px] shadow-[0_8px_24px_rgba(0,0,0,0.3)] border border-[#223029] p-4 hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)] hover:border-[#F4743B]/30 transition-all min-h-[90px] flex items-center gap-3 group">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h4 className="text-base font-bold text-[#F4F7F5] group-hover:text-[#F4743B] transition-colors">{match.title}</h4>
                          <span className="inline-flex h-6 items-center rounded-full bg-[#F4743B]/18 px-3 text-xs font-bold text-[#FDE3D2] ring-1 ring-[#F4743B]/25">
                            {match.format}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[#B6C2BC]">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {venue?.name || 'Okänd'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {match.date} {match.time}
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="inline-flex h-8 items-center rounded-full bg-[#18221E] px-4 text-sm font-bold text-[#F4743B] ring-1 ring-[#F4743B]/25">
                          {match.current_players || 0}/{match.max_players}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
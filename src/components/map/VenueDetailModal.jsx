import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  X,
  MapPin,
  Star,
  Navigation,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  Shield,
  Plus,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from "framer-motion";

export default function VenueDetailModal({ venue, matches, onClose, onCreateMatch }) {
  if (!venue) return null;

  const upcomingMatches = matches.filter(m => m.status === 'upcoming').slice(0, 5);
  const ongoingMatches = matches.filter(m => m.status === 'ongoing');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
        {/* Backdrop with fade-in */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Content with slide-up animation */}
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative w-full sm:max-w-2xl sm:mx-4"
        >
          <Card className="bg-[#121715] border border-[#223029] shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-hidden">
            
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-br from-[#2BA84A] to-[#248232] p-4 sm:p-6 border-b border-[#223029]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-bold text-[#EAF6EE]">{venue.name}</h2>
                    {venue.is_verified && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-[#FFFFFF]/20 rounded-full backdrop-blur-sm">
                        <CheckCircle className="w-4 h-4 text-[#EAF6EE]" />
                        <span className="text-[10px] font-semibold text-[#EAF6EE]">AllPlay Verified</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-[#CFE8D6] flex items-center gap-2">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{venue.address}, {venue.city}</span>
                    </p>
                    

                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-[#FFFFFF]/10 hover:bg-[#FFFFFF]/20 text-[#EAF6EE] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-140px)] sm:max-h-[calc(90vh-160px)]">
              <CardContent className="p-4 sm:p-6 space-y-6">
                
                {/* Ongoing Matches Alert */}
                {ongoingMatches.length > 0 && (
                  <div className="p-4 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-[#FFD700] rounded-full animate-pulse"></div>
                      <span className="text-sm font-semibold text-[#FFD700]">Match pågår nu!</span>
                    </div>
                    {ongoingMatches.map(match => (
                      <Link 
                        key={match.id}
                        to={`${createPageUrl("MatchDetail")}?id=${match.id}`}
                        className="block mt-2 p-3 bg-[#18221E] rounded-xl hover:bg-[#223029] transition-colors"
                      >
                        <p className="text-sm font-medium text-[#F4F7F5]">{match.title}</p>
                        <p className="text-xs text-[#B6C2BC] mt-1">{match.format} • {match.current_players || 0} spelare</p>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-[#18221E] rounded-xl border border-[#223029] text-center">
                    <Users className="w-5 h-5 text-[#2BA84A] mx-auto mb-1" />
                    <div className="text-lg font-semibold text-[#F4F7F5]">{upcomingMatches.length}</div>
                    <div className="text-[10px] text-[#B6C2BC]">Matcher</div>
                  </div>
                  
                  <div className="p-3 bg-[#18221E] rounded-xl border border-[#223029] text-center">
                    <Clock className="w-5 h-5 text-[#2BA84A] mx-auto mb-1" />
                    <div className="text-lg font-semibold text-[#F4F7F5]">{venue.formats_supported?.length || 0}</div>
                    <div className="text-[10px] text-[#B6C2BC]">Format</div>
                  </div>
                  
                  <div className="p-3 bg-[#18221E] rounded-xl border border-[#223029] text-center">
                    <Shield className="w-5 h-5 text-[#2BA84A] mx-auto mb-1" />
                    <div className="text-lg font-semibold text-[#F4F7F5]">{venue.facilities?.length || 0}</div>
                    <div className="text-[10px] text-[#B6C2BC]">Faciliteter</div>
                  </div>
                </div>

                {/* Formats Supported */}
                {venue.formats_supported && venue.formats_supported.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-[#9FC9AC] mb-2">Format som stöds</h3>
                    <div className="flex flex-wrap gap-2">
                      {venue.formats_supported.map(format => (
                        <Badge 
                          key={format}
                          className="bg-[#2BA84A]/16 text-[#CFE8D6] ring-1 ring-[#2BA84A]/30 text-xs"
                        >
                          {format}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Facilities */}
                {venue.facilities && venue.facilities.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-[#9FC9AC] mb-2">Faciliteter</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {venue.facilities.map(facility => (
                        <div key={facility} className="flex items-center gap-2 p-2 bg-[#18221E] rounded-lg border border-[#223029]">
                          <CheckCircle className="w-4 h-4 text-[#2BA84A] flex-shrink-0" />
                          <span className="text-xs text-[#F4F7F5] capitalize">
                            {facility.replace('_', ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upcoming Matches */}
                {upcomingMatches.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-[#9FC9AC] mb-3">Kommande matcher</h3>
                    <div className="space-y-2">
                      {upcomingMatches.map(match => (
                        <Link
                          key={match.id}
                          to={`${createPageUrl("MatchDetail")}?id=${match.id}`}
                          className="block p-3 bg-[#18221E] rounded-xl border border-[#223029] hover:border-[#2BA84A] hover:bg-[#223029] transition-all"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[#F4F7F5] truncate">{match.title}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-xs text-[#B6C2BC]">
                                  {match.date} • {match.time}
                                </span>
                                <Badge className="bg-[#F4743B]/16 text-[#FDE3D2] ring-1 ring-[#F4743B]/25 text-[10px] h-5">
                                  {match.format}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {!match.is_spontaneous && (
                                <span className="text-xs font-semibold text-[#9FC9AC]">
                                  {match.current_players || 0}/{match.max_players}
                                </span>
                              )}
                              <ChevronRight className="w-4 h-4 text-[#B6C2BC]" />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Matches State */}
                {upcomingMatches.length === 0 && ongoingMatches.length === 0 && (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-[#248232] mx-auto mb-3 opacity-50" />
                    <p className="text-sm text-[#B6C2BC] mb-4">Inga matcher just nu</p>
                  </div>
                )}
              </CardContent>
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 p-4 bg-[#121715] border-t border-[#223029] space-y-2">
              <button
                onClick={() => {
                  onCreateMatch(venue);
                  onClose();
                }}
                className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl bg-[#F4743B] text-white font-semibold hover:bg-[#E5683A] transition-all hover:scale-[1.02] active:scale-100 shadow-[0_4px_16px_rgba(244,116,59,0.3)]"
              >
                <Plus className="w-5 h-5" />
                Skapa match här
              </button>
              
              <button
                onClick={() => {
                  window.open(`https://www.google.com/maps/search/?api=1&query=${venue.latitude},${venue.longitude}`, '_blank');
                }}
                className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl border border-[#2BA84A]/35 text-[#CFE8D6] font-semibold hover:bg-[#2BA84A]/10 transition-all"
              >
                <Navigation className="w-5 h-5" />
                Öppna i Google Maps
              </button>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
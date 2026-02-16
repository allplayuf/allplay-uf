import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Users, Clock, Share2, ArrowRight, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { getUsersByIds } from "@/components/supabase/services";
import ShareMatchModal from "./ShareMatchModal";
import AvatarImage from "@/components/ui/avatar-image";

export default function NextMatchCard({ match, venue, participants = [] }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });
  const [showShareModal, setShowShareModal] = useState(false);

  const participantUserIds = participants.slice(0, 6).map(p => p.user_id).filter(Boolean);

  const { data: participantUsers = [] } = useQuery({
    queryKey: ['nextMatchParticipantUsers', ...participantUserIds],
    queryFn: () => getUsersByIds(participantUserIds),
    enabled: participantUserIds.length > 0,
    staleTime: 60000,
  });

  useEffect(() => {
    if (!match) return;

    const calculateTimeLeft = () => {
      const matchDateTime = new Date(`${match.date}T${match.time}`);
      const now = new Date();
      const difference = matchDateTime - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000);
    return () => clearInterval(timer);
  }, [match]);

  if (!match) {
    return (
      <Card className="bg-[#121715] rounded-2xl border border-[#223029] overflow-hidden">
        <CardContent className="p-6 text-center">
          <div className="w-14 h-14 bg-[#2BA84A]/10 rounded-2xl flex items-center justify-center mx-auto mb-3 ring-1 ring-[#2BA84A]/20">
            <Calendar className="w-7 h-7 text-[#2BA84A]" />
          </div>
          <p className="text-sm font-semibold text-[#B6C2BC] mb-3">Inga kommande matcher</p>
          <Link to={createPageUrl("Matches")}>
            <button className="h-9 px-5 bg-[#2BA84A] hover:bg-[#248232] text-white rounded-xl text-sm font-semibold transition-colors">
              Hitta matcher
            </button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateStr) => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    if (dateStr === today) return 'Idag';
    if (dateStr === tomorrow) return 'Imorgon';
    return new Date(dateStr).toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'short' });
  };

  const spotsLeft = match.is_spontaneous ? null : (match.max_players - participants.length);
  const progressPct = match.is_spontaneous ? 0 : (participants.length / (match.max_players || 1)) * 100;

  return (
    <>
      <AnimatePresence>
        {showShareModal && (
          <ShareMatchModal match={match} onClose={() => setShowShareModal(false)} />
        )}
      </AnimatePresence>

      <Card className="bg-[#121715] rounded-2xl border border-[#223029] overflow-hidden relative">
        {/* Top accent gradient */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#2BA84A] via-[#248232] to-[#2BA84A]/50" />

        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-[#2BA84A]/15 rounded-xl flex items-center justify-center ring-1 ring-[#2BA84A]/25">
                <Zap className="w-4.5 h-4.5 text-[#2BA84A]" strokeWidth={2.5} />
              </div>
              <h3 className="text-sm font-bold text-[#F4F7F5]">Din Nästa Match</h3>
            </div>
            <button
              onClick={(e) => { e.preventDefault(); setShowShareModal(true); }}
              className="w-8 h-8 rounded-lg bg-[#18221E] hover:bg-[#223029] flex items-center justify-center transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 text-[#9EAAA4]" />
            </button>
          </div>

          {/* Countdown */}
          <div className="mx-4 mb-3 bg-[#18221E] rounded-xl p-3 border border-[#223029]">
            <p className="text-[10px] font-bold text-[#9EAAA4] uppercase tracking-wider mb-2 text-center">Startar om</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Dagar', value: timeLeft.days },
                { label: 'Timmar', value: timeLeft.hours },
                { label: 'Min', value: timeLeft.minutes }
              ].map((item, i) => (
                <div key={i} className="bg-[#121715] rounded-lg p-2 text-center border border-[#223029]">
                  <div className="text-xl font-black text-[#2BA84A] tabular-nums">{item.value}</div>
                  <div className="text-[9px] text-[#9EAAA4] font-medium">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Match Info */}
          <div className="px-4 pb-3 space-y-2.5">
            <h4 className="text-base font-bold text-[#F4F7F5] truncate">{match.title}</h4>
            
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-[#B6C2BC]">
                <MapPin className="w-3.5 h-3.5 text-[#2BA84A] flex-shrink-0" />
                <span className="truncate">{venue?.name || 'Okänd plan'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#B6C2BC]">
                <Clock className="w-3.5 h-3.5 text-[#F4743B] flex-shrink-0" />
                <span>{formatDate(match.date)} · {match.time}</span>
              </div>
            </div>

            {/* Progress */}
            {!match.is_spontaneous && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#9EAAA4]">Spelare</span>
                  <span className="text-[#F4F7F5] font-bold">{participants.length}/{match.max_players}</span>
                </div>
                <div className="h-1.5 bg-[#18221E] rounded-full overflow-hidden border border-[#223029]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className={`h-full rounded-full ${progressPct >= 90 ? 'bg-[#F4743B]' : 'bg-[#2BA84A]'}`}
                  />
                </div>
                {spotsLeft !== null && spotsLeft <= 3 && spotsLeft > 0 && (
                  <p className="text-[10px] font-semibold text-[#F4743B]">{spotsLeft} {spotsLeft === 1 ? 'plats' : 'platser'} kvar!</p>
                )}
              </div>
            )}

            {/* Participants */}
            {participants.length > 0 && (
              <div className="flex items-center gap-2 pt-1">
                <div className="flex -space-x-1.5">
                  {participants.slice(0, 5).map((p, i) => {
                    const pUser = participantUsers.find(u => u.id === p.user_id);
                    return (
                      <div key={p.id || i} className="ring-2 ring-[#121715] rounded-full">
                        <AvatarImage
                          src={pUser?.avatar_url || pUser?.profile_image_url}
                          name={pUser?.display_name || pUser?.full_name || 'S'}
                          className="w-7 h-7"
                          textClassName="text-[9px]"
                        />
                      </div>
                    );
                  })}
                </div>
                {participants.length > 5 && (
                  <span className="text-[10px] font-semibold text-[#9EAAA4]">+{participants.length - 5}</span>
                )}
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="px-4 pb-4">
            <Link to={`${createPageUrl("MatchDetail")}?id=${match.id}`}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full h-10 bg-gradient-to-r from-[#2BA84A] to-[#248232] rounded-xl flex items-center justify-center gap-2 text-white font-bold text-sm transition-all hover:shadow-[0_0_20px_rgba(43,168,74,0.3)]"
              >
                <span>Visa Match</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
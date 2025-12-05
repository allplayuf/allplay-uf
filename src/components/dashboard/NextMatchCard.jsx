import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Users, Clock, Share2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ShareMatchModal from "./ShareMatchModal";

export default function NextMatchCard({ match, venue, participants = [] }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });
  const [showShareModal, setShowShareModal] = useState(false);

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
      <Card className="bg-gradient-to-br from-[#121715] to-[#0F2917]/30 rounded-[20px] shadow-[0_8px_24px_rgba(0,0,0,0.3)] border border-[#2BA84A]/20 overflow-hidden">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-[#2BA84A]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-1 ring-[#2BA84A]/20">
            <Calendar className="w-8 h-8 text-[#2BA84A]" />
          </div>
          <p className="text-sm font-semibold text-[#B6C2BC] mb-2">Inga kommande matcher</p>
          <Link to={createPageUrl("Matches")}>
            <button className="mt-2 h-9 px-4 bg-[#2BA84A] hover:bg-[#248232] text-white rounded-xl text-sm font-semibold transition-colors">
              Hitta matcher
            </button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const handleShare = (e) => {
    e.preventDefault();
    setShowShareModal(true);
  };

  return (
    <>
      <AnimatePresence>
        {showShareModal && (
          <ShareMatchModal
            match={match}
            onClose={() => setShowShareModal(false)}
          />
        )}
      </AnimatePresence>
    <Card className="bg-gradient-to-br from-[#121715] to-[#0F2917]/30 rounded-[20px] shadow-[0_8px_24px_rgba(0,0,0,0.3)] border border-[#2BA84A]/20 overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2BA84A]/10 to-[#248232]/10 p-5 border-b border-[#2BA84A]/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#2BA84A]/20 rounded-xl flex items-center justify-center ring-2 ring-[#2BA84A]/30">
                <Calendar className="w-5 h-5 text-[#2BA84A]" strokeWidth={2.5} />
              </div>
              <h3 className="text-lg font-bold text-[#F4F7F5]">Din Nästa Match</h3>
            </div>
            <button
              onClick={handleShare}
              className="w-9 h-9 rounded-lg bg-[#18221E] hover:bg-[#223029] flex items-center justify-center transition-colors"
            >
              <Share2 className="w-4 h-4 text-[#2BA84A]" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Countdown */}
          <div className="bg-gradient-to-br from-[#2BA84A]/10 to-[#248232]/5 rounded-2xl p-4 border border-[#2BA84A]/30">
            <p className="text-xs font-semibold text-[#2BA84A] mb-3 text-center">Startar om</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Dagar', value: timeLeft.days },
                { label: 'Timmar', value: timeLeft.hours },
                { label: 'Minuter', value: timeLeft.minutes }
              ].map((item, index) => (
                <div key={index} className="bg-[#121715] rounded-xl p-3 text-center">
                  <div className="text-2xl font-black text-[#2BA84A] mb-1">{item.value}</div>
                  <div className="text-[10px] text-[#B6C2BC] font-medium">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Match Details */}
          <div>
            <h4 className="text-lg font-bold text-[#F4F7F5] mb-3">{match.title}</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-[#B6C2BC]">
                <MapPin className="w-4 h-4 text-[#2BA84A]" />
                <span>{venue?.name || 'Okänd plan'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#B6C2BC]">
                <Clock className="w-4 h-4 text-[#2BA84A]" />
                <span>{match.date} • {match.time}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#B6C2BC]">
                <Users className="w-4 h-4 text-[#2BA84A]" />
                <span>{participants.length}/{match.max_players} spelare</span>
              </div>
            </div>
          </div>

          {/* Participants Preview */}
          {participants.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#B6C2BC] mb-2">Anmälda spelare</p>
              <div className="flex -space-x-2">
                {participants.slice(0, 5).map((participant, index) => (
                  <div
                    key={participant.id}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2BA84A] to-[#248232] flex items-center justify-center ring-2 ring-[#121715] text-white text-xs font-semibold"
                  >
                    {participant.user_id?.[0] || 'U'}
                  </div>
                ))}
                {participants.length > 5 && (
                  <div className="w-8 h-8 rounded-full bg-[#18221E] flex items-center justify-center ring-2 ring-[#121715] text-[#2BA84A] text-xs font-semibold">
                    +{participants.length - 5}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CTA */}
          <Link to={`${createPageUrl("MatchDetail")}?id=${match.id}`}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full h-11 bg-gradient-to-r from-[#2BA84A] to-[#248232] rounded-xl flex items-center justify-center gap-2 text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all"
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
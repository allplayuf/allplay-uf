import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, ArrowRight, Navigation } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function NearbyVenuesPreview({ venues = [], userLocation }) {
  if (!userLocation || venues.length === 0) return null;

  return (
    <Card className="bg-gradient-to-br from-[#121715] to-[#18221E]/50 rounded-[20px] shadow-[0_8px_24px_rgba(0,0,0,0.3)] border border-[#2BA84A]/20 overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2BA84A]/10 to-[#248232]/10 p-5 border-b border-[#2BA84A]/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#2BA84A]/20 rounded-xl flex items-center justify-center ring-2 ring-[#2BA84A]/30">
                <Navigation className="w-5 h-5 text-[#2BA84A]" strokeWidth={2.5} />
              </div>
              <h3 className="text-lg font-bold text-[#F4F7F5]">Planer Nära Dig</h3>
            </div>
            <Link to={createPageUrl("Map")} className="text-sm font-semibold text-[#2BA84A] hover:text-[#CFE8D6] flex items-center gap-1">
              Karta
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Mini Map Placeholder */}
          <div className="relative w-full h-32 bg-[#18221E] rounded-xl mb-4 overflow-hidden border border-[#223029]">
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Grid pattern */}
              <div className="absolute inset-0 opacity-10">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="absolute inset-0 border-l border-[#2BA84A]" style={{ left: `${(i + 1) * 12.5}%` }} />
                ))}
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="absolute inset-0 border-t border-[#2BA84A]" style={{ top: `${(i + 1) * 25}%` }} />
                ))}
              </div>

              {/* Venue markers */}
              {venues.slice(0, 5).map((venue, index) => (
                <motion.div
                  key={venue.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="absolute w-6 h-6 bg-[#2BA84A] rounded-full flex items-center justify-center shadow-lg"
                  style={{
                    left: `${20 + index * 15}%`,
                    top: `${30 + (index % 2) * 20}%`
                  }}
                >
                  <MapPin className="w-3 h-3 text-white" strokeWidth={2.5} />
                </motion.div>
              ))}

              {/* User location */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.8, 1, 0.8]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute w-4 h-4 bg-[#F4743B] rounded-full ring-4 ring-[#F4743B]/30"
                style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
              />
            </div>
          </div>

          {/* Venue List */}
          <div className="space-y-2">
            {venues.slice(0, 3).map((venue, index) => (
              <motion.div
                key={venue.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={createPageUrl("Map")}>
                  <div className="flex items-center justify-between p-3 bg-[#18221E] rounded-xl hover:bg-[#223029] transition-colors border border-[#223029]">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 bg-[#2BA84A]/15 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 text-[#2BA84A]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#F4F7F5] truncate">{venue.name}</p>
                        <p className="text-xs text-[#B6C2BC]">{venue.city}</p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-2">
                      <span className="text-xs font-bold text-[#2BA84A]">{venue.distance?.toFixed(1)}km</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* View All */}
          <Link to={createPageUrl("Map")}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full mt-4 h-10 bg-[#18221E] hover:bg-[#223029] border border-[#223029] rounded-xl flex items-center justify-center gap-2 text-[#2BA84A] font-semibold text-sm transition-colors"
            >
              <span>Se alla planer</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
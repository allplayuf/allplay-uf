import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, PlayCircle, ArrowRight, Clock } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function DashboardUpcoming({ myUpcomingMatches, nearbyMatches, quickPlayMatches, venues }) {
  return (
    <div className="space-y-6">
      {/* My Upcoming Matches */}
      <MatchSection
        title="Kommande matcher"
        icon={Calendar}
        iconColor="#2BA84A"
        viewAllLink={createPageUrl("Matches")}
        emptyTitle="Inga kommande matcher"
        emptyText="Hitta matcher"
        delay={0.5}
      >
        {myUpcomingMatches.length > 0 ? (
          <div className="space-y-3">
            {myUpcomingMatches.map((match, index) => (
              <MatchCard key={match.id} match={match} venue={venues.find(v => v.id === match.venue_id)} index={index} />
            ))}
          </div>
        ) : null}
      </MatchSection>

      {/* Nearby Matches */}
      {nearbyMatches.length > 0 && (
        <MatchSection
          title="Nära dig"
          icon={MapPin}
          iconColor="#2BA84A"
          viewAllLink={createPageUrl("Map")}
          viewAllText="Se karta"
          delay={0.6}
        >
          <div className="space-y-3">
            {nearbyMatches.map((match, index) => (
              <MatchCard key={match.id} match={match} venue={match.venue} index={index} showDistance />
            ))}
          </div>
        </MatchSection>
      )}

      {/* Quick Play */}
      {quickPlayMatches.length > 0 && (
        <MatchSection
          title="Snabbspel"
          icon={PlayCircle}
          iconColor="#F4743B"
          viewAllLink={createPageUrl("Matches")}
          delay={0.8}
        >
          <div className="space-y-3">
            {quickPlayMatches.slice(0, 3).map((match, index) => (
              <MatchCard 
                key={match.id} 
                match={match} 
                venue={venues.find(v => v.id === match.venue_id)} 
                index={index} 
                highlightColor="#F4743B"
              />
            ))}
          </div>
        </MatchSection>
      )}
    </div>
  );
}

function MatchSection({ title, icon: Icon, iconColor, viewAllLink, viewAllText = "Visa alla", children, emptyTitle, emptyText, delay }) {
  const hasContent = React.Children.count(children) > 0 || (children && children.type === 'div' && children.props.children);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${iconColor}33, ${iconColor}1A)` }}>
            <Icon className="w-5 h-5" style={{ color: iconColor }} strokeWidth={2.5} />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[#F4F7F5]">{title}</h2>
        </div>
        <Link to={viewAllLink} className="text-sm font-semibold flex items-center gap-1 transition-colors group" style={{ color: iconColor }}>
          {viewAllText}
          <motion.div animate={{ x: [0, 3, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <ArrowRight className="w-4 h-4" />
          </motion.div>
        </Link>
      </div>

      {!hasContent && emptyTitle ? (
        <Card className="bg-[#121715] rounded-[20px] shadow-[0_6px_18px_rgba(0,0,0,0.22)] border border-[#223029]">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-[#2BA84A]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-[#9FC9AC]" />
            </div>
            <p className="text-sm text-[#B6C2BC] mb-6">{emptyTitle}</p>
            <Link to={viewAllLink}>
              <button className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border border-[#2BA84A]/35 px-5 text-sm font-semibold text-[#CFE8D6] transition-all hover:bg-[#2BA84A]/10 active:bg-[#2BA84A]/16">
                {emptyText}
              </button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        children
      )}
    </motion.div>
  );
}

function MatchCard({ match, venue, index, showDistance, highlightColor = "#2BA84A" }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
      whileHover={{ scale: 1.02, y: -2 }}
    >
      <Link to={`${createPageUrl("MatchDetail")}?id=${match.id}`}>
        <div className={`bg-gradient-to-br from-[#121715] to-[#18221E] rounded-[18px] shadow-[0_8px_24px_rgba(0,0,0,0.3)] border border-[#223029] p-4 hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)] transition-all min-h-[90px] flex items-center gap-3 group`} style={{ '--highlight': highlightColor }}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h4 className="text-base font-bold text-[#F4F7F5] group-hover:text-[var(--highlight)] transition-colors">{match.title}</h4>
              <span className="inline-flex h-6 items-center rounded-full px-3 text-xs font-bold text-[#CFE8D6] ring-1" style={{ backgroundColor: `${highlightColor}2E`, ringColor: `${highlightColor}40` }}>
                {match.format}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#B6C2BC] flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {venue?.name || 'Okänd'} {showDistance && `(${match.distance?.toFixed(1)}km)`}
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
              <span className="inline-flex h-8 items-center rounded-full bg-[#18221E] px-4 text-sm font-bold ring-1" style={{ color: highlightColor, ringColor: `${highlightColor}40` }}>
                {match.current_players || 0}/{match.max_players}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
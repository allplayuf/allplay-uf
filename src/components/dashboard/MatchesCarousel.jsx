import React, { useState, useMemo, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, MapPin, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { createPageUrl } from "@/utils";
import MatchCard from "../matches/MatchCard";
import PremiumEmptyState from "../ui/premium-empty-state";
import { triggerHaptic } from "../utils/motionTokens";

/**
 * Unified matches carousel for the dashboard.
 * Combines "Nära dig" and "Dina matcher" into one horizontal snap-scroll carousel
 * with segmented tabs instead of stacked widgets.
 */
export default function MatchesCarousel({
  nearbyMatches = [],
  myMatches = [],
  allParticipants = [],
  venues = [],
  user,
  isGuest,
  onJoin,
  onCreateMatch,
}) {
  // Default tab: if user has matches show those, otherwise nearby
  const [activeTab, setActiveTab] = useState(
    !isGuest && myMatches.length > 0 ? "mine" : "nearby"
  );
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const matches = useMemo(() => {
    if (activeTab === "mine") return myMatches;
    return nearbyMatches;
  }, [activeTab, myMatches, nearbyMatches]);

  // Reset scroll on tab change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
  }, [activeTab]);

  // Track scroll position for arrow enable/disable
  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [matches.length]);

  const scrollByAmount = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.85;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
    triggerHaptic("light");
  };

  const tabs = [
    { id: "nearby", label: "Nära dig", count: nearbyMatches.length },
    {
      id: "mine",
      label: isGuest ? "Kommande" : "Dina matcher",
      count: myMatches.length,
    },
  ];

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 px-1">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-[#2BA84A]/20 to-[#2BA84A]/10 rounded-xl flex items-center justify-center">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[#2BA84A]" strokeWidth={2.5} />
          </div>
          <h2 className="text-base sm:text-xl font-bold text-[#F4F7F5]">Matcher</h2>
        </div>
        <Link
          to={createPageUrl("Matches")}
          className="text-sm font-semibold text-[#2BA84A] hover:text-[#CFE8D6] flex items-center gap-1 transition-colors"
        >
          Visa alla
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Segmented tabs */}
      <div className="flex items-center gap-2 mb-4 px-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                triggerHaptic("light");
                setActiveTab(tab.id);
              }}
              className={`h-10 px-4 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                isActive
                  ? "bg-[#2BA84A]/16 text-[#EAF6EE] ring-1 ring-[#2BA84A]/30"
                  : "bg-[#18221E] text-[#B6C2BC] hover:bg-[#223029]"
              }`}
            >
              {tab.id === "nearby" && <MapPin className="w-3.5 h-3.5" />}
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span
                  className={`text-[11px] font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center ${
                    isActive ? "bg-[#2BA84A]/30 text-white" : "bg-[#0F1513] text-[#9EAAA4]"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}

        {/* Desktop nav arrows */}
        <div className="hidden lg:flex items-center gap-1.5 ml-auto">
          <button
            onClick={() => scrollByAmount(-1)}
            disabled={!canScrollLeft}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              canScrollLeft
                ? "bg-[#18221E] hover:bg-[#223029] text-[#F4F7F5]"
                : "bg-[#18221E]/40 text-[#4a5550] cursor-not-allowed"
            }`}
            aria-label="Scrolla vänster"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scrollByAmount(1)}
            disabled={!canScrollRight}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              canScrollRight
                ? "bg-[#18221E] hover:bg-[#223029] text-[#F4F7F5]"
                : "bg-[#18221E]/40 text-[#4a5550] cursor-not-allowed"
            }`}
            aria-label="Scrolla höger"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Carousel */}
      {matches.length === 0 ? (
        <PremiumEmptyState
          icon={<Calendar className="w-9 h-9" strokeWidth={2} />}
          title={
            activeTab === "nearby"
              ? "Inga matcher nära dig just nu"
              : isGuest
              ? "Inga matcher just nu"
              : "Du har inga kommande matcher"
          }
          description={
            activeTab === "nearby"
              ? "Inga öppna matcher inom 15 km. Skapa din egen eller kolla in alla matcher."
              : isGuest
              ? "Logga in för att hitta och gå med i matcher nära dig."
              : "Hitta en match att gå med i eller skapa en egen på 10 sekunder!"
          }
          actionLabel="Se alla matcher"
          onAction={() => {
            triggerHaptic("light");
            window.location.href = createPageUrl("Matches");
          }}
          secondaryLabel={!isGuest && onCreateMatch ? "Skapa match" : null}
          onSecondary={
            !isGuest && onCreateMatch
              ? () => {
                  triggerHaptic("medium");
                  onCreateMatch();
                }
              : null
          }
          accent="green"
        />
      ) : (
        <div className="relative">
          {/* Edge fade masks */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[#0F1513] to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[#0F1513] to-transparent z-10" />

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2 -mx-4 px-4 sm:mx-0 sm:px-1"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {matches.map((match, index) => (
              <div
                key={match.id}
                className="flex-shrink-0 snap-start w-[88%] sm:w-[380px] lg:w-[420px]"
              >
                <MatchCard
                  match={match}
                  venues={venues}
                  user={user}
                  participants={(allParticipants || []).filter(
                    (p) => p.match_id === match.id
                  )}
                  onJoin={onJoin}
                  index={index}
                />
              </div>
            ))}
          </motion.div>

          {/* Mobile scroll hint dots */}
          {matches.length > 1 && (
            <div className="flex lg:hidden justify-center gap-1.5 mt-3">
              {matches.slice(0, Math.min(matches.length, 6)).map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-[#2BA84A]/30"
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
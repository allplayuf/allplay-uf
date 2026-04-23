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
  const [isPaused, setIsPaused] = useState(false);
  const [activeDot, setActiveDot] = useState(0);

  // Tag each match with its source so we can show a subtle badge
  const matches = useMemo(() => {
    if (activeTab === "mine") {
      return myMatches.map((m) => ({ ...m, _source: "mine" }));
    }
    return nearbyMatches.map((m) => ({ ...m, _source: "nearby" }));
  }, [activeTab, myMatches, nearbyMatches]);

  // Reset scroll on tab change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
  }, [activeTab]);

  // Track scroll position for arrow enable/disable + active dot
  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
    // Active dot based on scroll position
    const firstChild = el.firstElementChild;
    if (firstChild) {
      const cardWidth = firstChild.getBoundingClientRect().width + 16; // gap-4 = 16px
      const idx = Math.round(el.scrollLeft / cardWidth);
      setActiveDot(Math.min(idx, matches.length - 1));
    }
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

  // Auto-scroll: smooth continuous drift. Pauses on touch/hover.
  // Uses requestAnimationFrame for silky-smooth carousel movement.
  useEffect(() => {
    if (matches.length <= 1 || isPaused) return;
    let rafId;
    let lastTs = performance.now();
    const pxPerSec = 24; // gentle drift speed

    const tick = (ts) => {
      const el = scrollRef.current;
      if (!el) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;

      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;
      if (atEnd) {
        // Seamless loop back to start
        el.scrollTo({ left: 0, behavior: "smooth" });
        lastTs = ts + 600; // brief pause during rewind
      } else {
        el.scrollLeft += pxPerSec * dt;
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [matches.length, isPaused, activeTab]);

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
      {/* Header row — title + compact segmented toggle + "Visa alla" */}
      <div className="flex items-center gap-3 mb-3 sm:mb-4 px-1">
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-[#2BA84A]/20 to-[#2BA84A]/10 rounded-xl flex items-center justify-center">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[#2BA84A]" strokeWidth={2.5} />
          </div>
          <h2 className="text-base sm:text-xl font-bold text-[#F4F7F5]">Matcher</h2>
        </div>

        {/* Compact segmented control */}
        <div className="flex-1 flex justify-center min-w-0">
          <div className="inline-flex items-center gap-0.5 bg-[#0F1513] border border-[#243029] rounded-full p-0.5 shadow-inner">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    triggerHaptic("light");
                    setActiveTab(tab.id);
                  }}
                  className={`relative h-8 px-3 sm:px-4 rounded-full text-[12px] sm:text-[13px] font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    isActive
                      ? "bg-[#2BA84A] text-white shadow-[0_2px_8px_rgba(43,168,74,0.4)]"
                      : "text-[#9EAAA4] hover:text-[#CFE8D6]"
                  }`}
                >
                  {tab.id === "nearby" && <MapPin className="w-3 h-3" />}
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span
                      className={`text-[10px] font-bold tabular-nums ${
                        isActive ? "text-white/90" : "text-[#6B7974]"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop arrows */}
        <div className="hidden lg:flex items-center gap-1.5 flex-shrink-0">
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

        <Link
          to={createPageUrl("Matches")}
          className="text-[12px] sm:text-sm font-semibold text-[#2BA84A] hover:text-[#CFE8D6] flex items-center gap-1 transition-colors flex-shrink-0"
        >
          <span className="hidden sm:inline">Visa alla</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
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
          {/* Edge fade masks — only when scrollable */}
          <div
            className={`pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0F1513] to-transparent z-10 transition-opacity duration-200 ${
              canScrollLeft ? "opacity-100" : "opacity-0"
            }`}
          />
          <div
            className={`pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0F1513] to-transparent z-10 transition-opacity duration-200 ${
              canScrollRight ? "opacity-100" : "opacity-0"
            }`}
          />

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            ref={scrollRef}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setTimeout(() => setIsPaused(false), 3000)}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-proximity scrollbar-hide pb-2 -mx-4 px-4 sm:mx-0 sm:px-1"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {matches.map((match, index) => (
              <div
                key={match.id}
                className="flex-shrink-0 snap-start w-[88%] xs:w-[82%] sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)]"
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

          {/* Mobile active-dot indicator */}
          {matches.length > 1 && (
            <div className="flex lg:hidden justify-center gap-1.5 mt-3">
              {matches.slice(0, Math.min(matches.length, 8)).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === activeDot
                      ? "w-5 bg-[#2BA84A]"
                      : "w-1.5 bg-[#2BA84A]/25"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
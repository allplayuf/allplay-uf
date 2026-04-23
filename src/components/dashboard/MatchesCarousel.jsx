import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, MapPin, ArrowRight, ChevronLeft, ChevronRight, UserCheck, Radar } from "lucide-react";
import { createPageUrl } from "@/utils";
import MatchCard from "../matches/MatchCard";
import PremiumEmptyState from "../ui/premium-empty-state";
import { triggerHaptic } from "../utils/motionTokens";

/**
 * Responsive matches carousel for the dashboard.
 *
 * Layout strategy per breakpoint:
 *  - Mobile   (<640px):  2-row header. One card + peek. Dots indicator.
 *  - Tablet   (640-1024): Single row header. ~2 cards visible.
 *  - Desktop  (≥1024):   Single row header with arrows. 3 cards visible.
 *
 * Interaction:
 *  - Auto-drift (24px/s) pauses on touch/hover/focus for 4s.
 *  - Snap-proximity so manual swipes still feel natural.
 *  - Infinite feel: smooth rewind to start when reaching end.
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
  const [activeTab, setActiveTab] = useState(
    !isGuest && myMatches.length > 0 ? "mine" : "nearby"
  );
  const scrollRef = useRef(null);
  const pauseTimerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeDot, setActiveDot] = useState(0);

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

  // Track scroll position: enable arrows + active dot on mobile
  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
    const firstChild = el.firstElementChild;
    if (firstChild) {
      const cardWidth = firstChild.getBoundingClientRect().width + 12;
      const idx = Math.round(el.scrollLeft / cardWidth);
      setActiveDot(Math.min(idx, matches.length - 1));
    }
  }, [matches.length]);

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
  }, [updateScrollState]);

  // Pause auto-scroll for 4s on any user interaction
  const pauseAutoScroll = useCallback(() => {
    setIsPaused(true);
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => setIsPaused(false), 4000);
  }, []);

  useEffect(() => {
    return () => {
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    };
  }, []);

  const scrollByAmount = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.85;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
    triggerHaptic("light");
    pauseAutoScroll();
  };

  // Smooth continuous auto-drift using rAF. Pauses on interaction.
  useEffect(() => {
    if (matches.length <= 1 || isPaused) return;
    let rafId;
    let lastTs = performance.now();
    const pxPerSec = 22;

    const tick = (ts) => {
      const el = scrollRef.current;
      if (!el) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      const dt = Math.min((ts - lastTs) / 1000, 0.05);
      lastTs = ts;

      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;
      if (atEnd) {
        el.scrollTo({ left: 0, behavior: "smooth" });
        lastTs = ts + 800;
      } else {
        el.scrollLeft += pxPerSec * dt;
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [matches.length, isPaused, activeTab]);

  const tabs = [
    {
      id: "nearby",
      label: "I närheten",
      shortLabel: "Nära",
      icon: Radar,
      count: nearbyMatches.length,
    },
    {
      id: "mine",
      label: isGuest ? "Kommande" : "Anmäld",
      shortLabel: isGuest ? "Kommande" : "Anmäld",
      icon: UserCheck,
      count: myMatches.length,
    },
  ];

  const SegmentedControl = ({ compact = false }) => (
    <div
      role="tablist"
      className="inline-flex items-center gap-1 bg-[#0F1513] border border-[#243029] rounded-full p-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.35)]"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => {
              triggerHaptic("light");
              setActiveTab(tab.id);
              pauseAutoScroll();
            }}
            className={`relative h-9 px-3.5 rounded-full text-[13px] font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              isActive
                ? "text-white"
                : "text-[#9EAAA4] hover:text-[#CFE8D6]"
            }`}
          >
            {/* Animated active pill */}
            {isActive && (
              <motion.span
                layoutId="segmented-pill"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                className="absolute inset-0 rounded-full bg-[#2BA84A] shadow-[0_4px_12px_rgba(43,168,74,0.45)]"
                aria-hidden
              />
            )}
            <Icon className="w-3.5 h-3.5 relative z-10" strokeWidth={2.5} />
            <span className="relative z-10">
              {compact ? tab.shortLabel : tab.label}
            </span>
            {tab.count > 0 && (
              <span
                className={`relative z-10 text-[10px] font-bold tabular-nums min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center ${
                  isActive
                    ? "bg-white/25 text-white"
                    : "bg-[#18221E] text-[#B6C2BC]"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <div>
      {/* MOBILE HEADER — 2 rows so nothing clips */}
      <div className="sm:hidden mb-3 px-1">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 bg-gradient-to-br from-[#2BA84A]/20 to-[#2BA84A]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-[#2BA84A]" strokeWidth={2.5} />
            </div>
            <h2 className="text-[17px] font-bold text-[#F4F7F5] truncate">
              Matcher
            </h2>
          </div>
          <Link
            to={createPageUrl("Matches")}
            className="text-[13px] font-semibold text-[#2BA84A] hover:text-[#CFE8D6] flex items-center gap-0.5 transition-colors flex-shrink-0"
          >
            Visa alla
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <SegmentedControl compact={false} />
      </div>

      {/* DESKTOP / TABLET HEADER — single row */}
      <div className="hidden sm:flex items-center gap-3 mb-4 px-1">
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-[#2BA84A]/20 to-[#2BA84A]/10 rounded-xl flex items-center justify-center">
            <Calendar className="w-5 h-5 text-[#2BA84A]" strokeWidth={2.5} />
          </div>
          <h2 className="text-xl font-bold text-[#F4F7F5]">Matcher</h2>
        </div>

        <div className="flex-1 flex justify-center">
          <SegmentedControl />
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
          className="text-sm font-semibold text-[#2BA84A] hover:text-[#CFE8D6] flex items-center gap-1 transition-colors flex-shrink-0"
        >
          Visa alla
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
          {/* Edge fades — only on mobile/tablet where content bleeds off screen */}
          <div
            className={`pointer-events-none absolute left-0 top-0 bottom-0 w-6 sm:w-8 bg-gradient-to-r from-[#0F1513] to-transparent z-10 transition-opacity duration-200 ${
              canScrollLeft ? "opacity-100" : "opacity-0"
            }`}
          />
          <div
            className={`pointer-events-none absolute right-0 top-0 bottom-0 w-6 sm:w-8 bg-gradient-to-l from-[#0F1513] to-transparent z-10 transition-opacity duration-200 ${
              canScrollRight ? "opacity-100" : "opacity-0"
            }`}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
              ref={scrollRef}
              onTouchStart={pauseAutoScroll}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              onFocusCapture={pauseAutoScroll}
              className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-proximity scrollbar-hide pb-2 -mx-3 px-3 sm:mx-0 sm:px-0"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                WebkitOverflowScrolling: "touch",
                scrollPaddingLeft: "12px",
                scrollPaddingRight: "12px",
              }}
            >
              {matches.map((match, index) => (
                <div
                  key={match.id}
                  className="flex-shrink-0 snap-start w-[86%] sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)]"
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
          </AnimatePresence>

          {/* Mobile progress dots */}
          {matches.length > 1 && (
            <div className="flex lg:hidden justify-center gap-1.5 mt-3">
              {matches.slice(0, Math.min(matches.length, 8)).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
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
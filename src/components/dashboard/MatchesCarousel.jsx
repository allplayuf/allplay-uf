import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, ArrowRight, ChevronLeft, ChevronRight, UserCheck, Radar } from "lucide-react";
import { createPageUrl } from "@/utils";
import MatchCard from "../matches/MatchCard";
import PremiumEmptyState from "../ui/premium-empty-state";
import { triggerHaptic } from "../utils/motionTokens";

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
  const [activeIndex, setActiveIndex] = useState(0);
  // Opacity fade on tab switch — no AnimatePresence so scrollRef is never remounted
  const [tabFading, setTabFading] = useState(false);

  const matches = useMemo(() => {
    if (activeTab === "mine") {
      return myMatches.map((m) => ({ ...m, _source: "mine" }));
    }
    return nearbyMatches.map((m) => ({ ...m, _source: "nearby" }));
  }, [activeTab, myMatches, nearbyMatches]);

  // Tab change: fade out → instant scroll reset → fade in
  useEffect(() => {
    setTabFading(true);
    setActiveIndex(0);
    const t = setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollLeft = 0;
      setTabFading(false);
      requestAnimationFrame(updateScrollState);
    }, 160);
    return () => clearTimeout(t);
  }, [activeTab]); // intentionally omits updateScrollState — called after DOM settles

  const getCardStep = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return 0;
    if (el.children.length >= 2) {
      const step =
        el.children[1].getBoundingClientRect().left -
        el.children[0].getBoundingClientRect().left;
      if (step > 0) return step;
    }
    if (el.firstElementChild) {
      const w = el.firstElementChild.getBoundingClientRect().width;
      if (w > 0) return w + (window.innerWidth >= 640 ? 16 : 12);
    }
    return el.clientWidth;
  }, []);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
    const step = getCardStep();
    if (step > 0) {
      const idx = Math.round(el.scrollLeft / step);
      setActiveIndex(Math.min(Math.max(idx, 0), matches.length - 1));
    }
  }, [matches.length, getCardStep]);

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

  const pauseAutoScroll = useCallback(() => {
    setIsPaused(true);
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => setIsPaused(false), 6000);
  }, []);

  useEffect(() => () => { if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current); }, []);

  const scrollByAmount = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const step = getCardStep() || el.clientWidth;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
    triggerHaptic("light");
    pauseAutoScroll();
  };

  useEffect(() => {
    if (matches.length <= 1 || isPaused || tabFading) return;
    const interval = setInterval(() => {
      const el = scrollRef.current;
      if (!el) return;
      const step = getCardStep();
      if (step <= 0) return;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      el.scrollTo({ left: atEnd ? 0 : el.scrollLeft + step, behavior: "smooth" });
    }, 4500);
    return () => clearInterval(interval);
  }, [matches.length, isPaused, tabFading, activeTab, getCardStep]);

  const tabs = [
    { id: "nearby", label: "I närheten", icon: Radar, count: nearbyMatches.length },
    { id: "mine", label: isGuest ? "Kommande" : "Anmäld", icon: UserCheck, count: myMatches.length },
  ];

  const SegmentedControl = () => (
    <div
      role="tablist"
      className="inline-flex items-center gap-0.5 bg-[#0F1513] border border-[#243029] rounded-full p-0.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.35)]"
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
              if (activeTab === tab.id) return;
              triggerHaptic("light");
              setActiveTab(tab.id);
              pauseAutoScroll();
            }}
            className={`relative h-8 px-2.5 sm:px-3 rounded-full text-[12px] sm:text-[13px] font-semibold transition-colors flex items-center gap-1 sm:gap-1.5 whitespace-nowrap ${
              isActive ? "text-white" : "text-[#9EAAA4] hover:text-[#CFE8D6]"
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="segmented-pill"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                className="absolute inset-0 rounded-full bg-[#2BA84A] shadow-[0_4px_12px_rgba(43,168,74,0.45)]"
                aria-hidden
              />
            )}
            <Icon className="w-3.5 h-3.5 relative z-10" strokeWidth={2.5} />
            <span className="relative z-10">{tab.label}</span>
            {tab.count > 0 && (
              <span
                className={`relative z-10 text-[10px] font-bold tabular-nums min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center ${
                  isActive ? "bg-white/25 text-white" : "bg-[#18221E] text-[#B6C2BC]"
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
    <div className="pt-2 sm:pt-3">
      {/* HEADER */}
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 px-1">
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#2BA84A]/20 to-[#2BA84A]/10 rounded-xl flex items-center justify-center">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[#2BA84A]" strokeWidth={2.5} />
          </div>
          <h2 className="hidden sm:block text-xl font-bold text-[#F4F7F5]">Matcher</h2>
        </div>

        <div className="flex-1 flex justify-center min-w-0">
          <SegmentedControl />
        </div>

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
          className="text-[12px] sm:text-sm font-semibold text-[#2BA84A] hover:text-[#CFE8D6] flex items-center gap-0.5 sm:gap-1 transition-colors flex-shrink-0"
        >
          <span className="hidden xs:inline sm:inline">Visa alla</span>
          <span className="xs:hidden sm:hidden">Alla</span>
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
              ? "Inga öppna matcher just nu. Skapa din egen eller kolla in alla matcher."
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
          {/* Edge fades — z-[1] so card hover glows (z-[2]) render above them */}
          <div
            className={`pointer-events-none absolute left-0 top-0 bottom-0 w-6 sm:w-8 bg-gradient-to-r from-[#0F1513] to-transparent z-[1] transition-opacity duration-200 ${
              canScrollLeft ? "opacity-100" : "opacity-0"
            }`}
          />
          <div
            className={`pointer-events-none absolute right-0 top-0 bottom-0 w-6 sm:w-8 bg-gradient-to-l from-[#0F1513] to-transparent z-[1] transition-opacity duration-200 ${
              canScrollRight ? "opacity-100" : "opacity-0"
            }`}
          />

          {/*
            Card widths use CSS only — no JS measurement.
            Mobile:  calc(100% - 3rem) → leaves ~36px of next card peeking
            sm:      calc((100% - 1rem) / 2) → exactly 2 cards
            lg:      calc((100% - 2rem) / 3) → exactly 3 cards
            overflow-x-auto on this container contains horizontal scroll;
            NO overflow-hidden on the wrapper — that was causing page-level misalignment.
          */}
          <div
            ref={scrollRef}
            onTouchStart={pauseAutoScroll}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onFocusCapture={pauseAutoScroll}
            className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory pb-2"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
              opacity: tabFading ? 0 : 1,
              transition: "opacity 0.15s ease",
            }}
          >
            {matches.map((match) => (
              <div
                key={`${activeTab}-${match.id}`}
                className="relative z-[2] flex-shrink-0 snap-start w-[calc(100%-3rem)] sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)]"
              >
                <MatchCard
                  match={match}
                  venues={venues}
                  user={user}
                  participants={(allParticipants || []).filter(
                    (p) => p.match_id === match.id
                  )}
                  onJoin={onJoin}
                />
              </div>
            ))}
          </div>

          {matches.length > 1 && (
            <div className="flex lg:hidden justify-center gap-1.5 mt-3">
              {matches.slice(0, Math.min(matches.length, 8)).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === activeIndex ? "w-5 bg-[#2BA84A]" : "w-1.5 bg-[#2BA84A]/25"
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

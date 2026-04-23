import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import {
  PlayCircle,
  ChevronRight,
  MapPin,
  Plus,
  Users,
  Calendar,
  Flame,
  Activity,
} from "lucide-react";
import { triggerHaptic } from "../utils/motionTokens";

/**
 * DashboardHero — the signature "above the fold" moment of the app.
 *
 * Design principles (world-class):
 *   1. Content hierarchy > decoration. One loud CTA, everything else is quiet.
 *   2. Ambient data, not empty icons — show live signal (matches nearby, activity).
 *   3. Responsive by design: single-column on mobile, 2-column on desktop.
 *   4. Dark, confident background. Accent color is earned, not sprayed.
 *   5. Motion is restrained — a single shimmer on the CTA, orbs in background.
 */
export default function DashboardHero({
  user,
  isGuest,
  nearbyCount = 0,
  myMatchesCount = 0,
  onCreateMatch,
}) {
  const firstName = (user?.display_name || user?.full_name || "").split(" ")[0] || "Spelare";
  const greeting = getGreeting();
  const hasLiveSignal = nearbyCount > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-[22px] sm:rounded-[26px] lg:rounded-[32px] border border-white/[0.06]"
      style={{
        background:
          "radial-gradient(120% 140% at 0% 0%, #0F2A18 0%, #0A1A10 40%, #050A07 100%)",
        boxShadow:
          "0 24px 60px rgba(0,0,0,0.65), 0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      {/* ─── Background layers ────────────────────────────── */}

      {/* Pitch lines — ultra-subtle */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.035] pointer-events-none"
        viewBox="0 0 400 300"
        preserveAspectRatio="none"
        aria-hidden
      >
        <rect x="10" y="20" width="380" height="260" fill="none" stroke="white" strokeWidth="1.5" />
        <circle cx="200" cy="150" r="42" fill="none" stroke="white" strokeWidth="1.5" />
        <line x1="200" y1="20" x2="200" y2="280" stroke="white" strokeWidth="1.5" />
      </svg>

      {/* Grain */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />

      {/* Single large ambient orb — subtle, never distracting */}
      <motion.div
        animate={{ opacity: [0.5, 0.75, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-32 -right-24 w-[380px] h-[380px] sm:w-[480px] sm:h-[480px] rounded-full blur-[120px] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(43,168,74,0.35) 0%, transparent 65%)" }}
      />

      {/* Hairline top highlight */}
      <div
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.14) 50%, transparent 90%)" }}
      />

      {/* ─── Content ──────────────────────────────────────── */}
      <div className="relative z-10 p-5 sm:p-7 lg:p-9">
        {/* Header row: greeting + live chip — always side-by-side */}
        <div className="flex items-start justify-between gap-4 mb-6 sm:mb-7 lg:mb-8">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="absolute -inset-1 bg-[#2BA84A]/20 rounded-[18px] blur-md pointer-events-none" />
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-2xl overflow-hidden ring-1 ring-white/15 bg-gradient-to-br from-white/[0.06] to-black/40 flex items-center justify-center shadow-[0_8px_20px_rgba(0,0,0,0.55)]">
                {user?.profile_image_url ? (
                  <img src={user.profile_image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-base sm:text-lg lg:text-xl font-black text-white">
                    {firstName[0]?.toUpperCase() || "U"}
                  </span>
                )}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] text-[#86EFAC]/80">
                  {greeting}
                </span>
              </div>
              <h1 className="text-[22px] sm:text-[26px] lg:text-[32px] leading-[1.1] font-black text-white tracking-[-0.02em] truncate">
                {firstName}
              </h1>
            </div>
          </div>

          {/* Live signal chip — only when there's actual signal */}
          {hasLiveSignal && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="flex-shrink-0 hidden sm:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-full bg-[#2BA84A]/15 ring-1 ring-[#2BA84A]/35 backdrop-blur-sm"
            >
              <span className="relative flex w-1.5 h-1.5">
                <span className="absolute inline-flex w-full h-full rounded-full bg-[#34C257] animate-ping opacity-75" />
                <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-[#34C257]" />
              </span>
              <span className="text-[11px] font-bold text-[#86EFAC]">
                {nearbyCount} {nearbyCount === 1 ? "match" : "matcher"} nära dig
              </span>
            </motion.div>
          )}
        </div>

        {/* Primary CTA — the one thing that matters */}
        <Link to={createPageUrl("Matches")} className="block group">
          <motion.div
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="relative overflow-hidden rounded-2xl sm:rounded-[20px] p-[1px]"
            style={{
              background:
                "linear-gradient(135deg, rgba(52,194,87,0.5), rgba(52,194,87,0.1) 40%, rgba(244,116,59,0.3))",
            }}
          >
            <div
              className="relative rounded-[calc(1rem-1px)] sm:rounded-[19px] px-4 sm:px-6 py-4 sm:py-5 flex items-center gap-3 sm:gap-4 overflow-hidden"
              style={{
                background:
                  "linear-gradient(180deg, #34C257 0%, #2BA84A 55%, #1E7A36 100%)",
                boxShadow: "0 12px 32px rgba(43,168,74,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
              }}
            >
              {/* Shimmer */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2.5, ease: "easeInOut" }}
                style={{
                  background:
                    "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.25) 50%, transparent 60%)",
                }}
              />

              <div className="relative flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white/20 backdrop-blur-sm ring-1 ring-white/25 flex items-center justify-center">
                <PlayCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} />
              </div>

              <div className="relative flex-1 min-w-0 text-left">
                <div className="text-[15px] sm:text-[17px] lg:text-[18px] font-black text-white leading-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
                  Hitta en match nu
                </div>
                <div className="text-[11px] sm:text-[12px] text-white/85 font-medium leading-snug mt-0.5">
                  {hasLiveSignal
                    ? `${nearbyCount} öppna matcher väntar`
                    : "Utforska öppna matcher i närheten"}
                </div>
              </div>

              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                className="relative flex-shrink-0"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={3} />
              </motion.div>
            </div>
          </motion.div>
        </Link>

        {/* Secondary actions — quiet, symmetric, never competing with CTA */}
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5 mt-3 sm:mt-4">
          <SecondaryAction
            to={createPageUrl("Map")}
            icon={MapPin}
            label="Planer"
            sublabel="Karta"
            accentColor="#86EFAC"
          />
          <SecondaryAction
            onClick={() => {
              triggerHaptic("medium");
              onCreateMatch?.();
            }}
            icon={Plus}
            label="Skapa"
            sublabel="Ny match"
            accentColor="#FED7AA"
          />
          <SecondaryAction
            to={createPageUrl("Community")}
            icon={Users}
            label="Community"
            sublabel={myMatchesCount > 0 ? `${myMatchesCount} anmälda` : "Vänner & lag"}
            accentColor="#DDD6FE"
          />
        </div>
      </div>
    </motion.div>
  );
}

// ── Secondary action (quiet, clean) ──────────────────────────
function SecondaryAction({ to, onClick, icon: Icon, label, sublabel, accentColor }) {
  const content = (
    <motion.div
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className="group relative h-full rounded-xl sm:rounded-2xl px-2.5 sm:px-3 py-2.5 sm:py-3 bg-white/[0.03] hover:bg-white/[0.06] ring-1 ring-white/[0.08] hover:ring-white/[0.16] transition-all cursor-pointer backdrop-blur-sm"
    >
      <div className="flex items-center gap-2 sm:gap-2.5">
        <div
          className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center"
          style={{
            background: `${accentColor}15`,
            boxShadow: `inset 0 0 0 1px ${accentColor}25`,
          }}
        >
          <Icon
            className="w-4 h-4 sm:w-[18px] sm:h-[18px]"
            style={{ color: accentColor }}
            strokeWidth={2.4}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[12px] sm:text-[13px] font-bold text-white leading-tight truncate">
            {label}
          </div>
          <div className="text-[10px] sm:text-[11px] text-white/50 leading-tight truncate mt-0.5">
            {sublabel}
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (to) return <Link to={to}>{content}</Link>;
  return <button onClick={onClick} className="text-left">{content}</button>;
}

// ── Time-based greeting ──────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return "Sent på kvällen";
  if (h < 10) return "God morgon";
  if (h < 13) return "God förmiddag";
  if (h < 17) return "God eftermiddag";
  if (h < 22) return "God kväll";
  return "God natt";
}
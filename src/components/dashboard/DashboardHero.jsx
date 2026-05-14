import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { MapPin, Plus, Users, ArrowRight, PlayCircle } from "lucide-react";
import { triggerHaptic } from "../utils/motionTokens";

/**
 * AllPlay Signature Hero
 * ────────────────────────────────────────────────────────────
 * The hero IS the pitch. Not a decoration — the structure.
 *
 * Mobile-first spacing (8pt grid):
 *   Outer padding: 20/24 mobile → 28/32 tablet → 40/44 desktop
 *   Vertical rhythm: 20 → 28 → 36 between blocks
 *
 * Typography:
 *   Eyebrow:  11/12 uppercase tracked, white/55
 *   Display:  30/38/46 black, -0.03em, tight leading
 *   Body:     13/14 regular, white/65
 *
 * The pitch lines wrap the content — giving every AllPlay
 * screen that unmistakable "football-first" identity.
 */
export default function DashboardHero({
  user,
  isGuest,
  nearbyCount = 0,
  myMatchesCount = 0,
  onCreateMatch,
}) {
  const firstName = getFirstName(user);
  const greeting = getGreeting();
  const hasOpenMatches = nearbyCount > 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-[22px] sm:rounded-[28px] lg:rounded-[32px] border border-white/[0.07]"
      style={{
        background:
          "radial-gradient(140% 110% at 50% 0%, #0F2A18 0%, #0A1C10 45%, #05100A 100%)",
        boxShadow:
          "0 28px 70px rgba(0,0,0,0.7), 0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      {/* ═══ Layer 1: Pitch (the soul of AllPlay) ═══════════ */}
      <PitchPattern />

      {/* ═══ Layer 2: Ambient lighting ══════════════════════ */}
      <div
        aria-hidden
        className="absolute -top-32 -right-28 w-[380px] h-[380px] sm:w-[500px] sm:h-[500px] rounded-full blur-[110px] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(52,194,87,0.4) 0%, rgba(52,194,87,0.1) 40%, transparent 70%)",
          animation: "ambient-breathe 8s ease-in-out infinite",
        }}
      />
      <div
        aria-hidden
        className="absolute -bottom-40 -left-24 w-[320px] h-[320px] rounded-full blur-[100px] pointer-events-none opacity-50"
        style={{
          background: "radial-gradient(circle, rgba(244,116,59,0.22) 0%, transparent 65%)",
        }}
      />

      {/* Noise for tactility */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />

      {/* Top hairline */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)",
        }}
      />

      {/* Deep bottom vignette for CTA legibility */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none"
        style={{
          background: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.35) 100%)",
        }}
      />

      {/* ═══ Layer 3: Content ═══════════════════════════════ */}
      <div className="relative z-10 px-5 pt-6 pb-5 sm:px-8 sm:pt-8 sm:pb-7 lg:px-11 lg:pt-10 lg:pb-9">
        {/* ─── Top bar: greeting only, clean ─────────────── */}
        <header className="flex items-center gap-2.5 mb-7 sm:mb-9 lg:mb-11">
          <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] overflow-hidden ring-1 ring-white/12 bg-gradient-to-br from-white/[0.08] to-black/40 flex items-center justify-center flex-shrink-0 shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[13px] font-black text-white">
                {firstName[0]?.toUpperCase() || "U"}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55 leading-none">
              {greeting}
            </div>
            <div className="mt-1 text-[13px] sm:text-[14px] font-bold text-white leading-none truncate">
              {firstName}
            </div>
          </div>
        </header>

        {/* ─── Display headline ─────────────────────────── */}
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-[30px] sm:text-[38px] lg:text-[48px] leading-[1.02] font-black text-white tracking-[-0.03em] drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]"
        >
          Dags att spela,
          <br />
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(95deg, #86EFAC 0%, #34C257 45%, #22C55E 100%)",
            }}
          >
            {firstName}.
          </span>
        </motion.h1>

        {/* ─── Primary CTA ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.45 }}
          className="mt-5 sm:mt-7 lg:mt-8"
        >
          <Link
            to={createPageUrl("Matches")}
            onClick={() => triggerHaptic("light")}
            className="block group"
          >
            <motion.div
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.985 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              className="relative overflow-hidden rounded-2xl sm:rounded-[18px]"
              style={{
                background:
                  "linear-gradient(180deg, #3BD163 0%, #2BA84A 55%, #1E7A36 100%)",
                boxShadow:
                  "0 14px 36px rgba(43,168,74,0.45), 0 2px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(0,0,0,0.2)",
              }}
            >
              <motion.div
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
                style={{
                  background:
                    "linear-gradient(105deg, transparent 42%, rgba(255,255,255,0.28) 50%, transparent 58%)",
                }}
              />

              <div className="relative flex items-center gap-3 px-5 sm:px-6 py-[14px] sm:py-[18px]">
                <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20 ring-1 ring-white/30 backdrop-blur-sm flex items-center justify-center shadow-inner">
                  <PlayCircle className="w-[18px] h-[18px] sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <div className="text-[15px] sm:text-[16.5px] font-black text-white leading-tight tracking-[-0.01em]">
                    Hitta en match nu
                  </div>
                  <div className="text-[11px] sm:text-[12px] text-white/85 font-medium leading-tight mt-0.5">
                    {hasOpenMatches ? `${nearbyCount} öppna matcher väntar` : "Utforska alla öppna matcher"}
                  </div>
                </div>

                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                  className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/15 flex items-center justify-center"
                >
                  <ArrowRight className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-white" strokeWidth={2.8} />
                </motion.div>
              </div>
            </motion.div>
          </Link>
        </motion.div>

        {/* ─── Secondary rail ───────────────────────────── */}
        <motion.nav
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mt-4 sm:mt-5 grid grid-cols-3 gap-2 sm:gap-2.5"
          aria-label="Snabbnavigering"
        >
          <QuickTile
            to={createPageUrl("Map")}
            icon={MapPin}
            label="Planer"
            accent="#86EFAC"
          />
          <QuickTile
            onClick={() => {
              triggerHaptic("medium");
              onCreateMatch?.();
            }}
            icon={Plus}
            label="Skapa"
            accent="#FDBA74"
          />
          <QuickTile
            to={createPageUrl("Community")}
            icon={Users}
            label="Vänner"
            accent="#C4B5FD"
          />
        </motion.nav>
      </div>
    </motion.section>
  );
}

// ═══════════════════════════════════════════════════════════
// Pitch pattern — the signature. Full pitch with goal boxes.
// Viewed from above, horizontal orientation: goals on left & right.
// ═══════════════════════════════════════════════════════════
function PitchPattern() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id="pitchLineFade" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.16" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.11" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.06" />
        </linearGradient>
        <radialGradient id="pitchCenterGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#34C257" stopOpacity="0.22" />
          <stop offset="60%" stopColor="#34C257" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#34C257" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Outer pitch boundary */}
      <rect
        x="8" y="14" width="384" height="272"
        fill="none" stroke="url(#pitchLineFade)" strokeWidth="1.5" rx="4"
      />

      {/* Center line */}
      <line x1="200" y1="14" x2="200" y2="286" stroke="url(#pitchLineFade)" strokeWidth="1.5" />

      {/* Center circle glow + ring */}
      <circle cx="200" cy="150" r="44" fill="url(#pitchCenterGlow)" />
      <circle cx="200" cy="150" r="44" fill="none" stroke="url(#pitchLineFade)" strokeWidth="1.5" />
      <circle cx="200" cy="150" r="2" fill="#ffffff" fillOpacity="0.18" />

      {/* ── LEFT side ─────────────────────────── */}
      {/* Penalty box (large) */}
      <rect
        x="8" y="70" width="66" height="160"
        fill="none" stroke="url(#pitchLineFade)" strokeWidth="1.5"
      />
      {/* Goal box (small) */}
      <rect
        x="8" y="112" width="24" height="76"
        fill="none" stroke="url(#pitchLineFade)" strokeWidth="1.5"
      />
      {/* Penalty arc */}
      <path
        d="M 74 130 A 22 22 0 0 1 74 170"
        fill="none" stroke="url(#pitchLineFade)" strokeWidth="1.5"
      />
      {/* Penalty spot */}
      <circle cx="54" cy="150" r="1.6" fill="#ffffff" fillOpacity="0.18" />
      {/* Goal (outside the pitch) */}
      <rect
        x="2" y="134" width="6" height="32"
        fill="none" stroke="url(#pitchLineFade)" strokeWidth="1.5"
      />

      {/* ── RIGHT side ────────────────────────── */}
      {/* Penalty box (large) */}
      <rect
        x="326" y="70" width="66" height="160"
        fill="none" stroke="url(#pitchLineFade)" strokeWidth="1.5"
      />
      {/* Goal box (small) */}
      <rect
        x="368" y="112" width="24" height="76"
        fill="none" stroke="url(#pitchLineFade)" strokeWidth="1.5"
      />
      {/* Penalty arc */}
      <path
        d="M 326 130 A 22 22 0 0 0 326 170"
        fill="none" stroke="url(#pitchLineFade)" strokeWidth="1.5"
      />
      {/* Penalty spot */}
      <circle cx="346" cy="150" r="1.6" fill="#ffffff" fillOpacity="0.18" />
      {/* Goal (outside the pitch) */}
      <rect
        x="392" y="134" width="6" height="32"
        fill="none" stroke="url(#pitchLineFade)" strokeWidth="1.5"
      />

      {/* Corner arcs */}
      <path d="M 8 18 A 4 4 0 0 1 12 14" fill="none" stroke="url(#pitchLineFade)" strokeWidth="1.2" />
      <path d="M 388 14 A 4 4 0 0 1 392 18" fill="none" stroke="url(#pitchLineFade)" strokeWidth="1.2" />
      <path d="M 12 286 A 4 4 0 0 1 8 282" fill="none" stroke="url(#pitchLineFade)" strokeWidth="1.2" />
      <path d="M 392 282 A 4 4 0 0 1 388 286" fill="none" stroke="url(#pitchLineFade)" strokeWidth="1.2" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════
// Quick-nav tile
// ═══════════════════════════════════════════════════════════
function QuickTile({ to, onClick, icon: Icon, label, accent }) {
  const body = (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      className="group relative h-full rounded-2xl px-2 py-3 sm:py-3.5 bg-white/[0.04] hover:bg-white/[0.07] ring-1 ring-white/[0.07] hover:ring-white/[0.14] backdrop-blur-sm transition-colors cursor-pointer overflow-hidden"
    >
      {/* Subtle accent wash on hover */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${accent}12 0%, transparent 60%)`,
        }}
      />

      <div className="relative flex flex-col items-center justify-center gap-1.5 sm:gap-2">
        <div
          className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center"
          style={{
            background: `${accent}18`,
            boxShadow: `inset 0 0 0 1px ${accent}28`,
          }}
        >
          <Icon
            className="w-4 h-4 sm:w-[17px] sm:h-[17px]"
            style={{ color: accent }}
            strokeWidth={2.5}
          />
        </div>
        <div className="text-[12px] sm:text-[13px] font-black text-white leading-none text-center">
          {label}
        </div>
      </div>
    </motion.div>
  );

  if (to) return <Link to={to}>{body}</Link>;
  return (
    <button onClick={onClick} className="block w-full text-left">
      {body}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════
function getFirstName(user) {
  const name = user?.display_name || user?.full_name || "";
  return name.split(" ")[0] || "Spelare";
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return "Sent på natten";
  if (h < 10) return "God morgon";
  if (h < 13) return "Förmiddag";
  if (h < 17) return "Eftermiddag";
  if (h < 22) return "Kväll";
  return "God natt";
}
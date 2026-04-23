import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { MapPin, Plus, Users, ArrowUpRight, Zap } from "lucide-react";
import { triggerHaptic } from "../utils/motionTokens";

/**
 * DashboardHero — "hero moment" of the app.
 *
 * Design system (mobile-first, 8pt spacing grid):
 *   - Vertical rhythm: 24 → 32 → 40 between major sections
 *   - Horizontal padding: 20 mobile, 28 tablet, 40 desktop
 *   - Typography scale: 13/15/28/36 — narrow, readable
 *   - Color: deep black-green canvas, single green accent, zero color clutter
 *   - Motion: one subtle ambient breath, shimmer on primary CTA, nothing else
 *   - Hierarchy: eyebrow → display name → status line → CTA → quick-nav
 *
 * What makes this "world-class":
 *   1. Generous negative space — breathing room is luxury
 *   2. Typography does the heavy lifting, not gradients
 *   3. Live data replaces decorative icons (status line is real info)
 *   4. Quick-nav is a horizontal rail (native-feeling on mobile)
 *   5. Primary CTA is visually distinct but not aggressive
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
  const statusLine = getStatusLine({ nearbyCount, myMatchesCount, isGuest });

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-[24px] sm:rounded-[28px] lg:rounded-[32px] border border-white/[0.06]"
      style={{
        // Deep, moody canvas — authored gradient, not default
        background:
          "radial-gradient(130% 100% at 0% 0%, #12311C 0%, #0B1F12 38%, #06100A 78%, #030706 100%)",
        boxShadow:
          "0 30px 70px rgba(0,0,0,0.7), 0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      {/* ─── Ambient layers ─────────────────────────────── */}

      {/* Single breathing orb — restraint > excess */}
      <motion.div
        aria-hidden
        animate={{ opacity: [0.45, 0.7, 0.45] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-40 -right-32 w-[360px] h-[360px] sm:w-[460px] sm:h-[460px] lg:w-[560px] lg:h-[560px] rounded-full blur-[100px] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(52,194,87,0.38) 0%, rgba(52,194,87,0.08) 45%, transparent 70%)",
        }}
      />

      {/* Faint secondary orb for depth */}
      <div
        aria-hidden
        className="absolute -bottom-40 -left-20 w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] rounded-full blur-[110px] pointer-events-none opacity-60"
        style={{
          background:
            "radial-gradient(circle, rgba(244,116,59,0.18) 0%, transparent 65%)",
        }}
      />

      {/* Noise texture — tactile, premium */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.035] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />

      {/* Hairline top highlight */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.14) 50%, transparent 100%)",
        }}
      />

      {/* ─── Content ────────────────────────────────────── */}
      {/*
        Spacing intent:
          Mobile: 24/20 outer, 24 between blocks, 16 within blocks
          Tablet: 32/28 outer, 28 between blocks
          Desktop: 40/40 outer, 32 between blocks
      */}
      <div className="relative z-10 px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
        {/* ── Block 1: Identity row ─────────────────────── */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
            {/* Avatar — smaller, more refined (40/44/48) */}
            <div className="relative flex-shrink-0">
              <div
                aria-hidden
                className="absolute -inset-[3px] rounded-[15px] opacity-60"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(52,194,87,0.5), transparent 50%, rgba(52,194,87,0.2))",
                  filter: "blur(6px)",
                }}
              />
              <div className="relative w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-xl overflow-hidden ring-1 ring-white/15 bg-gradient-to-br from-white/[0.08] to-black/40 flex items-center justify-center shadow-[0_6px_16px_rgba(0,0,0,0.5)]">
                {user?.profile_image_url ? (
                  <img src={user.profile_image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm sm:text-base font-black text-white">
                    {firstName[0]?.toUpperCase() || "U"}
                  </span>
                )}
              </div>
            </div>

            <div className="min-w-0">
              <div className="text-[11px] sm:text-[12px] font-medium tracking-wide text-white/50 leading-none mb-1">
                {greeting}
              </div>
              <div className="text-[15px] sm:text-[16px] font-bold text-white leading-none truncate">
                {firstName}
              </div>
            </div>
          </div>

          {/* Top-right: streak/activity pulse — only if real signal */}
          {nearbyCount > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex-shrink-0 flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-[#2BA84A]/[0.12] ring-1 ring-[#2BA84A]/25 backdrop-blur-sm"
            >
              <span className="relative flex w-1.5 h-1.5" aria-hidden>
                <span className="absolute inline-flex w-full h-full rounded-full bg-[#34C257] opacity-60 animate-ping" />
                <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-[#34C257]" />
              </span>
              <span className="text-[11px] font-bold text-[#86EFAC] tabular-nums">
                {nearbyCount} live
              </span>
            </motion.div>
          )}
        </div>

        {/* ── Block 2: Headline ──────────────────────────
            Generous margin-top (32 mobile, 40 desktop) — this is the "breath" */}
        <div className="mt-8 sm:mt-10 lg:mt-12">
          <h1 className="text-[28px] sm:text-[34px] lg:text-[42px] leading-[1.05] font-black text-white tracking-[-0.028em] max-w-[16ch]">
            <span className="block text-white/95">Dags att spela.</span>
            <span
              className="block mt-0.5 bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(95deg, #34C257 0%, #86EFAC 60%, #34C257 100%)",
              }}
            >
              {firstName}.
            </span>
          </h1>

          {/* Status line — real data, not fluff */}
          <p className="mt-3 sm:mt-3.5 text-[13px] sm:text-[14px] lg:text-[15px] text-white/60 leading-relaxed max-w-[36ch]">
            {statusLine}
          </p>
        </div>

        {/* ── Block 3: Primary CTA ───────────────────────
            32px top margin — visual rest between headline and action */}
        <Link
          to={createPageUrl("Matches")}
          onClick={() => triggerHaptic("light")}
          className="group mt-6 sm:mt-7 lg:mt-8 block"
        >
          <motion.div
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.985 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            className="relative overflow-hidden rounded-2xl"
            style={{
              background:
                "linear-gradient(180deg, #3BD163 0%, #2BA84A 55%, #1E7A36 100%)",
              boxShadow:
                "0 10px 28px rgba(43,168,74,0.38), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.18)",
            }}
          >
            {/* Shimmer */}
            <motion.div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut" }}
              style={{
                background:
                  "linear-gradient(105deg, transparent 42%, rgba(255,255,255,0.28) 50%, transparent 58%)",
              }}
            />

            <div className="relative flex items-center gap-3 px-5 sm:px-6 py-4 sm:py-[18px]">
              <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20 ring-1 ring-white/25 backdrop-blur-sm flex items-center justify-center">
                <Zap className="w-[18px] h-[18px] sm:w-5 sm:h-5 text-white" strokeWidth={2.6} fill="white" />
              </div>

              <div className="flex-1 min-w-0 text-left">
                <div className="text-[15px] sm:text-[16px] font-black text-white leading-tight tracking-[-0.01em]">
                  Hitta en match
                </div>
                <div className="text-[11px] sm:text-[12px] text-white/85 font-medium leading-tight mt-0.5">
                  {nearbyCount > 0 ? `${nearbyCount} öppna matcher nu` : "Utforska alla matcher"}
                </div>
              </div>

              <motion.div
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                className="flex-shrink-0"
              >
                <ArrowUpRight className="w-5 h-5 text-white" strokeWidth={2.8} />
              </motion.div>
            </div>
          </motion.div>
        </Link>

        {/* ── Block 4: Quick-nav rail ────────────────────
            20px top margin — keep close to CTA (they're related actions)
            Divider line above for visual separation without a heavy border */}
        <div className="mt-6 sm:mt-7 lg:mt-8">
          <div
            aria-hidden
            className="h-px mb-4 sm:mb-5"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.08) 70%, transparent)",
            }}
          />

          <nav className="grid grid-cols-3 gap-1.5 sm:gap-2" aria-label="Snabbnavigering">
            <QuickLink
              to={createPageUrl("Map")}
              icon={MapPin}
              label="Planer"
              accent="#34C257"
            />
            <QuickLink
              onClick={() => {
                triggerHaptic("medium");
                onCreateMatch?.();
              }}
              icon={Plus}
              label="Skapa"
              accent="#FB923C"
            />
            <QuickLink
              to={createPageUrl("Community")}
              icon={Users}
              label="Community"
              accent="#A78BFA"
              badge={myMatchesCount > 0 ? myMatchesCount : null}
            />
          </nav>
        </div>
      </div>
    </motion.section>
  );
}

// ─── Quick-nav pill ─────────────────────────────────────────
function QuickLink({ to, onClick, icon: Icon, label, accent, badge }) {
  const body = (
    <motion.div
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 420, damping: 26 }}
      className="group relative flex items-center justify-center gap-2 h-11 sm:h-12 px-2 sm:px-3 rounded-xl bg-white/[0.035] hover:bg-white/[0.07] ring-1 ring-white/[0.06] hover:ring-white/[0.12] transition-colors cursor-pointer"
    >
      <Icon
        className="w-4 h-4 sm:w-[18px] sm:h-[18px] flex-shrink-0 transition-colors"
        style={{ color: accent }}
        strokeWidth={2.4}
      />
      <span className="text-[12px] sm:text-[13px] font-semibold text-white/85 group-hover:text-white truncate">
        {label}
      </span>
      {badge != null && (
        <span
          className="flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-white/15 text-[10px] font-black text-white flex items-center justify-center tabular-nums"
        >
          {badge}
        </span>
      )}
    </motion.div>
  );

  if (to) return <Link to={to}>{body}</Link>;
  return <button onClick={onClick} className="block text-left">{body}</button>;
}

// ─── Helpers ────────────────────────────────────────────────
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

function getStatusLine({ nearbyCount, myMatchesCount, isGuest }) {
  if (isGuest) {
    return "Utforska matcher och planer. Logga in för att gå med.";
  }
  if (nearbyCount > 0 && myMatchesCount > 0) {
    return `Du har ${myMatchesCount} kommande ${myMatchesCount === 1 ? "match" : "matcher"} och ${nearbyCount} öppna nära dig.`;
  }
  if (nearbyCount > 0) {
    return `${nearbyCount} öppna ${nearbyCount === 1 ? "match" : "matcher"} i närheten — hoppa in och spela.`;
  }
  if (myMatchesCount > 0) {
    return `${myMatchesCount} kommande ${myMatchesCount === 1 ? "match" : "matcher"} anmäld. Ladda upp.`;
  }
  return "Inga matcher just nu — skapa en eller utforska planer nära dig.";
}
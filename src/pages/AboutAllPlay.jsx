import React, { useState } from "react";
import { useSEO } from "@/components/hooks/useSEO";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Instagram, ExternalLink, ChevronDown, ChevronUp, FileText, Music2, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { POLICY_SECTIONS } from "@/components/legal/policyText";

/* ── Fade-in wrapper ── */
function FadeIn({ delay = 0, children, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Collapsible policy block ── */
function PolicyBlock() {
  const [open, setOpen] = useState(false);
  return (
    <FadeIn delay={0.85}>
      <div className="bg-[#121715] border border-[#223029] rounded-2xl overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between p-6 sm:p-8 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#9370DB]/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-[#9370DB]" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#F4F7F5]">User Policy</h2>
              <p className="text-sm text-[#B6C2BC] mt-0.5">Terms of Use & Privacy Policy</p>
            </div>
          </div>
          {open
            ? <ChevronUp className="w-5 h-5 text-[#7B8A83] flex-shrink-0" />
            : <ChevronDown className="w-5 h-5 text-[#7B8A83] flex-shrink-0" />}
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="px-6 sm:px-8 pb-6 sm:pb-8 space-y-4 max-h-[60vh] overflow-y-auto">
                {POLICY_SECTIONS.map((s, i) => {
                  if (s.type === 'title')
                    return <h3 key={i} className="text-lg font-bold text-[#F4F7F5] pt-2">{s.text}</h3>;
                  if (s.type === 'heading')
                    return <h4 key={i} className="text-base font-semibold text-[#2BA84A] pt-4">{s.text}</h4>;
                  if (s.type === 'intro' || s.type === 'paragraph')
                    return <p key={i} className="text-sm text-[#B6C2BC] leading-relaxed">{s.text}</p>;
                  if (s.type === 'list')
                    return (
                      <ul key={i} className="space-y-2 pl-4">
                        {s.items.map((item, j) => (
                          <li key={j} className="text-sm text-[#B6C2BC] leading-relaxed list-disc ml-2">{item}</li>
                        ))}
                      </ul>
                    );
                  if (s.type === 'divider')
                    return <hr key={i} className="border-[#223029] my-4" />;
                  return null;
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </FadeIn>
  );
}

const STEPS = [
  { num: '1', title: 'Find pitches', text: 'See football pitches near you via real-time GPS.' },
  { num: '2', title: 'Create a match', text: 'Choose a format (5v5, 7v7, etc.) and set a date and time.' },
  { num: '3', title: 'Join a match', text: 'See matches already happening near you and join with one tap.' },
  { num: '4', title: 'Skill matching', text: 'Play with players at a similar level — more fun for everyone.' },
  { num: '5', title: 'Safe environment', text: 'Phone verification and a reporting feature protect the community.' },
];

export default function AboutAllPlay() {
  useSEO({
    title: 'About AllPlay UF',
    description: 'AllPlay UF is a non-profit youth association connecting football players across Sweden.',
    canonicalPath: '/aboutallplay',
  });

  return (
    <div className="min-h-screen bg-[#0A0E0C] pb-28 lg:pb-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Back */}
        <Link to={createPageUrl('Dashboard')}>
          <motion.button
            whileHover={{ x: -4 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 text-[#B6C2BC] hover:text-[#F4F7F5] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </motion.button>
        </Link>

        {/* ── HERO ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-[28px] border border-white/10"
          style={{ boxShadow: '0 28px 72px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)' }}
        >
          <div className="relative h-72 sm:h-[420px] lg:h-[520px] overflow-hidden">
            <motion.img
              src="/matija.jpg"
              alt="Matija Cvitic — Founder of AllPlay"
              className="w-full h-full object-cover object-top"
              initial={{ scale: 1.08 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E0C] via-[#0A0E0C]/40 to-transparent" />
            <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl opacity-60" style={{ background: 'rgba(43,168,74,0.28)' }} />
            <div className="pointer-events-none absolute -bottom-20 -left-20 w-80 h-80 rounded-full blur-3xl opacity-60" style={{ background: 'rgba(244,116,59,0.20)' }} />

            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="absolute top-6 left-6 sm:top-8 sm:left-8"
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-xl ring-1 ring-white/15 text-[11px] font-extrabold uppercase tracking-[0.16em] text-white/95">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34C257] animate-pulse" />
                About AllPlay
              </span>
            </motion.div>
          </div>

          <div className="relative -mt-36 sm:-mt-44 px-6 pb-8 sm:px-10 sm:pb-12">
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-[42px] sm:text-[64px] lg:text-[76px] font-black text-white leading-[0.95] tracking-[-0.03em] mb-4 drop-shadow-[0_10px_30px_rgba(0,0,0,0.7)]"
            >
              Football,{' '}
              <span className="text-[#34C257]">for everyone.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              className="text-[15px] sm:text-lg text-white/80 leading-relaxed max-w-2xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]"
            >
              AllPlay makes spontaneous football simple, safe, and accessible. Find pitches, create matches, and join games in your area — in seconds.
            </motion.p>
          </div>
        </motion.div>

        {/* ── WHAT IS ALLPLAY ───────────────────────────── */}
        <FadeIn delay={0.2}>
          <div className="bg-[#121715] border border-[#223029] rounded-2xl p-6 sm:p-8 shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#F4F7F5] mb-3">What is AllPlay?</h2>
            <p className="text-base text-[#B6C2BC] leading-relaxed">
              AllPlay is a digital platform that connects players, pitches, and neighbourhoods through GPS, skill-matching, and social interaction. The app lets you play football any time, anywhere — no membership or complicated sign-ups required.
            </p>
          </div>
        </FadeIn>

        {/* ── WHY ALLPLAY ───────────────────────────────── */}
        <FadeIn delay={0.3}>
          <div className="bg-gradient-to-br from-[#2BA84A]/10 to-[#248232]/5 border border-[#2BA84A]/30 rounded-2xl p-6 sm:p-8 shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#F4F7F5] mb-3">Why we built AllPlay</h2>
            <p className="text-base text-[#B6C2BC] leading-relaxed">
              Football is the world's most inclusive sport, but spontaneous football is disappearing. Pitches sit empty while young people want to play more but lack teams, times, or social connections. The cost of club football has risen sharply, sedentary lifestyles are increasing, and sport is becoming a class issue.
            </p>
            <div
              className="mt-5 px-5 py-4 rounded-xl"
              style={{ background: 'rgba(43,168,74,0.08)', borderLeft: '3px solid #2BA84A' }}
            >
              <p className="text-[#2BA84A] font-semibold text-sm sm:text-base italic leading-relaxed">
                "AllPlay exists to lower the barriers — so everyone can play, regardless of background, money, or connections."
              </p>
            </div>
          </div>
        </FadeIn>

        {/* ── HOW IT WORKS ──────────────────────────────── */}
        <FadeIn delay={0.4}>
          <div className="bg-[#121715] border border-[#223029] rounded-2xl p-6 sm:p-8 shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#F4F7F5] mb-6">How AllPlay works</h2>
            <div className="relative space-y-0">
              <div
                className="absolute left-[19px] top-8 bottom-8 w-px hidden sm:block"
                style={{ background: 'linear-gradient(to bottom, #2BA84A44, #2BA84A11)' }}
              />
              {STEPS.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.08 }}
                  className="flex items-start gap-4 py-3.5"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-black text-sm relative z-10"
                    style={{
                      background: 'linear-gradient(135deg, #2BA84A, #248232)',
                      boxShadow: '0 4px 14px rgba(43,168,74,0.35)',
                      color: 'white',
                    }}
                  >
                    {step.num}
                  </div>
                  <div className="pt-2">
                    <p className="font-semibold text-[#F4F7F5] text-sm sm:text-base leading-tight">{step.title}</p>
                    <p className="text-sm text-[#7B8A83] mt-0.5 leading-relaxed">{step.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* ── FOUNDER ───────────────────────────────────── */}
        <FadeIn delay={0.55}>
          <div className="bg-[#121715] border border-[#223029] rounded-2xl overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
            {/* Header */}
            <div className="px-6 sm:px-8 pt-6 sm:pt-8 pb-0">
              <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-[#2BA84A]/15 text-[#2BA84A] mb-3">
                Solo Founder
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#F4F7F5]">The person behind AllPlay</h2>
            </div>

            {/* Founder card */}
            <div className="p-6 sm:p-8">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 }}
                className="flex flex-col sm:flex-row gap-6 items-start"
              >
                {/* Photo */}
                <div className="flex-shrink-0 mx-auto sm:mx-0">
                  <div
                    className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden"
                    style={{ boxShadow: '0 8px 32px rgba(43,168,74,0.20), 0 2px 8px rgba(0,0,0,0.5)' }}
                  >
                    <img
                      src="/matija.jpg"
                      alt="Matija Cvitic"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-xl sm:text-2xl font-bold text-[#F4F7F5] leading-tight">Matija Cvitic</h3>
                  <div className="flex items-center gap-2 mt-1.5 justify-center sm:justify-start">
                    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold tracking-wide bg-[#2BA84A]/15 text-[#2BA84A]">
                      Founder & CEO
                    </span>
                  </div>
                  <p className="mt-4 text-[15px] text-[#B6C2BC] leading-relaxed">
                    Matija built AllPlay from scratch to make spontaneous football accessible to everyone. Driven by a genuine love for the game and a belief that sport should have no barriers, he designs, develops, and runs the entire platform solo — from backend infrastructure to the last pixel of the UI.
                  </p>
                  <p className="mt-3 text-[15px] text-[#B6C2BC] leading-relaxed">
                    Based in Stockholm, AllPlay started as a youth enterprise project at Norra Real and has grown into a real product used by players across Sweden.
                  </p>
                </div>
              </motion.div>
            </div>

            <div
              className="mx-6 sm:mx-8 mb-6 sm:mb-8 px-5 py-4 rounded-xl"
              style={{ background: 'rgba(43,168,74,0.06)', borderLeft: '3px solid #2BA84A' }}
            >
              <p className="text-[#2BA84A] font-semibold text-sm sm:text-base italic leading-relaxed">
                "One person, one mission — make football easy for everyone."
              </p>
            </div>
          </div>
        </FadeIn>

        {/* ── VISION ────────────────────────────────────── */}
        <FadeIn delay={0.7}>
          <div className="bg-[#121715] border border-[#223029] rounded-2xl p-6 sm:p-8 shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#F4F7F5] mb-3">Our vision</h2>
            <p className="text-base text-[#B6C2BC] leading-relaxed">
              The vision is to make playing football as easy as opening a social media app. AllPlay aims to become the Nordic platform for spontaneous sport — where football, and eventually more sports, bring people together across neighbourhoods and backgrounds.
            </p>
            <p className="text-base text-[#B6C2BC] leading-relaxed mt-3">
              For municipalities, AllPlay is a modern tool for public health, integration, and safer evenings. For you as a player, it's the freedom to play whenever you want, with whoever you want.
            </p>
          </div>
        </FadeIn>

        {/* ── POLICY ────────────────────────────────────── */}
        <PolicyBlock />

        {/* ── SOCIAL LINKS ──────────────────────────────── */}
        <FadeIn delay={0.9}>
          <div className="bg-[#121715] border border-[#223029] rounded-2xl p-6 sm:p-8 shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#F4F7F5] mb-2">Follow along</h2>
            <p className="text-sm text-[#7B8A83] mb-5">Keep up with AllPlay for updates, matches, and events.</p>

            <div className="space-y-3">
              {/* Instagram */}
              <a
                href="https://www.instagram.com/allplayuf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 rounded-2xl group transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{ background: 'linear-gradient(135deg, rgba(193,53,132,0.12), rgba(131,58,180,0.08))', border: '1px solid rgba(193,53,132,0.25)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)', boxShadow: '0 4px 14px rgba(131,58,180,0.35)' }}
                  >
                    <Instagram className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#F4F7F5] text-sm">Instagram</p>
                    <p className="text-xs text-[#7B8A83]">@allplayuf</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-[#7B8A83] group-hover:text-white transition-colors" />
              </a>

              {/* TikTok */}
              <a
                href="https://www.tiktok.com/@allplay.uf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 rounded-2xl group transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-black"
                    style={{ boxShadow: '0 4px 14px rgba(0,0,0,0.5)' }}
                  >
                    <Music2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#F4F7F5] text-sm">TikTok</p>
                    <p className="text-xs text-[#7B8A83]">@allplay.uf</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-[#7B8A83] group-hover:text-white transition-colors" />
              </a>

              {/* LinkedIn */}
              <a
                href="https://www.linkedin.com/company/allplay-uf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 rounded-2xl group transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{ background: 'rgba(10,102,194,0.10)', border: '1px solid rgba(10,102,194,0.25)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: '#0A66C2', boxShadow: '0 4px 14px rgba(10,102,194,0.35)' }}
                  >
                    <Linkedin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#F4F7F5] text-sm">LinkedIn</p>
                    <p className="text-xs text-[#7B8A83]">AllPlay UF</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-[#7B8A83] group-hover:text-white transition-colors" />
              </a>
            </div>
          </div>
        </FadeIn>

      </div>
    </div>
  );
}

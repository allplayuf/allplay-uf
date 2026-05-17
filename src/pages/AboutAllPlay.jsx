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
              <h2 className="text-xl sm:text-2xl font-bold text-[#F4F7F5]">Användarpolicy</h2>
              <p className="text-sm text-[#B6C2BC] mt-0.5">Användarvillkor & Integritetspolicy</p>
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
  { num: '1', title: 'Hitta planer', text: 'Se fotbollsplaner nära dig via GPS i realtid.' },
  { num: '2', title: 'Skapa en match', text: 'Välj format (5v5, 7v7 m.m.) och sätt ut datum och tid.' },
  { num: '3', title: 'Gå med i en match', text: 'Se matcher som redan pågår nära dig och join med ett klick.' },
  { num: '4', title: 'Nivåmatchning', text: 'Hamna med spelare på liknande nivå — roligare för alla.' },
  { num: '5', title: 'Trygg miljö', text: 'Mobilverifiering och rapporteringsfunktion skyddar gemenskapen.' },
];

const TEAM = [
  { name: 'Isak Landström',   role: 'CMO',  image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68dbdc9e123473250628e807/598d84457_P1090552.jpg' },
  { name: 'Matija Cvitic',    role: 'CEO',  image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68dbdc9e123473250628e807/f63c59c55_P1090553.jpg' },
  { name: 'Joong-seop Hong',  role: 'CTO',  image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68dbdc9e123473250628e807/9a7654026_P1090555.jpg' },
  { name: 'Iris Waldenborg',  role: 'COO',  image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68dbdc9e123473250628e807/d19e7d62a_P1090565.jpg' },
  { name: 'Simon Halef Schmidt', role: 'CFO', image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68dbdc9e123473250628e807/1be963c95_P1090576.jpg' },
];

export default function AboutAllPlay() {
  useSEO({
    title: 'Om AllPlay UF',
    description: 'AllPlay UF är en ideell ungdomsförening som kopplar ihop fotbollsspelare i Sverige.',
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
            <span className="font-medium">Tillbaka</span>
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
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68dbdc9e123473250628e807/afd97d702_P10905801.jpg"
              alt="AllPlay Team"
              className="w-full h-full object-cover"
              initial={{ scale: 1.08 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E0C] via-[#0A0E0C]/55 to-transparent" />
            <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl opacity-70" style={{ background: 'rgba(43,168,74,0.28)' }} />
            <div className="pointer-events-none absolute -bottom-20 -left-20 w-80 h-80 rounded-full blur-3xl opacity-70" style={{ background: 'rgba(244,116,59,0.20)' }} />

            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="absolute top-6 left-6 sm:top-8 sm:left-8"
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-xl ring-1 ring-white/15 text-[11px] font-extrabold uppercase tracking-[0.16em] text-white/95">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34C257] animate-pulse" />
                Om AllPlay
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
              Fotboll,{' '}
              <span className="text-[#34C257]">för alla.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              className="text-[15px] sm:text-lg text-white/80 leading-relaxed max-w-2xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]"
            >
              AllPlay gör spontanfotboll enkel, trygg och tillgänglig. Hitta planer, skapa matcher och gå med i spel i ditt närområde — på några sekunder.
            </motion.p>
          </div>
        </motion.div>

        {/* ── WHAT IS ALLPLAY ───────────────────────────── */}
        <FadeIn delay={0.2}>
          <div className="bg-[#121715] border border-[#223029] rounded-2xl p-6 sm:p-8 shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#F4F7F5] mb-3">Vad är AllPlay?</h2>
            <p className="text-base text-[#B6C2BC] leading-relaxed">
              AllPlay är en digital plattform som kopplar ihop spelare, planer och stadsdelar genom GPS, nivåmatchning och social interaktion. Appen gör det möjligt att spela fotboll när som helst, var som helst, utan medlemskap eller krångliga anmälningar.
            </p>
          </div>
        </FadeIn>

        {/* ── WHY ALLPLAY ───────────────────────────────── */}
        <FadeIn delay={0.3}>
          <div className="bg-gradient-to-br from-[#2BA84A]/10 to-[#248232]/5 border border-[#2BA84A]/30 rounded-2xl p-6 sm:p-8 shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#F4F7F5] mb-3">Varför vi startade AllPlay</h2>
            <p className="text-base text-[#B6C2BC] leading-relaxed">
              Fotboll är världens mest inkluderande sport, men spontanfotbollen håller på att försvinna. Planerna står ofta tomma samtidigt som många unga vill spela mer men saknar lag, tider eller sociala kontakter. Kostnaderna för föreningsfotboll har ökat kraftigt, stillasittandet ökar och idrott håller på att bli en klassfråga.
            </p>
            <div
              className="mt-5 px-5 py-4 rounded-xl"
              style={{ background: 'rgba(43,168,74,0.08)', borderLeft: '3px solid #2BA84A' }}
            >
              <p className="text-[#2BA84A] font-semibold text-sm sm:text-base italic leading-relaxed">
                "AllPlay finns för att sänka trösklarna — så att alla kan spela, oavsett bakgrund, pengar eller nätverk."
              </p>
            </div>
          </div>
        </FadeIn>

        {/* ── HOW IT WORKS ──────────────────────────────── */}
        <FadeIn delay={0.4}>
          <div className="bg-[#121715] border border-[#223029] rounded-2xl p-6 sm:p-8 shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#F4F7F5] mb-6">Så funkar AllPlay</h2>
            <div className="relative space-y-0">
              {/* Vertical connector line */}
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

        {/* ── TEAM ──────────────────────────────────────── */}
        <FadeIn delay={0.55}>
          <div className="bg-gradient-to-br from-[#F4743B]/10 to-[#E5683A]/5 border border-[#F4743B]/30 rounded-2xl p-6 sm:p-8 shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#F4F7F5] mb-1">Teamet bakom AllPlay</h2>
              <p className="text-sm text-[#B6C2BC]">Norra Real · Stockholm</p>
            </div>

            {/* Grid: 2 cols, 5th centered below */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              {TEAM.slice(0, 4).map((m, i) => (
                <motion.div
                  key={m.name}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.65 + i * 0.07 }}
                  className="flex flex-col items-center gap-3 p-4 bg-[#121715] rounded-2xl"
                >
                  <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-[#F4743B]/30 flex-shrink-0">
                    <img src={m.image} alt={m.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-[#F4F7F5] text-sm leading-tight">{m.name}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-[#F4743B]/15 text-[#F4743B]">
                      {m.role}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* 5th member centered */}
            <div className="flex justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.65 + 4 * 0.07 }}
                className="flex flex-col items-center gap-3 p-4 bg-[#121715] rounded-2xl w-[calc(50%-6px)]"
              >
                <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-[#F4743B]/30 flex-shrink-0">
                  <img src={TEAM[4].image} alt={TEAM[4].name} className="w-full h-full object-cover" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-[#F4F7F5] text-sm leading-tight">{TEAM[4].name}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-[#F4743B]/15 text-[#F4743B]">
                    {TEAM[4].role}
                  </span>
                </div>
              </motion.div>
            </div>

            <p className="mt-6 text-sm text-[#B6C2BC] leading-relaxed italic text-center">
              Vi delar en enkel idé: fotbollen ska vara tillgänglig för alla, inte bara de som redan är inne i föreningslivet.
            </p>
          </div>
        </FadeIn>

        {/* ── VISION ────────────────────────────────────── */}
        <FadeIn delay={0.7}>
          <div className="bg-[#121715] border border-[#223029] rounded-2xl p-6 sm:p-8 shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#F4F7F5] mb-3">Vår vision</h2>
            <p className="text-base text-[#B6C2BC] leading-relaxed">
              Vår vision är att göra det lika enkelt att spela fotboll som att öppna en social media-app. AllPlay ska bli Nordens ledande plattform för spontanidrott — där fotboll, och på sikt fler sporter, samlar människor över stadsdels- och bakgrundsgränser.
            </p>
            <p className="text-base text-[#B6C2BC] leading-relaxed mt-3">
              För kommuner vill vi vara ett modernt verktyg för folkhälsa, integration och tryggare kvällsmiljöer. För dig som spelare är AllPlay friheten att spela när du vill, med vem du vill.
            </p>
          </div>
        </FadeIn>

        {/* ── POLICY ────────────────────────────────────── */}
        <PolicyBlock />

        {/* ── SOCIAL LINKS ──────────────────────────────── */}
        <FadeIn delay={0.9}>
          <div className="bg-[#121715] border border-[#223029] rounded-2xl p-6 sm:p-8 shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#F4F7F5] mb-2">Häng med oss</h2>
            <p className="text-sm text-[#7B8A83] mb-5">Följ AllPlay för uppdateringar, matcher och events.</p>

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
                <ExternalLink className="w-4 h-4 text-[#7B8A83] group-hover:text-[#0A66C2] transition-colors" />
              </a>
            </div>
          </div>
        </FadeIn>

      </div>
    </div>
  );
}

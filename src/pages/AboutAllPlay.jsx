import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Globe, Instagram, Music, ExternalLink, Users, Target, Zap, Shield, MapPin, Calendar, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { POLICY_SECTIONS } from "@/components/legal/policyText";

function PolicyBlock() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.85 }}
      className="bg-[#121715] border border-[#223029] rounded-2xl overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-6 sm:p-8 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#9370DB]/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-[#9370DB]" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#F4F7F5]">Användarpolicy</h2>
            <p className="text-sm text-[#B6C2BC] mt-0.5">Användarvillkor & Integritetspolicy</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-[#7B8A83] flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-[#7B8A83] flex-shrink-0" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-6 sm:px-8 pb-6 sm:pb-8 space-y-4 max-h-[60vh] overflow-y-auto">
              {POLICY_SECTIONS.map((section, i) => {
                if (section.type === "title") {
                  return <h3 key={i} className="text-lg font-bold text-[#F4F7F5] pt-2">{section.text}</h3>;
                }
                if (section.type === "heading") {
                  return <h4 key={i} className="text-base font-semibold text-[#2BA84A] pt-4">{section.text}</h4>;
                }
                if (section.type === "intro" || section.type === "paragraph") {
                  return <p key={i} className="text-sm text-[#B6C2BC] leading-relaxed">{section.text}</p>;
                }
                if (section.type === "list") {
                  return (
                    <ul key={i} className="space-y-2 pl-4">
                      {section.items.map((item, j) => (
                        <li key={j} className="text-sm text-[#B6C2BC] leading-relaxed list-disc ml-2">{item}</li>
                      ))}
                    </ul>
                  );
                }
                if (section.type === "divider") {
                  return <hr key={i} className="border-[#223029] my-4" />;
                }
                return null;
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function AboutAllPlay() {
  return (
    <div className="min-h-screen bg-[#0A0E0C] pb-24 lg:pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-7">
        
        {/* Back Button */}
        <Link to={createPageUrl("Dashboard")}>
          <motion.button
            whileHover={{ x: -4 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 text-[#B6C2BC] hover:text-[#F4F7F5] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Tillbaka</span>
          </motion.button>
        </Link>

        {/* Hero Section — Premium cinematic */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-[28px] border border-white/10"
          style={{
            boxShadow:
              '0 28px 72px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          {/* Cinematic image with layered gradients */}
          <div className="relative h-72 sm:h-[420px] lg:h-[520px] overflow-hidden">
            <motion.img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68dbdc9e123473250628e807/afd97d702_P10905801.jpg"
              alt="AllPlay Team"
              className="w-full h-full object-cover"
              initial={{ scale: 1.08 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            />
            {/* Bottom fade for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E0C] via-[#0A0E0C]/60 to-transparent" />
            {/* Green accent wash */}
            <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl"
              style={{ background: 'rgba(43,168,74,0.28)' }}
            />
            {/* Orange accent wash */}
            <div className="pointer-events-none absolute -bottom-20 -left-20 w-80 h-80 rounded-full blur-3xl"
              style={{ background: 'rgba(244,116,59,0.20)' }}
            />

            {/* Floating eyebrow */}
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
          
          {/* Title overlay */}
          <div className="relative -mt-36 sm:-mt-44 px-6 pb-8 sm:px-10 sm:pb-12">
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-[42px] sm:text-[64px] lg:text-[76px] font-black text-white leading-[0.95] tracking-[-0.03em] mb-4 drop-shadow-[0_10px_30px_rgba(0,0,0,0.7)]"
            >
              Fotboll, <span className="text-[#34C257]">för alla.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              className="text-[15px] sm:text-lg text-white/85 leading-relaxed max-w-2xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]"
            >
              AllPlay gör spontanfotboll enkel, trygg och tillgänglig. Hitta planer, skapa matcher och gå med i spel i ditt närområde — på några sekunder.
            </motion.p>
          </div>
        </motion.div>

        {/* What is AllPlay */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#121715] border border-[#223029] rounded-2xl p-6 sm:p-8 shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-[#F4F7F5] mb-4">
            Vad är AllPlay?
          </h2>
          <p className="text-base text-[#B6C2BC] leading-relaxed">
            AllPlay är en digital plattform som kopplar ihop spelare, planer och stadsdelar genom GPS, nivåmatchning och social interaktion. Appen gör det möjligt att spela fotboll när som helst, var som helst, utan medlemskap eller krångliga anmälningar.
          </p>
        </motion.div>

        {/* Why AllPlay Exists */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-[#2BA84A]/10 to-[#248232]/5 border border-[#2BA84A]/30 rounded-2xl p-6 sm:p-8 shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-[#F4F7F5] mb-4">
            Varför vi startade AllPlay
          </h2>
          <p className="text-base text-[#B6C2BC] leading-relaxed">
            Fotboll är världens mest inkluderande sport, men spontanfotbollen håller på att försvinna. Planerna står ofta tomma samtidigt som många unga vill spela mer men saknar lag, tider eller sociala kontakter. Kostnaderna för föreningsfotboll har ökat kraftigt, stillasittandet ökar och idrott håller på att bli en klassfråga. AllPlay finns för att sänka trösklarna – så att alla kan spela, oavsett bakgrund, pengar eller nätverk.
          </p>
        </motion.div>

        {/* How it Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#121715] border border-[#223029] rounded-2xl p-6 sm:p-8 shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-[#F4F7F5] mb-6">
            Så funkar AllPlay
          </h2>
          <div className="space-y-4">
            {[
              { icon: MapPin, text: "Hitta fotbollsplaner via GPS i ditt område." },
              { icon: Calendar, text: "Skapa matcher på sekunder och välj spelformat, till exempel 5v5 eller 7v7." },
              { icon: Users, text: "Gå med i matcher som redan är skapade i närheten." },
              { icon: Target, text: "Nivåbaserad matchning gör att du hamnar med spelare på liknande nivå." },
              { icon: Shield, text: "Verifiering via mobilnummer och rapporteringsfunktion skapar en trygg miljö, särskilt för yngre spelare." }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-start gap-3 p-4 bg-[#18221E] rounded-xl"
              >
                <div className="w-10 h-10 bg-[#2BA84A]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-[#2BA84A]" strokeWidth={2.5} />
                </div>
                <p className="text-[#B6C2BC] leading-relaxed pt-2">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Team Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-br from-[#F4743B]/10 to-[#E5683A]/5 border border-[#F4743B]/30 rounded-2xl p-6 sm:p-8 shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-[#F4F7F5] mb-4">
            Teamet bakom AllPlay
          </h2>
          <p className="text-base text-[#B6C2BC] mb-6">
            AllPlay utvecklas av ett team från Norra Real i Stockholm:
          </p>
          
          <div className="grid gap-4 mb-6">
            {[
              { name: "Isak Landström", role: "CMO (marknadschef)", image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68dbdc9e123473250628e807/598d84457_P1090552.jpg" },
              { name: "Matija Cvitic", role: "CEO (verkställande direktör)", image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68dbdc9e123473250628e807/f63c59c55_P1090553.jpg" },
              { name: "Joong-seop Hong", role: "CTO (teknisk chef)", image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68dbdc9e123473250628e807/9a7654026_P1090555.jpg" },
              { name: "Iris Waldenborg", role: "COO (operativ chef)", image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68dbdc9e123473250628e807/d19e7d62a_P1090565.jpg" },
              { name: "Simon Halef Schmidt", role: "CFO (ekonomichef)", image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68dbdc9e123473250628e807/1be963c95_P1090576.jpg" }
            ].map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="flex items-center gap-4 p-4 bg-[#121715] rounded-xl"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#F4743B] to-[#E5683A] rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0 ring-2 ring-[#F4743B]/30">
                  <img 
                    src={member.image} 
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-[#F4F7F5] text-base sm:text-lg">{member.name}</h3>
                  <p className="text-sm sm:text-base text-[#B6C2BC]">{member.role}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <p className="text-base text-[#B6C2BC] leading-relaxed italic">
            Vi delar en enkel idé: fotbollen ska vara tillgänglig för alla, inte bara de som redan är inne i föreningslivet.
          </p>
        </motion.div>

        {/* Vision */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-[#121715] border border-[#223029] rounded-2xl p-6 sm:p-8 shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-[#F4F7F5] mb-4">
            Vår vision
          </h2>
          <p className="text-base text-[#B6C2BC] leading-relaxed">
            Vår vision är att göra det lika enkelt att spela fotboll som att öppna en social media-app. AllPlay ska bli Nordens ledande plattform för spontanidrott – där fotboll, och på sikt fler sporter, samlar människor över stadsdels- och bakgrundsgränser. För kommuner vill vi vara ett modernt verktyg för folkhälsa, integration och tryggare kvällsmiljöer. För dig som spelare är AllPlay friheten att spela när du vill, med vem du vill.
          </p>
        </motion.div>

        {/* Policy Section */}
        <PolicyBlock />

        {/* Social Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-gradient-to-br from-[#2BA84A]/10 to-[#248232]/5 border border-[#2BA84A]/30 rounded-2xl p-6 sm:p-8 shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-[#F4F7F5] mb-4">
            Häng med oss vidare
          </h2>
          <p className="text-base text-[#B6C2BC] mb-6">
            Följ AllPlay i sociala medier för uppdateringar, matcher och events.
          </p>
          
          <div className="space-y-3">
            <a 
              href="https://www.instagram.com/allplayuf" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-[#121715] rounded-xl hover:bg-[#18221E] transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#F4743B]/20 rounded-lg flex items-center justify-center">
                  <Instagram className="w-5 h-5 text-[#F4743B]" />
                </div>
                <div>
                  <p className="font-semibold text-[#F4F7F5]">Instagram</p>
                  <p className="text-sm text-[#B6C2BC]">@allplayuf</p>
                </div>
              </div>
              <ExternalLink className="w-5 h-5 text-[#B6C2BC] group-hover:text-[#F4743B] transition-colors" />
            </a>

            <a 
              href="https://www.tiktok.com/@allplay.uf" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-[#121715] rounded-xl hover:bg-[#18221E] transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#9370DB]/20 rounded-lg flex items-center justify-center">
                  <Music className="w-5 h-5 text-[#9370DB]" />
                </div>
                <div>
                  <p className="font-semibold text-[#F4F7F5]">TikTok</p>
                  <p className="text-sm text-[#B6C2BC]">@allplay.uf</p>
                </div>
              </div>
              <ExternalLink className="w-5 h-5 text-[#B6C2BC] group-hover:text-[#9370DB] transition-colors" />
            </a>

            <a 
              href="https://www.linkedin.com/company/allplay-uf" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-[#121715] rounded-xl hover:bg-[#18221E] transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#2BA84A]/20 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-[#2BA84A]" />
                </div>
                <div>
                  <p className="font-semibold text-[#F4F7F5]">LinkedIn</p>
                  <p className="text-sm text-[#B6C2BC]">AllPlay UF</p>
                </div>
              </div>
              <ExternalLink className="w-5 h-5 text-[#B6C2BC] group-hover:text-[#2BA84A] transition-colors" />
            </a>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
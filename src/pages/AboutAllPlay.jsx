import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Globe, Instagram, Music, ExternalLink, Users, Target, Zap, Shield, MapPin, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AboutAllPlay() {
  return (
    <div className="min-h-screen bg-[#0F1513] pb-24 lg:pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        
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

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.4)] border border-[#223029]"
        >
          <div className="relative h-64 sm:h-80 lg:h-96">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68dbdc9e123473250628e807/afd97d702_P10905801.jpg"
              alt="AllPlay Team"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F1513] via-[#0F1513]/60 to-transparent" />
          </div>
          
          <div className="relative -mt-20 px-6 pb-8 sm:px-8 sm:pb-10">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-4 drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]">
              Om AllPlay
            </h1>
            <p className="text-base sm:text-lg text-white/90 leading-relaxed max-w-2xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]">
              AllPlay är en app som gör spontanfotboll enkel, trygg och tillgänglig. På några sekunder kan du hitta planer, skapa matcher och gå med i spel i ditt närområde.
            </p>
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
              { name: "Matija Cvitic", role: "CEO (verkställande direktör)", initial: "M" },
              { name: "Iris Waldenborg", role: "COO (operativ chef)", initial: "I" },
              { name: "Joong-seop Hong", role: "CTO (teknisk chef)", initial: "J" },
              { name: "Isak Landström", role: "CMO (marknadschef)", initial: "I" },
              { name: "Simon Halef Schmidt", role: "CFO (ekonomichef)", initial: "S" }
            ].map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="flex items-center gap-4 p-4 bg-[#121715] rounded-xl"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-[#F4743B] to-[#E5683A] rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-lg">{member.initial}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-[#F4F7F5]">{member.name}</h3>
                  <p className="text-sm text-[#B6C2BC]">{member.role}</p>
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
              href="https://allplayuf.se" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-[#121715] rounded-xl hover:bg-[#18221E] transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#2BA84A]/20 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-[#2BA84A]" />
                </div>
                <div>
                  <p className="font-semibold text-[#F4F7F5]">Webbplats</p>
                  <p className="text-sm text-[#B6C2BC]">allplayuf.se</p>
                </div>
              </div>
              <ExternalLink className="w-5 h-5 text-[#B6C2BC] group-hover:text-[#2BA84A] transition-colors" />
            </a>

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
              href="https://www.tiktok.com/@allplayuf" 
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
                  <p className="text-sm text-[#B6C2BC]">@allplayuf</p>
                </div>
              </div>
              <ExternalLink className="w-5 h-5 text-[#B6C2BC] group-hover:text-[#9370DB] transition-colors" />
            </a>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
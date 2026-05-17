import React from 'react';
import { Calendar, MapPin, Users, Clock, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useT } from "@/i18n/LanguageProvider";

const FORMAT_ACCENT = {
  '5v5':   { color: "#86EFAC", bg: "rgba(43,168,74,0.18)",   border: "rgba(43,168,74,0.35)" },
  '7v7':   { color: "#C4B5FD", bg: "rgba(147,112,219,0.20)", border: "rgba(147,112,219,0.40)" },
  '11v11': { color: "#FDBA74", bg: "rgba(245,158,11,0.18)",  border: "rgba(245,158,11,0.40)" },
};

export default function UpcomingMatches({ matches = [] }) {
  const { t } = useT();

  const fmt = (date, time) => {
    try {
      return format(new Date(`${date}T${time}`), 'EEE d MMM, HH:mm', { locale: sv });
    } catch {
      return `${date} ${time}`;
    }
  };

  return (
    <div
      className="relative overflow-hidden rounded-[22px] border border-[#223029]"
      style={{
        background: "linear-gradient(135deg, #151B18 0%, #111613 55%, #0C100E 100%)",
        boxShadow: "0 6px 18px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent)" }} />

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#2BA84A]/15 ring-1 ring-[#2BA84A]/25">
            <Calendar className="w-4 h-4 text-[#2BA84A]" strokeWidth={2.2} />
          </div>
          <h3 className="font-bold text-[15px] text-[#F4F7F5] tracking-tight">{t('upcoming.title')}</h3>
        </div>
        <span
          className="text-[10px] font-extrabold uppercase tracking-[0.08em] px-2.5 py-1 rounded-full"
          style={{ background: "rgba(43,168,74,0.18)", color: "#86EFAC", border: "1px solid rgba(43,168,74,0.35)" }}
        >
          {matches.length} st
        </span>
      </div>

      {/* Body */}
      {matches.length === 0 ? (
        <div className="px-5 pb-6 pt-2 text-center">
          <div className="w-14 h-14 bg-[#18221E] rounded-2xl flex items-center justify-center mx-auto mb-3 ring-1 ring-[#223029]">
            <Calendar className="w-7 h-7 text-[#4a5550]" strokeWidth={1.8} />
          </div>
          <p className="text-[14px] font-semibold text-[#9EAAA4] mb-1">{t('upcoming.empty_title')}</p>
          <p className="text-[12px] text-[#6B7A73] mb-4">{t('upcoming.empty_desc')}</p>
          <Link to={createPageUrl("Matches")}>
            <button
              className="h-10 px-5 rounded-xl text-white text-[13px] font-bold flex items-center gap-2 mx-auto"
              style={{
                background: "linear-gradient(180deg, #34C257 0%, #2BA84A 55%, #248232 100%)",
                boxShadow: "0 6px 18px rgba(43,168,74,0.32), inset 0 1px 0 rgba(255,255,255,0.18)",
              }}
            >
              <MapPin className="w-4 h-4" strokeWidth={2.4} />
              {t('upcoming.find')}
            </button>
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-[#1a2320]">
          {matches.slice(0, 4).map((match) => {
            const fmt_accent = FORMAT_ACCENT[match.format] || FORMAT_ACCENT['5v5'];
            return (
              <div key={match.id} className="px-5 py-3.5 hover:bg-[#18221E]/60 transition-colors cursor-pointer group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[14px] text-[#F4F7F5] truncate group-hover:text-[#86EFAC] transition-colors">
                      {match.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] text-[#9EAAA4]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#F4743B]" strokeWidth={2.2} />
                        {fmt(match.date, match.time)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-[#34C257]" strokeWidth={2.2} />
                        {match.current_players}/{match.max_players}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span
                        className="text-[10px] font-extrabold uppercase tracking-[0.06em] px-2 py-0.5 rounded-full"
                        style={{ background: fmt_accent.bg, color: fmt_accent.color, border: `1px solid ${fmt_accent.border}` }}
                      >
                        {match.format}
                      </span>
                      {match.is_ranked && (
                        <span className="text-[10px] font-extrabold uppercase tracking-[0.06em] px-2 py-0.5 rounded-full bg-[#FCD34D]/15 text-[#FCD34D] border border-[#FCD34D]/30">
                          {t('upcoming.ranked')}
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#4a5550] group-hover:text-[#86EFAC] transition-colors flex-shrink-0 mt-1" strokeWidth={2.2} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import React from "react";
import { MapPin, Clock, Users, Zap, Info, ExternalLink, Navigation } from "lucide-react";

/**
 * Clean, scannable match details (format, venue, notes, etc.)
 */
export default function MatchDetailsCard({ match, venue }) {
  const mapsUrl = venue?.latitude && venue?.longitude
    ? `https://www.google.com/maps/search/?api=1&query=${venue.latitude},${venue.longitude}`
    : venue?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue.address}, ${venue.city || ""}`)}`
    : null;

  return (
    <div className="rounded-2xl bg-[#121715] ring-1 ring-[#223029] overflow-hidden">
      {/* Venue block with map link */}
      {venue && (
        <a
          href={mapsUrl || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-4 hover:bg-[#18221E] transition-colors border-b border-[#223029] group"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#2BA84A]/12 ring-1 ring-[#2BA84A]/25 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-[#86EFAC]" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-[#9EAAA4] uppercase tracking-widest mb-0.5">Plats</div>
                <div className="text-[15px] font-bold text-[#F4F7F5] truncate">{venue.name}</div>
                {venue.address && (
                  <div className="text-[12px] text-[#9EAAA4] truncate">
                    {venue.address}{venue.city ? `, ${venue.city}` : ""}
                  </div>
                )}
              </div>
            </div>
            {mapsUrl && (
              <div className="flex-shrink-0 h-9 px-3 rounded-lg bg-[#18221E] group-hover:bg-[#223029] ring-1 ring-[#223029] flex items-center gap-1.5 text-[#86EFAC] text-xs font-bold">
                <Navigation className="w-3.5 h-3.5" />
                Vägbeskrivning
              </div>
            )}
          </div>
        </a>
      )}

      {/* Detail rows */}
      <div className="divide-y divide-[#1A201D]">
        <DetailRow icon={Users} label="Format" value={match.format} />
        <DetailRow
          icon={Zap}
          label="Matchtyp"
          value={match.is_spontaneous ? "Spontan match (obegränsat)" : "Organiserad match"}
        />
        <DetailRow
          icon={Clock}
          label="Längd"
          value={`${match.duration_minutes || 90} minuter`}
        />
        {match.skill_bracket && (
          <DetailRow icon={Info} label="Nivå" value={formatSkillLevel(match.skill_bracket)} />
        )}
      </div>

      {/* Notes */}
      {match.notes && (
        <div className="p-4 bg-[#0F1513] border-t border-[#223029]">
          <div className="text-[10px] font-bold text-[#9EAAA4] uppercase tracking-widest mb-2">
            Anteckningar från arrangören
          </div>
          <p className="text-[13px] leading-[20px] text-[#C2CEC8] whitespace-pre-wrap">{match.notes}</p>
        </div>
      )}
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Icon className="w-4 h-4 text-[#5A7468] flex-shrink-0" />
      <span className="text-[12px] text-[#9EAAA4] flex-1">{label}</span>
      <span className="text-[13px] font-semibold text-[#F4F7F5] text-right">{value}</span>
    </div>
  );
}

function formatSkillLevel(level) {
  const map = { beginner: "Nybörjare", intermediate: "Medel", advanced: "Avancerad", elite: "Elit", pro: "Elit", mixed: "Mixad" };
  return map[level] || level;
}
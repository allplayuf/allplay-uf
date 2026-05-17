import React from "react";
import { MapPin, Clock, Users, Zap, Info, ExternalLink, Navigation } from "lucide-react";
import { useT } from "@/i18n/LanguageProvider";

export default function MatchDetailsCard({ match, venue }) {
  const { t } = useT();

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
                <div className="text-[10px] font-bold text-[#9EAAA4] uppercase tracking-widest mb-0.5">{t('details.location')}</div>
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
                {t('details.directions')}
              </div>
            )}
          </div>
        </a>
      )}

      {/* Detail rows */}
      <div className="divide-y divide-[#1A201D]">
        <DetailRow icon={Users} label={t('details.format')} value={match.format} />
        <DetailRow
          icon={Zap}
          label={t('details.match_type')}
          value={match.is_spontaneous ? t('details.spontaneous') : t('details.organized')}
        />
        <DetailRow
          icon={Clock}
          label={t('details.duration')}
          value={t('details.duration_value', { n: match.duration_minutes || 90 })}
        />
        {match.skill_bracket && (
          <DetailRow
            icon={Info}
            label={t('details.level')}
            value={match.skill_bracket === 'mixed'
              ? t('match_hero.level_mixed')
              : t(`profile.skill.${match.skill_bracket}`) || match.skill_bracket
            }
          />
        )}
      </div>

      {/* Notes */}
      {match.notes && (
        <div className="p-4 bg-[#0F1513] border-t border-[#223029]">
          <div className="text-[10px] font-bold text-[#9EAAA4] uppercase tracking-widest mb-2">
            {t('details.organizer_notes')}
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

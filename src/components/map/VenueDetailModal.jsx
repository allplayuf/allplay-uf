import React, { useState, useMemo } from 'react';
import {
  X, MapPin, Navigation, Calendar, Users, CheckCircle, Clock,
  Shield, Plus, ChevronRight, LayoutGrid, Trophy, Sparkles, Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from '@tanstack/react-query';
import { getSubPitches } from '@/components/supabase/services/subPitchesService';
import { triggerHaptic } from '@/components/utils/motionTokens';

import VenueModalHeader from './detail/VenueModalHeader';
import VenueQuickStats from './detail/VenueQuickStats';
import SubPitchGrid from './detail/SubPitchGrid';
import VenueMatchRow from './detail/VenueMatchRow';
import VenueModalTabs from './detail/VenueModalTabs';

export default function VenueDetailModal({ venue, matches, onClose, onCreateMatch }) {
  // Hooks must run before early return
  const { data: subPitches = [] } = useQuery({
    queryKey: ['sub-pitches', venue?.id],
    queryFn: () => getSubPitches(venue.id),
    enabled: !!venue?.id,
    staleTime: 60_000,
  });

  const [activeTab, setActiveTab] = useState('matches');

  const upcomingMatches = useMemo(
    () => (matches || []).filter(m => m.status === 'upcoming'),
    [matches]
  );
  const ongoingMatches = useMemo(
    () => (matches || []).filter(m => m.status === 'ongoing'),
    [matches]
  );

  const matchesByPitch = useMemo(() => {
    const map = new Map();
    upcomingMatches.forEach(m => {
      // pitch_id is set by Map page when match lives on a sub-pitch.
      // Falls back to venue_id (the parent) if it's not on a sub-pitch.
      const key = m.pitch_id || m.venue_id || venue?.id;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(m);
    });
    return map;
  }, [upcomingMatches, venue?.id]);

  if (!venue) return null;

  const hasSubPitches = subPitches.length > 0;
  const tabs = [
    { id: 'matches', label: 'Matcher', count: upcomingMatches.length, icon: Calendar },
    ...(hasSubPitches ? [{ id: 'pitches', label: 'Planer', count: subPitches.length, icon: LayoutGrid }] : []),
    { id: 'info', label: 'Info', icon: Shield },
  ];

  const handleCreate = (target = venue) => {
    triggerHaptic('medium');
    onCreateMatch(target);
    onClose();
  };

  const handleOpenMaps = () => {
    triggerHaptic('light');
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${venue.latitude},${venue.longitude}`,
      '_blank'
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.97 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full sm:max-w-2xl sm:mx-4"
        >
          <div className="bg-[#121715] border border-[#223029] shadow-[0_24px_64px_rgba(0,0,0,0.6)] rounded-t-[28px] sm:rounded-[24px] max-h-[92vh] overflow-hidden flex flex-col">

            <VenueModalHeader
              venue={venue}
              hasSubPitches={hasSubPitches}
              subPitchCount={subPitches.length}
              onClose={onClose}
            />

            {ongoingMatches.length > 0 && (
              <div className="px-4 sm:px-6 pt-4">
                <div className="p-3 bg-gradient-to-r from-[#FFD700]/15 to-[#F4743B]/10 border border-[#FFD700]/30 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFD700] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FFD700]"></span>
                    </span>
                    <span className="text-[12px] font-bold text-[#FFD700] uppercase tracking-wider">
                      Pågår nu · {ongoingMatches.length}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {ongoingMatches.slice(0, 2).map(match => (
                      <Link
                        key={match.id}
                        to={`${createPageUrl("MatchDetail")}?id=${match.id}`}
                        onClick={onClose}
                        className="flex items-center justify-between gap-2 p-2 bg-[#0F1513]/60 rounded-xl hover:bg-[#0F1513] transition-colors"
                      >
                        <p className="text-sm font-semibold text-[#F4F7F5] truncate">{match.title}</p>
                        <ChevronRight className="w-4 h-4 text-[#FFD700] flex-shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="px-4 sm:px-6 pt-4">
              <VenueQuickStats
                upcomingCount={upcomingMatches.length}
                pitchCount={hasSubPitches ? subPitches.length : (venue.formats_supported?.length || 1)}
                pitchLabel={hasSubPitches ? 'Planer' : 'Format'}
                facilityCount={venue.facilities?.length || 0}
              />
            </div>

            <div className="px-4 sm:px-6 pt-4">
              <VenueModalTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
            </div>

            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
              <AnimatePresence mode="wait">
                {activeTab === 'matches' && (
                  <motion.div
                    key="matches"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    {upcomingMatches.length === 0 ? (
                      <EmptyMatches onCreate={() => handleCreate()} hasSubPitches={hasSubPitches} onPickPitch={() => setActiveTab('pitches')} />
                    ) : hasSubPitches ? (
                      <MatchesGroupedByPitch
                        subPitches={subPitches}
                        matchesByPitch={matchesByPitch}
                        onClose={onClose}
                        onCreateForPitch={handleCreate}
                      />
                    ) : (
                      <MatchesFlat matches={upcomingMatches} onClose={onClose} />
                    )}
                  </motion.div>
                )}

                {activeTab === 'pitches' && hasSubPitches && (
                  <motion.div
                    key="pitches"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <SubPitchGrid
                      subPitches={subPitches}
                      matchesByPitch={matchesByPitch}
                      onSelect={handleCreate}
                    />
                  </motion.div>
                )}

                {activeTab === 'info' && (
                  <motion.div
                    key="info"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    {venue.formats_supported?.length > 0 && (
                      <InfoSection title="Format som stöds" icon={Zap}>
                        <div className="flex flex-wrap gap-2">
                          {venue.formats_supported.map(f => (
                            <span key={f} className="inline-flex h-8 items-center px-3 rounded-full bg-[#2BA84A]/14 text-[#CFE8D6] ring-1 ring-[#2BA84A]/30 text-xs font-bold">
                              {f}
                            </span>
                          ))}
                        </div>
                      </InfoSection>
                    )}

                    {venue.facilities?.length > 0 && (
                      <InfoSection title="Faciliteter" icon={Sparkles}>
                        <div className="grid grid-cols-2 gap-2">
                          {venue.facilities.map(facility => (
                            <div key={facility} className="flex items-center gap-2 p-2.5 bg-[#18221E] rounded-xl border border-[#223029]">
                              <CheckCircle className="w-4 h-4 text-[#2BA84A] flex-shrink-0" />
                              <span className="text-xs text-[#F4F7F5] capitalize">
                                {facility.replace(/_/g, ' ')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </InfoSection>
                    )}

                    <InfoSection title="Plats" icon={MapPin}>
                      <div className="p-3 bg-[#18221E] rounded-xl border border-[#223029]">
                        <p className="text-sm text-[#F4F7F5] font-medium mb-0.5">{venue.address}</p>
                        <p className="text-xs text-[#9EAAA4]">{venue.city}</p>
                      </div>
                    </InfoSection>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div
              className="sticky bottom-0 p-3 sm:p-4 bg-[#121715]/95 backdrop-blur-xl border-t border-[#223029] flex gap-2"
              style={{ paddingBottom: 'max(0.75rem, calc(0.75rem + env(safe-area-inset-bottom)))' }}
            >
              <button
                onClick={() => handleCreate()}
                className="flex-1 h-12 flex items-center justify-center gap-2 rounded-2xl bg-[#F4743B] text-white font-bold hover:bg-[#E5683A] transition-all active:scale-95 shadow-[0_4px_16px_rgba(244,116,59,0.35)]"
              >
                <Plus className="w-5 h-5" />
                {hasSubPitches ? 'Välj plan' : 'Skapa match'}
              </button>
              <button
                onClick={handleOpenMaps}
                aria-label="Öppna i Google Maps"
                className="h-12 w-12 flex items-center justify-center rounded-2xl border border-[#2BA84A]/35 text-[#CFE8D6] hover:bg-[#2BA84A]/10 transition-all active:scale-95"
              >
                <Navigation className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function InfoSection({ title, icon: Icon, children }) {
  return (
    <div>
      <h3 className="text-xs font-bold text-[#9EAAA4] uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-[#2BA84A]" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function MatchesFlat({ matches, onClose }) {
  return (
    <div className="space-y-2">
      {matches.map(match => (
        <VenueMatchRow key={match.id} match={match} onClose={onClose} />
      ))}
    </div>
  );
}

function MatchesGroupedByPitch({ subPitches, matchesByPitch, onClose, onCreateForPitch }) {
  const withMatches = subPitches.filter(p => matchesByPitch.has(p.id));
  const withoutMatches = subPitches.filter(p => !matchesByPitch.has(p.id));

  return (
    <div className="space-y-5">
      {withMatches.map(pitch => {
        const list = matchesByPitch.get(pitch.id) || [];
        return (
          <div key={pitch.id}>
            <div className="flex items-center justify-between gap-2 mb-2">
              <h4 className="text-[12px] font-bold text-[#86EFAC] uppercase tracking-wider truncate">
                {cleanPitchName(pitch.name)}
              </h4>
              <span className="text-[10px] font-bold text-[#9EAAA4] tabular-nums">
                {list.length} {list.length === 1 ? 'match' : 'matcher'}
              </span>
            </div>
            <div className="space-y-2">
              {list.map(match => (
                <VenueMatchRow key={match.id} match={match} onClose={onClose} />
              ))}
            </div>
          </div>
        );
      })}

      {withoutMatches.length > 0 && (
        <div>
          <h4 className="text-[12px] font-bold text-[#9EAAA4] uppercase tracking-wider mb-2">
            Lediga planer
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {withoutMatches.map(p => (
              <button
                key={p.id}
                onClick={() => onCreateForPitch(p)}
                className="text-left p-3 rounded-xl bg-[#18221E] border border-[#223029] hover:border-[#2BA84A]/40 hover:bg-[#1E2724] transition-all group flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="text-[13px] font-bold text-[#F4F7F5] truncate">
                    {cleanPitchName(p.name)}
                  </div>
                  <div className="flex gap-1 mt-1">
                    {(p.formats_supported || []).map(f => (
                      <span key={f} className="text-[10px] font-bold text-[#9EAAA4]">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
                <Plus className="w-4 h-4 text-[#7B8A83] group-hover:text-[#2BA84A] flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyMatches({ onCreate, hasSubPitches, onPickPitch }) {
  return (
    <div className="text-center py-10">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#18221E] border border-[#223029] flex items-center justify-center">
        <Calendar className="w-7 h-7 text-[#2BA84A]/60" />
      </div>
      <h4 className="text-base font-bold text-[#F4F7F5] mb-1">Inga matcher just nu</h4>
      <p className="text-sm text-[#9EAAA4] mb-5">Var först med att starta en match här!</p>
      <button
        onClick={hasSubPitches ? onPickPitch : onCreate}
        className="inline-flex h-11 items-center gap-2 px-5 rounded-2xl bg-[#F4743B] text-white font-bold hover:bg-[#E5683A] transition-all active:scale-95"
      >
        <Plus className="w-4 h-4" />
        {hasSubPitches ? 'Välj plan' : 'Skapa match'}
      </button>
    </div>
  );
}

function cleanPitchName(name) {
  if (!name) return '';
  return name.replace(/^.+?–\s*/, '').trim() || name;
}
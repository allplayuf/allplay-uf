import React, { useState, useMemo } from 'react';
import { Drawer, DrawerContent, DrawerTrigger, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { SlidersHorizontal, Check, X } from "lucide-react";
import { useT } from "@/i18n/LanguageProvider";

/**
 * Premium filter drawer.
 * Uses Drawer (vaul-based) instead of Sheet so it lifts above the bottom nav
 * and respects safe-area insets. Chip-based filters for speed + clarity.
 */
const FORMAT_OPTIONS = [
  { value: 'all', labelKey: 'filter.all' },
  { value: '5v5', label: '5v5' },
  { value: '7v7', label: '7v7' },
  { value: '11v11', label: '11v11' },
];

const DATE_OPTIONS = [
  { value: 'all', labelKey: 'filter.date_all' },
  { value: 'today', labelKey: 'common.today' },
  { value: 'tomorrow', labelKey: 'common.tomorrow' },
  { value: 'week', labelKey: 'filter.date_week' },
];

const LEVEL_OPTIONS = [
  { value: 'all', labelKey: 'filter.all' },
  { value: 'beginner', labelKey: 'profile.skill.beginner' },
  { value: 'intermediate', labelKey: 'profile.skill.intermediate' },
  { value: 'advanced', labelKey: 'profile.skill.advanced' },
  { value: 'elite', labelKey: 'profile.skill.elite' },
];

const SORT_OPTIONS = [
  { value: 'distance', labelKey: 'filter.sort_nearest' },
  { value: 'matches', labelKey: 'filter.sort_bookings' },
];

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 px-3.5 rounded-full text-[12px] font-semibold transition-all flex items-center gap-1.5 ${
        active
          ? 'bg-[#2BA84A] text-white shadow-[0_4px_12px_rgba(43,168,74,0.35)]'
          : 'bg-[#18221E] text-[#B6C2BC] ring-1 ring-[#223029] hover:ring-[#2BA84A]/30 hover:text-[#F4F7F5]'
      }`}
    >
      {active && <Check className="w-3 h-3" strokeWidth={3} />}
      {children}
    </button>
  );
}

function Section({ label, children }) {
  return (
    <div>
      <label className="text-[11px] font-bold text-[#8FA097] uppercase tracking-[0.12em] mb-2.5 block">
        {label}
      </label>
      {children}
    </div>
  );
}

export default function FilterSheet({ filters, onFilterChange }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);

  const activeCount = useMemo(() => {
    let n = 0;
    if (filters.format !== 'all') n++;
    if (filters.date !== 'all') n++;
    if (filters.skillLevel !== 'all') n++;
    if (filters.distance !== 50) n++;
    if (filters.sortBy !== 'distance') n++;
    return n;
  }, [filters]);

  const handleReset = () => {
    onFilterChange({
      format: 'all',
      date: 'all',
      skillLevel: 'all',
      distance: 50,
      sortBy: 'distance',
    });
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button className="relative flex-1 h-10 flex items-center justify-center gap-1.5 bg-[#18221E]/80 border border-[#223029]/60 hover:bg-[#2BA84A]/15 hover:border-[#2BA84A]/30 text-[#F4F7F5] rounded-full transition-all font-semibold text-[12px] uppercase tracking-wide">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filter
          {activeCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#F4743B] text-white text-[10px] font-black flex items-center justify-center ring-2 ring-[#121715] tabular-nums">
              {activeCount}
            </span>
          )}
        </button>
      </DrawerTrigger>

      <DrawerContent className="bg-[#121715] border-t border-[#223029] rounded-t-[24px] max-h-[88vh] focus:outline-none">
        <DrawerHeader className="sr-only">
          <DrawerTitle>{t('filter.title')}</DrawerTitle>
          <DrawerDescription>{t('filter.drawer_desc')}</DrawerDescription>
        </DrawerHeader>

        {/* Custom header with close */}
        <div className="flex items-center justify-between px-5 pt-2 pb-4 border-b border-[#223029]/60">
          <div>
            <h2 className="text-[17px] font-black text-white tracking-tight">{t('filter.title')}</h2>
            {activeCount > 0 && (
              <p className="text-[11px] text-[#8FA097] mt-0.5">
                {t('filter.active_count', { n: activeCount })}
              </p>
            )}
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-9 h-9 rounded-xl bg-[#18221E] hover:bg-[#223029] flex items-center justify-center transition-colors"
            aria-label={t('common.close')}
          >
            <X className="w-4 h-4 text-[#B6C2BC]" />
          </button>
        </div>

        {/* Scrollable body */}
        <div
          className="overflow-y-auto px-5 py-5 space-y-5"
          style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
        >
          <Section label={t('filter.section_format')}>
            <div className="flex flex-wrap gap-2">
              {FORMAT_OPTIONS.map(opt => (
                <Chip
                  key={opt.value}
                  active={filters.format === opt.value}
                  onClick={() => onFilterChange({ ...filters, format: opt.value })}
                >
                  {opt.labelKey ? t(opt.labelKey) : opt.label}
                </Chip>
              ))}
            </div>
          </Section>

          <Section label={t('filter.section_distance', { n: filters.distance })}>
            <div className="px-1 pt-1">
              <Slider
                value={[filters.distance]}
                onValueChange={([v]) => onFilterChange({ ...filters, distance: v })}
                min={1}
                max={100}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-[#7B8A83] mt-2 font-semibold">
                <span>1 km</span>
                <span>50 km</span>
                <span>100 km</span>
              </div>
            </div>
          </Section>

          <Section label={t('filter.section_date')}>
            <div className="flex flex-wrap gap-2">
              {DATE_OPTIONS.map(opt => (
                <Chip
                  key={opt.value}
                  active={filters.date === opt.value}
                  onClick={() => onFilterChange({ ...filters, date: opt.value })}
                >
                  {opt.labelKey ? t(opt.labelKey) : opt.label}
                </Chip>
              ))}
            </div>
          </Section>

          <Section label={t('filter.section_level')}>
            <div className="flex flex-wrap gap-2">
              {LEVEL_OPTIONS.map(opt => (
                <Chip
                  key={opt.value}
                  active={filters.skillLevel === opt.value}
                  onClick={() => onFilterChange({ ...filters, skillLevel: opt.value })}
                >
                  {opt.labelKey ? t(opt.labelKey) : opt.label}
                </Chip>
              ))}
            </div>
          </Section>

          <Section label={t('filter.section_sort')}>
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map(opt => (
                <Chip
                  key={opt.value}
                  active={filters.sortBy === opt.value}
                  onClick={() => onFilterChange({ ...filters, sortBy: opt.value })}
                >
                  {opt.labelKey ? t(opt.labelKey) : opt.label}
                </Chip>
              ))}
            </div>
          </Section>
        </div>

        {/* Sticky footer actions */}
        <div
          className="border-t border-[#223029]/60 px-5 pt-3 pb-3 flex gap-2.5 bg-[#121715]"
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
        >
          <Button
            onClick={handleReset}
            variant="outline"
            className="flex-1 h-11 border-[#223029] text-[#B6C2BC] hover:bg-[#18221E] hover:text-[#F4F7F5] rounded-xl font-semibold text-[13px]"
          >
            {t('filter.reset')}
          </Button>
          <Button
            onClick={() => setOpen(false)}
            className="flex-1 h-11 rounded-xl font-bold text-[13px] text-white"
            style={{
              background: 'linear-gradient(180deg, #34C257 0%, #2BA84A 55%, #248232 100%)',
              boxShadow: '0 6px 18px rgba(43,168,74,0.32)',
            }}
          >
            {t('filter.show_results')}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
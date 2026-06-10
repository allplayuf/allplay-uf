import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer, ComposedChart, BarChart, AreaChart, Bar, Area, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, LabelList,
} from 'recharts';
import { Users, TrendingUp, CalendarCheck, Percent, Activity, UserPlus, RefreshCw, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAdminAnalytics } from '../supabase/services/analyticsService';

// Brand palette
const GREEN = '#28A34A';
const GREEN_SOFT = '#7ED99B';   // tint of brand green for secondary series
const DARK = '#18361D';
const INK = '#06120F';

const num = (v) => (v === null || v === undefined ? null : Number(v));

function formatWeek(isoDate) {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
}

const tooltipStyle = {
  backgroundColor: INK,
  border: `1px solid ${DARK}`,
  borderRadius: 12,
  color: '#F4F7F5',
  fontSize: 12,
};

function KpiCard({ label, value, suffix = '', icon: Icon, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-2xl border border-[#223029] bg-[#121715] p-3 sm:p-4"
      style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 2px 8px rgba(0,0,0,0.25)' }}
    >
      <div aria-hidden className="absolute -top-10 -right-10 w-24 h-24 rounded-full opacity-15 blur-2xl pointer-events-none" style={{ background: GREEN }} />
      <div className="relative flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${GREEN}22`, boxShadow: `inset 0 0 0 1px ${GREEN}44` }}>
          <Icon className="w-4 h-4" style={{ color: GREEN }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#9EAAA4] truncate" title={label}>{label}</div>
          <div className="text-2xl font-black tabular-nums leading-tight mt-0.5 text-[#F4F7F5]">
            {value === null || value === undefined ? '—' : `${value}${suffix}`}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ChartCard({ title, subtitle, children, height = 260 }) {
  return (
    <div className="rounded-2xl border border-[#223029] bg-[#121715] p-4 sm:p-5">
      <div className="mb-3">
        <h3 className="text-[15px] font-bold text-[#F4F7F5]">{title}</h3>
        {subtitle && <p className="text-xs text-[#9EAAA4] mt-0.5">{subtitle}</p>}
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function AdminAnalytics() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: getAdminAnalytics,
    staleTime: 60000,
  });

  const kpis = data?.kpis || {};

  const liquidity = useMemo(() => (data?.weekly_liquidity || []).map((r) => ({
    ...r,
    week: formatWeek(r.week_start),
    fill_rate_pct: num(r.fill_rate_pct),
  })), [data]);

  const funnel = useMemo(() => {
    const rows = data?.activation_funnel || [];
    const totals = rows.reduce(
      (acc, r) => ({
        signups: acc.signups + (num(r.signups) || 0),
        first_match: acc.first_match + (num(r.first_match) || 0),
        second: acc.second + (num(r.second_match_within_7d) || 0),
      }),
      { signups: 0, first_match: 0, second: 0 }
    );
    return [
      { step: 'Registrerade', value: totals.signups },
      { step: 'Första matchen', value: totals.first_match },
      { step: '2:a matchen inom 7 dgr', value: totals.second },
    ];
  }, [data]);

  const retention = useMemo(() => (data?.retention_cohorts || [])
    .map((r) => ({
      ...r,
      week: formatWeek(r.cohort_week),
      d7_pct: num(r.d7_pct),
      d30_pct: num(r.d30_pct),
    }))
    // Only cohorts that have matured past the D7 window are meaningful to plot
    .filter((r) => r.d7_pct !== null), [data]);

  const noShow = useMemo(() => (data?.no_show_weekly || []).map((r) => ({
    ...r,
    week: formatWeek(r.week_start),
    no_show_pct: num(r.no_show_pct),
  })), [data]);

  const venues = data?.top_venues || [];
  const maxVenueMatches = Math.max(1, ...venues.map((v) => num(v.matches_total) || 0));

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[84px] rounded-2xl bg-[#121715] border border-[#223029] animate-pulse" />
          ))}
        </div>
        <div className="h-[300px] rounded-2xl bg-[#121715] border border-[#223029] animate-pulse" />
        <div className="h-[300px] rounded-2xl bg-[#121715] border border-[#223029] animate-pulse" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-[#223029] bg-[#121715] p-8 text-center">
        <BarChart3 className="w-8 h-8 mx-auto mb-3" style={{ color: GREEN }} />
        <p className="text-[#F4F7F5] font-semibold mb-1">Kunde inte ladda statistik</p>
        <p className="text-sm text-[#9EAAA4] mb-4">{error?.message || 'Okänt fel'}</p>
        <Button onClick={() => refetch()} className="bg-[#28A34A] hover:bg-[#218A3E] text-white rounded-xl">
          Försök igen
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <KpiCard index={0} label="Användare" value={num(kpis.total_users)} icon={Users} />
        <KpiCard index={1} label="Nya (30 dgr)" value={num(kpis.new_users_30d)} icon={UserPlus} />
        <KpiCard index={2} label="Aktiva / vecka" value={num(kpis.wau)} icon={Activity} />
        <KpiCard index={3} label="Aktiva / månad" value={num(kpis.mau)} icon={TrendingUp} />
        <KpiCard index={4} label="Kommande matcher" value={num(kpis.upcoming_matches)} icon={CalendarCheck} />
        <KpiCard index={5} label="Fyllnadsgrad 30 dgr" value={num(kpis.fill_rate_30d_pct)} suffix="%" icon={Percent} />
      </div>

      <div className="flex justify-end">
        <Button
          onClick={() => refetch()}
          variant="outline"
          disabled={isFetching}
          className="border-[#223029] bg-[#0F1513]/60 text-[#F4F7F5] hover:bg-[#18221E] rounded-xl h-9 gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          <span className="text-xs font-semibold">Uppdatera statistik</span>
        </Button>
      </div>

      {/* Weekly liquidity & fill rate */}
      <ChartCard
        title="Matchlikviditet per vecka"
        subtitle="Skapade matcher (staplar) och fyllnadsgrad i % av platser (linje), senaste 12 veckorna"
        height={280}
      >
        <ComposedChart data={liquidity} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid stroke={DARK} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="week" tick={{ fill: '#9EAAA4', fontSize: 11 }} axisLine={{ stroke: DARK }} tickLine={false} />
          <YAxis yAxisId="left" tick={{ fill: '#9EAAA4', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <YAxis yAxisId="right" orientation="right" unit="%" domain={[0, 100]} tick={{ fill: '#9EAAA4', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(40,163,74,0.08)' }} />
          <Legend wrapperStyle={{ fontSize: 12, color: '#9EAAA4' }} />
          <Bar yAxisId="left" dataKey="matches_total" name="Matcher" fill={GREEN} radius={[6, 6, 0, 0]} maxBarSize={28} />
          <Bar yAxisId="left" dataKey="matches_finished" name="Spelade" fill={DARK} stroke={`${GREEN}66`} radius={[6, 6, 0, 0]} maxBarSize={28} />
          <Line yAxisId="right" type="monotone" dataKey="fill_rate_pct" name="Fyllnadsgrad %" stroke={GREEN_SOFT} strokeWidth={2.5} dot={{ r: 3, fill: GREEN_SOFT }} connectNulls />
        </ComposedChart>
      </ChartCard>

      {/* Activation funnel */}
      <ChartCard
        title="Aktiveringstratt"
        subtitle="Registrering → första match → andra matchen inom 7 dagar (alla kohorter)"
        height={200}
      >
        <BarChart data={funnel} layout="vertical" margin={{ top: 4, right: 40, left: 8, bottom: 4 }}>
          <CartesianGrid stroke={DARK} strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tick={{ fill: '#9EAAA4', fontSize: 11 }} axisLine={{ stroke: DARK }} tickLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="step" width={150} tick={{ fill: '#B6C2BC', fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(40,163,74,0.08)' }} />
          <Bar dataKey="value" name="Användare" radius={[0, 8, 8, 0]} maxBarSize={26}>
            <LabelList dataKey="value" position="right" fill="#F4F7F5" fontSize={12} fontWeight={700} />
            {funnel.map((_, i) => (
              <Cell key={i} fill={[GREEN, '#1F7A38', DARK][i] || GREEN} stroke={`${GREEN}55`} />
            ))}
          </Bar>
        </BarChart>
      </ChartCard>

      {/* Retention cohorts */}
      <ChartCard
        title="Retention per registreringsvecka"
        subtitle="Andel som är aktiva igen dag 7–13 (D7) respektive dag 30–36 (D30). Endast mogna kohorter visas."
        height={260}
      >
        <BarChart data={retention} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid stroke={DARK} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="week" tick={{ fill: '#9EAAA4', fontSize: 11 }} axisLine={{ stroke: DARK }} tickLine={false} />
          <YAxis unit="%" domain={[0, 100]} tick={{ fill: '#9EAAA4', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(40,163,74,0.08)' }} />
          <Legend wrapperStyle={{ fontSize: 12, color: '#9EAAA4' }} />
          <Bar dataKey="d7_pct" name="D7 %" fill={GREEN} radius={[6, 6, 0, 0]} maxBarSize={22} />
          <Bar dataKey="d30_pct" name="D30 %" fill={GREEN_SOFT} radius={[6, 6, 0, 0]} maxBarSize={22} />
        </BarChart>
      </ChartCard>

      {/* No-show rate */}
      <ChartCard
        title="No-show per vecka"
        subtitle="Anmälda spelare i spelade matcher som aldrig checkade in. (Tills incheckning används brett speglar detta även incheckningsgraden.)"
        height={240}
      >
        <AreaChart data={noShow} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="noShowFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={GREEN} stopOpacity={0.35} />
              <stop offset="100%" stopColor={INK} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={DARK} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="week" tick={{ fill: '#9EAAA4', fontSize: 11 }} axisLine={{ stroke: DARK }} tickLine={false} />
          <YAxis unit="%" domain={[0, 100]} tick={{ fill: '#9EAAA4', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Area type="monotone" dataKey="no_show_pct" name="No-show %" stroke={GREEN} strokeWidth={2.5} fill="url(#noShowFill)" dot={{ r: 3, fill: GREEN }} />
        </AreaChart>
      </ChartCard>

      {/* Top venues */}
      <div className="rounded-2xl border border-[#223029] bg-[#121715] p-4 sm:p-5">
        <div className="mb-3">
          <h3 className="text-[15px] font-bold text-[#F4F7F5]">Mest aktiva planer</h3>
          <p className="text-xs text-[#9EAAA4] mt-0.5">Matcher totalt, senaste 30 dagarna och unika spelare</p>
        </div>
        {venues.length === 0 ? (
          <p className="text-sm text-[#9EAAA4] py-4 text-center">Inga matcher kopplade till planer ännu.</p>
        ) : (
          <div className="space-y-2.5">
            {venues.map((v, i) => {
              const total = num(v.matches_total) || 0;
              return (
                <div key={v.venue_id || i} className="flex items-center gap-3">
                  <div className="w-6 text-right text-xs font-bold tabular-nums" style={{ color: i < 3 ? GREEN : '#9EAAA4' }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-semibold text-[#F4F7F5] truncate">{v.name}</span>
                      <span className="text-xs text-[#9EAAA4] flex-shrink-0 tabular-nums">
                        {total} matcher · {num(v.matches_30d) || 0} senaste 30 dgr · {num(v.unique_players) || 0} spelare
                      </span>
                    </div>
                    <div className="h-1.5 mt-1 rounded-full overflow-hidden" style={{ background: DARK }}>
                      <div className="h-full rounded-full" style={{ width: `${(total / maxVenueMatches) * 100}%`, background: GREEN }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {data?.generated_at && (
        <p className="text-[11px] text-[#9EAAA4] text-center">
          Datan genererades {new Date(data.generated_at).toLocaleString('sv-SE')}
        </p>
      )}
    </div>
  );
}

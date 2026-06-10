import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronRight, Check, MapPin, Zap, Users, Trophy } from 'lucide-react';
import LoginModal from '@/components/supabase/LoginModal';
import { useSupabaseAuth } from '@/components/supabase/AuthProvider';
import { base44 } from '@/api/base44Client';
import { triggerHaptic } from '@/components/utils/motionTokens';
import { useT } from '@/i18n/LanguageProvider';
import { track } from '@/lib/analytics';

export const ONBOARDING_STORAGE_KEY = 'allplay_onboarding_completed_v3';
export const ONBOARDING_EVENT = 'allplay:show-onboarding';

const LOGO_URL = '/allplay-logo.png';

const SLIDES = [
  { id: 'hero' },
  { id: 'map' },
  { id: 'join' },
  { id: 'auth' },
];

// Spring used for the slide card itself
const cardSpring = { type: 'spring', stiffness: 320, damping: 32, mass: 0.9 };
// Easing curve used everywhere — Apple-style ease-out
const easeOutExpo = [0.16, 1, 0.3, 1];

// ─── Pitch stage ──────────────────────────────────────────────────────────────
// A living stadium background: striped pitch, markings, animated floodlight
// sweep, drifting fog, and a ball that traces a slow arc across the field.
// Parallaxes subtly with `slideIndex` to feel connected across screens.

function PitchStage({ slideIndex }) {
  const reduced = useReducedMotion();

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Base gradient — deep stadium night */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 80% at 50% -10%, #0F2D18 0%, #081B0E 55%, #050F08 100%)',
        }}
      />

      {/* Pitch with parallax shift */}
      <motion.div
        className="absolute inset-0"
        animate={{ y: -slideIndex * 8, scale: 1 + slideIndex * 0.01 }}
        transition={{ duration: 0.9, ease: easeOutExpo }}
      >
        <svg
          viewBox="0 0 100 160"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 w-full h-full"
        >
          {/* Mowing stripes */}
          {Array.from({ length: 16 }, (_, i) => (
            <rect
              key={i}
              x={0}
              y={i * 10}
              width={100}
              height={10}
              fill={i % 2 === 0 ? '#0C2412' : '#0E2A15'}
            />
          ))}

          {/* Markings */}
          <g stroke="rgba(255,255,255,0.10)" strokeWidth="0.4" fill="none">
            <rect x="5" y="5" width="90" height="150" />
            <line x1="5" y1="80" x2="95" y2="80" />
            <circle cx="50" cy="80" r="13" />
            <rect x="24" y="5" width="52" height="22" />
            <rect x="36" y="5" width="28" height="9" />
            <rect x="24" y="133" width="52" height="22" />
            <rect x="36" y="146" width="28" height="9" />
            <path d="M 38 27 A 12 12 0 0 1 62 27" />
            <path d="M 38 133 A 12 12 0 0 0 62 133" />
            <path d="M 5 9 A 4 4 0 0 1 9 5" />
            <path d="M 95 9 A 4 4 0 0 0 91 5" />
            <path d="M 5 151 A 4 4 0 0 0 9 155" />
            <path d="M 95 151 A 4 4 0 0 1 91 155" />
          </g>
          <circle cx="50" cy="80" r="0.9" fill="rgba(255,255,255,0.25)" />
          <circle cx="50" cy="17" r="0.6" fill="rgba(255,255,255,0.18)" />
          <circle cx="50" cy="143" r="0.6" fill="rgba(255,255,255,0.18)" />
        </svg>
      </motion.div>

      {/* Floodlight sweep — slow rotating conic gradient */}
      {!reduced && (
        <motion.div
          className="absolute -inset-[20%]"
          style={{
            background:
              'conic-gradient(from 90deg at 50% 40%, transparent 0deg, rgba(46,201,94,0.07) 35deg, transparent 80deg, transparent 220deg, rgba(46,201,94,0.05) 270deg, transparent 320deg)',
            filter: 'blur(40px)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 38, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* Central floodlight pulse */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 45% at 50% 38%, rgba(46,201,94,0.22) 0%, rgba(46,201,94,0.06) 45%, transparent 75%)',
        }}
        animate={reduced ? {} : { opacity: [0.55, 0.85, 0.55] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Drifting fog */}
      {!reduced && (
        <>
          <motion.div
            className="absolute inset-x-0 top-[35%] h-[35%]"
            style={{
              background:
                'radial-gradient(ellipse 70% 100% at 30% 50%, rgba(255,255,255,0.04), transparent 70%)',
              filter: 'blur(20px)',
            }}
            animate={{ x: ['-15%', '15%', '-15%'] }}
            transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute inset-x-0 top-[55%] h-[30%]"
            style={{
              background:
                'radial-gradient(ellipse 60% 100% at 70% 50%, rgba(255,255,255,0.03), transparent 70%)',
              filter: 'blur(24px)',
            }}
            animate={{ x: ['10%', '-12%', '10%'] }}
            transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
          />
        </>
      )}

      {/* Edge vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 95% 90% at 50% 50%, transparent 45%, rgba(3,8,5,0.85) 100%)',
        }}
      />

      {/* Top gloss */}
      <div
        className="absolute inset-x-0 top-0 h-40"
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, transparent 100%)',
        }}
      />
    </div>
  );
}

// ─── Logo lockup ──────────────────────────────────────────────────────────────

function LogoMark({ size = 96, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ delay, duration: 0.7, type: 'spring', stiffness: 220, damping: 18 }}
      className="relative"
      style={{ width: size, height: size }}
    >
      {/* Glow halo */}
      <motion.div
        className="absolute inset-[-30%] rounded-full"
        style={{
          background:
            'radial-gradient(circle at 50% 55%, rgba(46,201,94,0.55) 0%, rgba(46,201,94,0.18) 35%, transparent 65%)',
          filter: 'blur(14px)',
        }}
        animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.08, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <img
        src={LOGO_URL}
        alt="AllPlay"
        className="relative w-full h-full object-contain"
        style={{
          filter:
            'drop-shadow(0 12px 28px rgba(0,0,0,0.55)) drop-shadow(0 0 14px rgba(46,201,94,0.35))',
        }}
        draggable={false}
      />
    </motion.div>
  );
}

function HeaderBrand({ delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="flex items-center gap-2.5"
    >
      <img
        src={LOGO_URL}
        alt=""
        className="w-7 h-7 object-contain"
        style={{ filter: 'drop-shadow(0 0 8px rgba(46,201,94,0.45))' }}
        draggable={false}
      />
      <span
        className="text-[15px] font-black text-white tracking-tight"
        style={{ letterSpacing: '-0.01em' }}
      >
        AllPlay
      </span>
      <span
        className="text-[10px] font-bold tracking-[0.18em] uppercase ml-1"
        style={{ color: 'rgba(255,255,255,0.32)' }}
      >
        UF · SE
      </span>
    </motion.div>
  );
}

// ─── Primary CTA button ───────────────────────────────────────────────────────

function GreenButton({ children, onClick, disabled = false, ariaLabel = undefined }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.975 }}
      whileHover={{ y: -1 }}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="relative w-full h-[56px] rounded-2xl font-black text-[15.5px] text-white flex items-center justify-center gap-2 overflow-hidden"
      style={{
        background:
          'linear-gradient(180deg, #34D464 0%, #22B14E 55%, #1A9D40 100%)',
        boxShadow:
          '0 12px 32px rgba(34,197,94,0.42), 0 2px 0 rgba(255,255,255,0.18) inset, 0 -2px 0 rgba(0,0,0,0.18) inset',
        opacity: disabled ? 0.5 : 1,
        letterSpacing: '-0.01em',
      }}
    >
      {/* Sheen */}
      <span
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, transparent 45%)',
        }}
      />
      <span className="relative flex items-center gap-2">{children}</span>
    </motion.button>
  );
}

// ─── Slide 1: Hero ────────────────────────────────────────────────────────────

function HeroSlide() {
  const { t } = useT();
  return (
    <div className="relative flex flex-col flex-1 items-center justify-center px-7 pt-4 pb-6 text-center">
      <LogoMark size={108} delay={0.05} />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.5, ease: easeOutExpo }}
        className="mt-6"
      >
        <p
          className="text-[30px] font-black text-white tracking-[-0.035em] leading-none"
          style={{ textShadow: '0 2px 18px rgba(0,0,0,0.45)' }}
        >
          AllPlay
        </p>
        <p
          className="text-[11px] font-bold tracking-[0.22em] uppercase mt-1.5"
          style={{ color: 'rgba(126,232,154,0.85)' }}
        >
          {t('onboarding.hero.tagline')}
        </p>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.42, duration: 0.6, ease: easeOutExpo }}
        className="font-black text-white leading-[1.02] tracking-[-0.035em] mt-7"
        style={{
          fontSize: 'clamp(34px, 9.5vw, 46px)',
          textShadow: '0 4px 28px rgba(0,0,0,0.5)',
        }}
      >
        {t('onboarding.hero.headline_a')}<br />
        <span
          style={{
            background: 'linear-gradient(180deg, #7EE89A 0%, #2EC95E 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {t('onboarding.hero.headline_b')}
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.58, duration: 0.5 }}
        className="text-[15px] leading-relaxed font-medium mt-4"
        style={{ color: 'rgba(235,245,238,0.65)', maxWidth: 320 }}
      >
        {t('onboarding.hero.sub')}
      </motion.p>

      {/* Trust badges */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.72, duration: 0.45 }}
        className="flex items-center gap-2 mt-6"
      >
        {[
          t('onboarding.hero.badge_free'),
          t('onboarding.hero.badge_community'),
          t('onboarding.hero.badge_no_forms'),
        ].map((label) => (
          <span
            key={label}
            className="px-2.5 py-1 rounded-full text-[10.5px] font-bold tracking-wide"
            style={{
              background: 'rgba(46,201,94,0.10)',
              border: '1px solid rgba(46,201,94,0.28)',
              color: 'rgba(180,240,200,0.92)',
            }}
          >
            {label}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Slide 2: Map / Matches near you ──────────────────────────────────────────

function MapPreview() {
  const pins = useMemo(
    () => [
      { x: 22, y: 28, color: '#2EC95E', label: 'IDAG 18:30' },
      { x: 68, y: 42, color: '#34D464', label: 'IKVÄLL 20:00' },
      { x: 42, y: 70, color: '#7EE89A', label: 'IMORGON 17:00' },
    ],
    []
  );

  return (
    <div
      className="relative w-full aspect-[16/11] rounded-2xl overflow-hidden"
      style={{
        background:
          'linear-gradient(180deg, #0E2614 0%, #0A1D0F 100%)',
        border: '1px solid rgba(46,201,94,0.18)',
        boxShadow:
          '0 18px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset',
      }}
    >
      {/* Map grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(46,201,94,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(46,201,94,0.07) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      {/* Roads */}
      <svg
        viewBox="0 0 100 70"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
      >
        <path d="M -5 22 Q 30 18 55 32 T 105 30" stroke="rgba(255,255,255,0.06)" strokeWidth="0.6" fill="none" />
        <path d="M -5 55 Q 30 60 60 50 T 105 60" stroke="rgba(255,255,255,0.06)" strokeWidth="0.6" fill="none" />
        <path d="M 35 -5 Q 40 25 30 45 T 35 75" stroke="rgba(255,255,255,0.05)" strokeWidth="0.6" fill="none" />
        <path d="M 75 -5 Q 70 25 80 45 T 78 75" stroke="rgba(255,255,255,0.05)" strokeWidth="0.6" fill="none" />
      </svg>

      {/* Center "you" dot */}
      <motion.div
        className="absolute"
        style={{ left: '50%', top: '50%', x: '-50%', y: '-50%' }}
      >
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 56,
            height: 56,
            left: -28,
            top: -28,
            background: 'rgba(96,165,250,0.18)',
          }}
          animate={{ scale: [1, 2.2, 1], opacity: [0.7, 0, 0.7] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeOut' }}
        />
        <div
          className="w-3 h-3 rounded-full"
          style={{
            background: '#60A5FA',
            boxShadow: '0 0 0 3px rgba(96,165,250,0.25), 0 0 14px rgba(96,165,250,0.7)',
          }}
        />
      </motion.div>

      {/* Pins */}
      {pins.map((p, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
          initial={{ opacity: 0, y: -14, scale: 0.6 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            delay: 0.4 + i * 0.18,
            duration: 0.55,
            type: 'spring',
            stiffness: 380,
            damping: 18,
          }}
        >
          <div className="relative -translate-x-1/2 -translate-y-full flex flex-col items-center">
            <div
              className="px-2 py-0.5 rounded-md text-[9px] font-black tracking-wider whitespace-nowrap mb-1"
              style={{
                background: 'rgba(11,32,16,0.92)',
                color: p.color,
                border: `1px solid ${p.color}55`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              }}
            >
              {p.label}
            </div>
            <MapPin
              size={26}
              style={{
                color: p.color,
                fill: p.color,
                filter: `drop-shadow(0 4px 8px ${p.color}88) drop-shadow(0 0 12px ${p.color}66)`,
              }}
              strokeWidth={2}
            />
            <motion.div
              className="w-2 h-1 rounded-full mt-[-2px]"
              style={{ background: 'rgba(0,0,0,0.45)', filter: 'blur(2px)' }}
              animate={{ scaleX: [1, 0.8, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.3 }}
            />
          </div>
        </motion.div>
      ))}

      {/* Subtle glow overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(46,201,94,0.08), transparent 70%)',
        }}
      />
    </div>
  );
}

function MapSlide() {
  const { t } = useT();
  return (
    <div className="flex flex-col flex-1 px-6 pt-6 pb-6">
      <HeaderBrand delay={0} />

      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: easeOutExpo }}
        className="font-black text-white leading-[1.05] tracking-[-0.03em] mt-6"
        style={{ fontSize: 'clamp(28px, 7.4vw, 36px)' }}
      >
        {t('onboarding.map.headline_a')}<br />
        <span style={{ color: '#7EE89A' }}>{t('onboarding.map.headline_b')}</span>
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.18, duration: 0.45 }}
        className="text-[14px] mt-2 font-medium leading-relaxed"
        style={{ color: 'rgba(235,245,238,0.55)' }}
      >
        {t('onboarding.map.sub')}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.6, ease: easeOutExpo }}
        className="mt-6"
      >
        <MapPreview />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.45 }}
        className="flex items-center gap-3 mt-5 px-1"
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: 'rgba(46,201,94,0.14)',
            border: '1px solid rgba(46,201,94,0.3)',
          }}
        >
          <MapPin size={16} style={{ color: '#2EC95E' }} strokeWidth={2.4} />
        </div>
        <p className="text-[13px] font-medium leading-snug" style={{ color: 'rgba(235,245,238,0.65)' }}>
          {t('onboarding.map.fact')}
        </p>
      </motion.div>
    </div>
  );
}

// ─── Slide 3: Join in seconds ─────────────────────────────────────────────────

function JoinDemo() {
  const reduced = useReducedMotion();

  return (
    <div
      className="relative w-full rounded-2xl p-4 overflow-hidden"
      style={{
        background:
          'linear-gradient(180deg, rgba(11,32,16,0.96) 0%, rgba(8,24,12,0.96) 100%)',
        border: '1px solid rgba(46,201,94,0.18)',
        boxShadow: '0 18px 50px rgba(0,0,0,0.5)',
      }}
    >
      {/* Match card header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10.5px] font-bold tracking-[0.16em] uppercase" style={{ color: '#7EE89A' }}>
            IKVÄLL · 20:00
          </p>
          <p className="text-white font-black text-[16px] tracking-tight mt-0.5 truncate">
            Tantolunden 7v7
          </p>
          <p className="text-[12px] mt-0.5" style={{ color: 'rgba(235,245,238,0.5)' }}>
            Södermalm · Mixed nivå
          </p>
        </div>
        <div
          className="text-[10px] font-black px-2 py-1 rounded-md tracking-wider"
          style={{
            background: 'rgba(46,201,94,0.16)',
            color: '#34D464',
            border: '1px solid rgba(46,201,94,0.35)',
          }}
        >
          ÖPPEN
        </div>
      </div>

      {/* Player slots filling up */}
      <div className="mt-4 flex items-center gap-1.5">
        {Array.from({ length: 14 }).map((_, i) => {
          const filled = i < 10; // 10/14 baseline
          return (
            <motion.div
              key={i}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15 + i * 0.04, duration: 0.3 }}
              className="flex-1 h-7 rounded-md flex items-center justify-center"
              style={{
                background: filled ? 'rgba(46,201,94,0.18)' : 'rgba(255,255,255,0.04)',
                border: filled
                  ? '1px solid rgba(46,201,94,0.45)'
                  : '1px dashed rgba(255,255,255,0.1)',
              }}
            >
              {filled && (
                <div
                  className="w-3.5 h-3.5 rounded-full"
                  style={{
                    background: `linear-gradient(135deg, hsl(${130 + i * 8}, 60%, 55%), hsl(${110 + i * 6}, 50%, 40%))`,
                  }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-2">
        <p className="text-[11px] font-bold" style={{ color: 'rgba(235,245,238,0.55)' }}>
          10 / 14 spelare
        </p>
        <p className="text-[10.5px] font-semibold" style={{ color: '#34D464' }}>
          4 platser kvar
        </p>
      </div>

      {/* Join button animating press */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.45 }}
        className="mt-4"
      >
        <motion.div
          animate={
            reduced
              ? {}
              : { scale: [1, 0.96, 1.02, 1], boxShadow: [
                  '0 8px 24px rgba(34,197,94,0.45)',
                  '0 4px 12px rgba(34,197,94,0.3)',
                  '0 10px 28px rgba(34,197,94,0.55)',
                  '0 8px 24px rgba(34,197,94,0.45)',
                ] }
          }
          transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.4, ease: 'easeOut' }}
          className="h-11 rounded-xl flex items-center justify-center gap-2 font-black text-[14px] text-white"
          style={{
            background:
              'linear-gradient(180deg, #34D464 0%, #22B14E 55%, #1A9D40 100%)',
          }}
        >
          <Zap size={15} strokeWidth={2.8} fill="white" />
          Gå med
        </motion.div>
      </motion.div>
    </div>
  );
}

function JoinSlide() {
  const { t } = useT();
  return (
    <div className="flex flex-col flex-1 px-6 pt-6 pb-6">
      <HeaderBrand delay={0} />

      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: easeOutExpo }}
        className="font-black text-white leading-[1.05] tracking-[-0.03em] mt-6"
        style={{ fontSize: 'clamp(28px, 7.4vw, 36px)' }}
      >
        {t('onboarding.join.headline_a')}<br />
        <span style={{ color: '#7EE89A' }}>{t('onboarding.join.headline_b')}</span>
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.18, duration: 0.45 }}
        className="text-[14px] mt-2 font-medium leading-relaxed"
        style={{ color: 'rgba(235,245,238,0.55)' }}
      >
        {t('onboarding.join.sub')}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.6, ease: easeOutExpo }}
        className="mt-6"
      >
        <JoinDemo />
      </motion.div>

      {/* Two mini-perks */}
      <div className="grid grid-cols-2 gap-2.5 mt-4">
        {[
          { Icon: Users, title: t('onboarding.join.perk_meet_title'), sub: t('onboarding.join.perk_meet_sub') },
          { Icon: Trophy, title: t('onboarding.join.perk_elo_title'), sub: t('onboarding.join.perk_elo_sub') },
        ].map(({ Icon, title, sub }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + i * 0.08, duration: 0.4 }}
            className="rounded-xl p-3"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
              style={{
                background: 'rgba(46,201,94,0.14)',
                border: '1px solid rgba(46,201,94,0.28)',
              }}
            >
              <Icon size={14} style={{ color: '#2EC95E' }} strokeWidth={2.4} />
            </div>
            <p className="text-white font-black text-[13px] leading-tight">{title}</p>
            <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'rgba(235,245,238,0.45)' }}>
              {sub}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Slide 4: Auth ────────────────────────────────────────────────────────────

function AuthSlide({ isAuthenticated, isAuthLoading, onSuccess, onGuest }) {
  const { t } = useT();
  if (!isAuthLoading && isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 px-6 gap-5">
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 18 }}
          className="w-24 h-24 rounded-full flex items-center justify-center relative"
          style={{
            background:
              'radial-gradient(circle at 35% 30%, rgba(46,201,94,0.35) 0%, rgba(46,201,94,0.12) 65%, transparent 100%)',
          }}
        >
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ border: '2px solid rgba(46,201,94,0.6)' }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0, 0.8] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
          />
          <Check className="w-10 h-10 relative" style={{ color: '#34D464' }} strokeWidth={3} />
        </motion.div>
        <div className="text-center">
          <p className="text-[24px] font-black text-white mb-1.5 tracking-[-0.025em]">
            {t('onboarding.success.title')}
          </p>
          <p className="text-[14px]" style={{ color: 'rgba(235,245,238,0.5)' }}>
            {t('onboarding.success.sub')}
          </p>
        </div>
        <GreenButton onClick={onSuccess}>
          {t('onboarding.cta.get_started')} <ChevronRight className="w-4 h-4" strokeWidth={2.8} />
        </GreenButton>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 px-5 pt-6 pb-4">
      <HeaderBrand delay={0} />

      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.5, ease: easeOutExpo }}
        className="font-black text-white leading-[1.05] tracking-[-0.03em] mt-5"
        style={{ fontSize: 'clamp(26px, 7vw, 32px)' }}
      >
        {t('onboarding.auth.headline')}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.16, duration: 0.4 }}
        className="text-[13.5px] leading-relaxed mt-1.5 mb-5 font-medium"
        style={{ color: 'rgba(235,245,238,0.45)' }}
      >
        {t('onboarding.auth.sub')}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, duration: 0.45 }}
      >
        <LoginModal
          isOpen
          inline
          initialMode="register"
          onSuccess={onSuccess}
          onClose={() => {}}
        />
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        onClick={onGuest}
        className="w-full mt-4 py-3 text-[13px] font-semibold rounded-xl transition-colors"
        style={{ color: 'rgba(235,245,238,0.35)' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'rgba(235,245,238,0.7)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'rgba(235,245,238,0.35)';
        }}
      >
        {t('onboarding.auth.guest_link')}
      </motion.button>
    </div>
  );
}

// ─── Progress dots ────────────────────────────────────────────────────────────

function ProgressDots({ count, current }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: count }).map((_, i) => {
        const active = i === current;
        const done = i < current;
        return (
          <motion.div
            key={i}
            animate={{
              width: active ? 26 : 6,
              opacity: done || active ? 1 : 0.5,
            }}
            transition={{ duration: 0.4, ease: easeOutExpo }}
            className="h-1.5 rounded-full"
            style={{
              background:
                active || done
                  ? 'linear-gradient(90deg, #2EC95E, #7EE89A)'
                  : 'rgba(255,255,255,0.18)',
              boxShadow: active ? '0 0 10px rgba(46,201,94,0.6)' : 'none',
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Slide transition variants ────────────────────────────────────────────────

const slideVariants = {
  enter: (d) => ({ x: d > 0 ? 64 : -64, opacity: 0, scale: 0.98 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (d) => ({ x: d > 0 ? -64 : 64, opacity: 0, scale: 0.98 }),
};

// ─── Main modal ───────────────────────────────────────────────────────────────

export function OnboardingModal() {
  const { isAuthenticated, isLoading: isAuthLoading } = useSupabaseAuth();
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [slide, setSlide] = useState(0);
  const [dir, setDir] = useState(1);
  const [ref_] = useState(() => new URLSearchParams(window.location.search).get('ref'));
  const containerRef = useRef(null);
  // Tracks whether the modal was opened via the "replay" button in Settings,
  // so the OAuth auto-complete guard doesn't immediately dismiss it.
  const isReplayRef = useRef(false);

  // Initial show — needs_location is legacy; auto-complete it silently
  useEffect(() => {
    const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (stored === 'true') return;
    if (stored === 'needs_location') {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      return;
    }
    const t = setTimeout(() => {
      setOpen(true);
      track('onboarding_started');
    }, 450);
    return () => clearTimeout(t);
  }, []);

  // Funnel: one event per slide actually seen
  useEffect(() => {
    if (!open) return;
    track('onboarding_slide_viewed', { slide: SLIDES[slide]?.id, index: slide });
  }, [open, slide]);

  // Replay from Settings
  useEffect(() => {
    const handler = () => {
      isReplayRef.current = true;
      setSlide(0);
      setDir(1);
      setOpen(true);
    };
    window.addEventListener(ONBOARDING_EVENT, handler);
    return () => window.removeEventListener(ONBOARDING_EVENT, handler);
  }, []);

  // Referral code capture
  useEffect(() => {
    if (!ref_) return;
    (async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const user = await base44.auth.me();
          if (!user.referred_by) {
            await base44.functions
              .invoke('auth/handleReferralSignup', { userId: user.id, referralCode: ref_ })
              .catch(() => {});
          }
        } else {
          sessionStorage.setItem('pending_referral_code', ref_);
        }
      } catch {
        /**/
      }
    })();
  }, [ref_]);

  const complete = useCallback(async () => {
    isReplayRef.current = false;
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    track('onboarding_completed');
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        await base44.auth.updateMe({ onboarding_completed: true });
        const pending = sessionStorage.getItem('pending_referral_code');
        if (pending) {
          const u = await base44.auth.me();
          await base44.functions
            .invoke('auth/handleReferralSignup', { userId: u.id, referralCode: pending })
            .catch(() => {});
          sessionStorage.removeItem('pending_referral_code');
        }
      }
    } catch {
      /**/
    }
    setOpen(false);
  }, []);

  // Auto-complete on OAuth return — skip when replaying from Settings
  useEffect(() => {
    if (!open || isAuthLoading || isReplayRef.current) return;
    const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!stored && isAuthenticated && slide < SLIDES.length - 1) complete();
  }, [open, isAuthenticated, isAuthLoading, slide, complete]);

  const handleAuthSuccess = useCallback(() => {
    triggerHaptic('success');
    complete();
  }, [complete]);

  const goTo = useCallback(
    (n) => {
      setDir(n > slide ? 1 : -1);
      setSlide(n);
      triggerHaptic('light');
    },
    [slide]
  );

  // Swipe-to-navigate (mobile)
  const handleDragEnd = useCallback(
    (_, info) => {
      const offset = info.offset.x;
      const velocity = info.velocity.x;
      const threshold = 60;
      if (offset < -threshold || velocity < -400) {
        if (slide < SLIDES.length - 1) goTo(slide + 1);
      } else if (offset > threshold || velocity > 400) {
        if (slide > 0) goTo(slide - 1);
      }
    },
    [slide, goTo]
  );

  if (!open) return null;

  const cur = SLIDES[slide];
  const isAuth = cur.id === 'auth';
  const isLast = slide === SLIDES.length - 1;

  // Per-slide CTA label
  const ctaLabel =
    cur.id === 'hero'
      ? t('onboarding.cta.get_started')
      : cur.id === 'map'
      ? t('onboarding.cta.show_me')
      : t('onboarding.cta.create_account');

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
          style={{
            paddingTop: 'env(safe-area-inset-top)',
          }}
        >
          {/* Backdrop (desktop only — mobile is full-bleed) */}
          <div className="hidden sm:block absolute inset-0 bg-black/75 backdrop-blur-md" />

          {/* Modal card */}
          <motion.div
            initial={{ y: 64, opacity: 0, scale: 0.985 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 64, opacity: 0, scale: 0.985 }}
            transition={cardSpring}
            className="relative z-10 flex flex-col w-full h-[100dvh]
                       sm:w-[440px] sm:h-[760px] sm:max-h-[92vh] sm:rounded-[32px]
                       md:w-[460px] md:h-[780px]
                       overflow-hidden"
            style={{
              background: '#071A0D',
              boxShadow:
                '0 -28px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.06), 0 40px 80px rgba(0,0,0,0.6)',
            }}
          >
            {/* Pitch stage — shared across all slides */}
            <PitchStage slideIndex={slide} />

            {/* Top edge glow */}
            <div
              className="absolute inset-x-0 top-0 h-[2px] z-20"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, #2EC95E 25%, #7EE89A 50%, #2EC95E 75%, transparent 100%)',
                filter: 'drop-shadow(0 0 6px rgba(46,201,94,0.6))',
              }}
            />

            {/* Mobile drag handle */}
            <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0 relative z-20">
              <div
                className="w-10 h-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.22)' }}
              />
            </div>

            {/* Top bar: progress + skip */}
            <div
              className="relative z-20 flex-shrink-0 flex items-center justify-between px-5"
              style={{
                paddingTop: 'calc(env(safe-area-inset-top) + 14px)',
                paddingBottom: 12,
              }}
            >
              <div className="w-12" />
              <ProgressDots count={SLIDES.length} current={slide} />
              <button
                type="button"
                onClick={complete}
                className="w-12 text-right text-[12px] font-bold tracking-wide transition-colors"
                style={{ color: 'rgba(235,245,238,0.4)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'rgba(235,245,238,0.75)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(235,245,238,0.4)';
                }}
              >
                {isLast ? '' : t('common.skip')}
              </button>
            </div>

            {/* Slides */}
            <div className="relative z-10 flex-1 min-h-0 overflow-hidden">
              <AnimatePresence mode="wait" custom={dir}>
                <motion.div
                  key={slide}
                  custom={dir}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.38, ease: easeOutExpo }}
                  drag={isAuth ? false : 'x'}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.25}
                  onDragEnd={isAuth ? undefined : handleDragEnd}
                  className="h-full overflow-y-auto"
                >
                  {cur.id === 'hero' && <HeroSlide />}
                  {cur.id === 'map' && <MapSlide />}
                  {cur.id === 'join' && <JoinSlide />}
                  {cur.id === 'auth' && (
                    <AuthSlide
                      isAuthenticated={isAuthenticated}
                      isAuthLoading={isAuthLoading}
                      onSuccess={handleAuthSuccess}
                      onGuest={complete}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer CTA — hidden on auth slide */}
            {!isAuth && (
              <div
                className="relative z-20 flex-shrink-0 px-5 pt-4"
                style={{
                  paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)',
                  background:
                    'linear-gradient(180deg, transparent 0%, rgba(5,15,8,0.85) 30%, rgba(5,15,8,0.95) 100%)',
                  backdropFilter: 'blur(14px)',
                }}
              >
                <GreenButton onClick={() => goTo(slide + 1)} ariaLabel={ctaLabel}>
                  {ctaLabel}
                  <ChevronRight className="w-4 h-4" strokeWidth={2.8} />
                </GreenButton>
                {cur.id === 'hero' && (
                  <button
                    type="button"
                    onClick={() => goTo(SLIDES.length - 1)}
                    className="w-full mt-3 py-2.5 text-[13px] font-semibold transition-colors"
                    style={{ color: 'rgba(235,245,238,0.35)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'rgba(235,245,238,0.7)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'rgba(235,245,238,0.35)';
                    }}
                  >
                    {t('onboarding.login_link_a')}{' '}
                    <span style={{ color: '#34D464' }}>{t('onboarding.login_link_b')}</span>
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Reusable section-level skeletons that match real layout dimensions.
 * Use these instead of full-page skeletons to allow partial rendering.
 */
import React from 'react';

/** Skeleton for the Dashboard hero card area */
export function HeroSkeleton() {
  return (
    <div className="rounded-3xl border border-[#223029] bg-[#121715] overflow-hidden">
      <div className="px-6 py-8 sm:px-10 sm:py-10 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-[#18221E] animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-6 sm:h-8 bg-[#18221E] rounded-lg w-3/4 animate-pulse" />
            <div className="h-4 bg-[#18221E] rounded w-1/2 animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[0,1,2].map(i => (
            <div key={i} className="h-24 sm:h-28 bg-[#18221E] rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Skeleton for a grid of match cards (2-col on sm+) */
export function MatchGridSkeleton({ count = 4 }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-[#121715] border border-[#223029] rounded-2xl p-4 space-y-3">
          <div className="space-y-2">
            <div className="h-5 bg-[#18221E] rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-[#18221E] rounded w-1/2 animate-pulse" />
          </div>
          <div className="flex gap-1.5">
            <div className="h-6 w-16 bg-[#18221E] rounded-md animate-pulse" />
            <div className="h-6 w-12 bg-[#18221E] rounded-md animate-pulse" />
          </div>
          <div className="h-1.5 bg-[#18221E] rounded-full animate-pulse" />
          <div className="h-11 bg-[#18221E] rounded-2xl animate-pulse" />
        </div>
      ))}
    </div>
  );
}

/** Skeleton for a section with heading + content */
export function SectionSkeleton({ heading = true, children }) {
  return (
    <div className="space-y-4">
      {heading && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#18221E] rounded-xl animate-pulse" />
            <div className="h-6 bg-[#18221E] rounded w-40 animate-pulse" />
          </div>
          <div className="h-4 bg-[#18221E] rounded w-16 animate-pulse" />
        </div>
      )}
      {children}
    </div>
  );
}

/** Inline list skeleton (for nearby matches, notifications, etc.) */
export function ListSkeleton({ count = 3, height = 'h-20' }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${height} bg-[#18221E] rounded-xl animate-pulse`} />
      ))}
    </div>
  );
}
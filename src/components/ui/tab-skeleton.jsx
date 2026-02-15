import React from 'react';

/**
 * Compact skeleton for tab content transitions.
 * Much lighter than PageLoadingSkeleton — used inside Suspense for lazy tabs.
 */
export function TabSkeleton({ rows = 3 }) {
  return (
    <div className="space-y-4 py-2">
      {[...Array(rows)].map((_, i) => (
        <div
          key={i}
          className="bg-[#121715] border border-[#223029] rounded-2xl p-4 space-y-3 animate-pulse"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#18221E] rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-[#18221E] rounded-lg w-2/3" />
              <div className="h-3 bg-[#18221E] rounded w-1/2" />
            </div>
          </div>
          <div className="h-2 bg-[#18221E] rounded-full w-full" />
        </div>
      ))}
    </div>
  );
}

export function TabSkeletonGrid({ count = 4 }) {
  return (
    <div className="grid sm:grid-cols-2 gap-4 py-2">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="bg-[#121715] border border-[#223029] rounded-2xl p-4 space-y-3 animate-pulse"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#18221E] rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-[#18221E] rounded-lg w-3/4" />
              <div className="h-3 bg-[#18221E] rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
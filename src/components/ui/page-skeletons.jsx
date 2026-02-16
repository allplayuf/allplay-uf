/**
 * Page-level skeleton screens that match the real layout of each major view.
 * Used for "all-or-nothing" page gating: show skeleton until isPageReady=true.
 */

import React from 'react';

/* ─── Shared shimmer block ─── */
function Bone({ className }) {
  return <div className={`bg-[#18221E] rounded-lg animate-pulse ${className}`} />;
}

/* ─── DASHBOARD SKELETON ─── */
export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#0F1513] pb-24 lg:pb-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 sm:space-y-8">
        {/* Hero card */}
        <div className="rounded-3xl border border-[#223029] bg-[#121715] p-6 sm:p-10 space-y-6">
          <div className="flex items-center gap-4">
            <Bone className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <Bone className="h-7 w-48 sm:w-64" />
              <Bone className="h-4 w-32" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map(i => (
              <Bone key={i} className="h-[110px] sm:h-32 rounded-2xl" />
            ))}
          </div>
          <Bone className="h-14 rounded-2xl" />
        </div>

        {/* Matches section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Bone className="h-6 w-48" />
            <Bone className="h-4 w-20" />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {[0, 1].map(i => (
              <div key={i} className="bg-[#121715] border border-[#223029] rounded-[16px] p-4 space-y-3">
                <Bone className="h-6 w-3/4" />
                <div className="flex gap-2">
                  <Bone className="h-6 w-16 rounded-full" />
                  <Bone className="h-6 w-20 rounded-full" />
                </div>
                <Bone className="h-4 w-1/2" />
                <Bone className="h-4 w-2/3" />
                <Bone className="h-2 rounded-full" />
                <Bone className="h-11 rounded-[14px]" />
              </div>
            ))}
          </div>
        </div>

        {/* Nearby section */}
        <div className="space-y-3">
          <Bone className="h-6 w-40" />
          <div className="space-y-2">
            {[0, 1, 2].map(i => (
              <Bone key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── MAP SKELETON ─── */
export function MapSkeleton() {
  return (
    <div className="min-h-screen bg-[#0F1513]">
      {/* Mobile: header shimmer + map placeholder */}
      <div className="lg:hidden flex flex-col" style={{ height: 'calc(100vh - env(safe-area-inset-top))' }}>
        <div className="p-3 space-y-2.5 bg-[#121715] border-b border-[#223029]">
          <div className="flex gap-2">
            <Bone className="h-8 w-20 rounded-full" />
            <Bone className="h-10 flex-1 rounded-full" />
          </div>
          <div className="flex gap-2">
            <Bone className="h-10 w-24 rounded-full" />
            <Bone className="h-10 w-10 rounded-full" />
            <Bone className="h-7 w-12 rounded-full ml-auto" />
          </div>
        </div>
        <div className="flex-1 bg-[#0A0D0B] relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-3 border-[#223029] border-t-[#2BA84A] rounded-full animate-spin" />
          </div>
        </div>
      </div>

      {/* Desktop: sidebar + map */}
      <div className="hidden lg:flex h-screen">
        <div className="w-96 bg-[#121715] border-r border-[#223029] p-4 space-y-3">
          <Bone className="h-8 w-40" />
          <Bone className="h-11 rounded-full" />
          <div className="flex gap-2">
            <Bone className="h-10 flex-1 rounded-full" />
            <Bone className="h-10 flex-1 rounded-full" />
          </div>
          <div className="space-y-3 mt-4">
            {[0, 1, 2, 3, 4].map(i => (
              <Bone key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="flex-1 bg-[#0A0D0B]" />
      </div>
    </div>
  );
}

/* ─── MATCHES SKELETON ─── */
export function MatchesSkeleton() {
  return (
    <div className="min-h-screen bg-[#0F1513] pb-24 lg:pb-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5">
        {/* Title + tabs */}
        <div className="flex items-center justify-between">
          <Bone className="h-8 w-36" />
          <Bone className="h-10 w-10 rounded-full" />
        </div>
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <Bone key={i} className="h-10 w-24 rounded-full" />
          ))}
        </div>

        {/* Match cards grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-[#121715] border border-[#223029] rounded-[16px] p-4 space-y-3">
              <Bone className="h-6 w-3/4" />
              <div className="flex gap-2">
                <Bone className="h-6 w-16 rounded-full" />
                <Bone className="h-6 w-20 rounded-full" />
              </div>
              <Bone className="h-4 w-1/2" />
              <Bone className="h-4 w-2/3" />
              <Bone className="h-2 rounded-full" />
              <Bone className="h-11 rounded-[14px]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── COMMUNITY SKELETON ─── */
export function CommunitySkeleton() {
  return (
    <div className="min-h-screen bg-[#0F1513] pb-24 lg:pb-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5">
        <Bone className="h-8 w-40" />
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <Bone key={i} className="h-10 w-24 rounded-full" />
          ))}
        </div>
        {/* Player / Team cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-[#121715] border border-[#223029] rounded-[16px] p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Bone className="w-12 h-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Bone className="h-5 w-28" />
                  <Bone className="h-3 w-20" />
                </div>
              </div>
              <div className="flex gap-2">
                <Bone className="h-8 flex-1 rounded-lg" />
                <Bone className="h-8 flex-1 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── PROFILE SKELETON (re-export existing from loading-skeleton) ─── */
export function ProfilePageSkeleton() {
  return (
    <div className="min-h-screen bg-[#0F1513] pb-24 lg:pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="bg-[#121715] border border-[#223029] rounded-[20px] p-6">
          <div className="flex items-center gap-4">
            <Bone className="w-20 h-20 rounded-full" />
            <div className="flex-1 space-y-2">
              <Bone className="h-6 w-32" />
              <Bone className="h-4 w-48" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6">
            {[0, 1, 2].map(i => (
              <Bone key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        </div>
        {[0, 1, 2].map(i => (
          <Bone key={i} className="h-32 rounded-[16px]" />
        ))}
      </div>
    </div>
  );
}
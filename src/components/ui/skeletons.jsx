/**
 * Reusable skeleton primitives matching final UI dimensions.
 * All skeletons reserve exact height/width to prevent CLS.
 * Use animate-pulse for subtle shimmer.
 */

import React from 'react';

// Generic pulsing block
function Bone({ className = '' }) {
  return <div className={`bg-[#18221E] animate-pulse ${className}`} />;
}

// Avatar placeholder -- matches SmoothAvatar dimensions
export function SkeletonAvatar({ size = 40, rounded = 'rounded-xl' }) {
  return (
    <Bone 
      className={`flex-shrink-0 ${rounded}`}
      style={{ width: size, height: size, minWidth: size }}
    />
  );
}

// Single row: avatar + 2 text lines + optional trailing element
export function SkeletonAvatarRow({ avatarSize = 44 }) {
  return (
    <div className="flex items-center gap-3 p-3.5 bg-[#121715] border border-[#223029] rounded-2xl">
      <Bone className={`flex-shrink-0 rounded-xl`} style={{ width: avatarSize, height: avatarSize }} />
      <div className="flex-1 space-y-2">
        <Bone className="h-4 rounded-lg w-3/5" />
        <Bone className="h-3 rounded w-2/5" />
      </div>
      <Bone className="h-8 w-20 rounded-xl flex-shrink-0" />
    </div>
  );
}

// Match card skeleton -- matches MatchCard final height
export function SkeletonCard() {
  return (
    <div className="bg-[#121715] border border-[#223029] rounded-2xl p-4 space-y-3 h-[260px] flex flex-col">
      {/* Title + badge row */}
      <div className="flex items-center justify-between">
        <Bone className="h-5 rounded-lg w-3/4" />
        <Bone className="h-5 w-12 rounded-md" />
      </div>
      {/* Location + time */}
      <div className="flex gap-4">
        <Bone className="h-4 rounded w-1/3" />
        <Bone className="h-4 rounded w-1/4" />
      </div>
      {/* Tags */}
      <div className="flex gap-2">
        <Bone className="h-6 w-16 rounded-md" />
        <Bone className="h-6 w-14 rounded-md" />
        <Bone className="h-6 w-20 rounded-md" />
      </div>
      {/* Progress */}
      <div className="space-y-2 mt-auto">
        <div className="flex justify-between">
          <Bone className="h-3 w-16 rounded" />
          <Bone className="h-3 w-12 rounded" />
        </div>
        <Bone className="h-1.5 rounded-full w-full" />
        {/* Avatar row */}
        <div className="flex -space-x-2 pt-1">
          {[...Array(4)].map((_, i) => (
            <Bone key={i} className="w-6 h-6 rounded-full border border-[#121715]" />
          ))}
        </div>
      </div>
      {/* Button */}
      <Bone className="h-12 rounded-2xl mt-auto" />
    </div>
  );
}

// List row for match history, notifications etc
export function SkeletonListRow() {
  return (
    <div className="p-3.5 bg-[#18221E] rounded-xl space-y-2.5">
      <div className="flex items-center justify-between">
        <Bone className="h-4 rounded-lg w-2/3" />
        <Bone className="h-6 w-16 rounded-lg" />
      </div>
      <Bone className="h-3 rounded w-1/2" />
      <div className="flex gap-2">
        <Bone className="h-6 w-12 rounded-lg" />
        <Bone className="h-6 w-16 rounded-lg" />
      </div>
    </div>
  );
}

// Section skeleton (card header + rows)
export function SkeletonSection({ rows = 3 }) {
  return (
    <div className="bg-[#121715] border border-[#223029] rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#223029] flex items-center gap-2">
        <Bone className="w-7 h-7 rounded-lg" />
        <Bone className="h-4 w-24 rounded-lg" />
      </div>
      <div className="p-3 space-y-1.5">
        {[...Array(rows)].map((_, i) => (
          <SkeletonListRow key={i} />
        ))}
      </div>
    </div>
  );
}

// Friend card skeleton matching the profile friend card layout
export function SkeletonFriendCard() {
  return (
    <div className="bg-[#121715] border border-[#223029] rounded-2xl overflow-hidden">
      <Bone className="h-1 w-full" />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Bone className="w-11 h-11 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Bone className="h-4 rounded-lg w-2/3" />
            <Bone className="h-3 rounded w-1/2" />
          </div>
          <Bone className="h-6 w-16 rounded-md" />
        </div>
        <div className="flex gap-2">
          <Bone className="h-10 rounded-xl flex-1" />
          <Bone className="h-10 rounded-xl flex-1" />
        </div>
      </div>
    </div>
  );
}

// Dashboard page skeleton
export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#0F1513] pb-24 lg:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Hero skeleton */}
        <Bone className="h-[320px] sm:h-[380px] rounded-3xl" />
        
        {/* Match section header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bone className="w-10 h-10 rounded-xl" />
            <Bone className="h-6 w-40 rounded-lg" />
          </div>
          <Bone className="h-4 w-20 rounded" />
        </div>

        {/* Match cards grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
}

// Community page skeleton
export function CommunitySkeleton() {
  return (
    <div className="min-h-screen bg-[#0F1513] pb-24 lg:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Hero skeleton */}
        <Bone className="h-[300px] sm:h-[360px] rounded-3xl" />

        {/* Tabs skeleton */}
        <div className="grid grid-cols-4 gap-2">
          {[...Array(4)].map((_, i) => (
            <Bone key={i} className="h-12 rounded-2xl" />
          ))}
        </div>

        {/* Friend rows */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <SkeletonFriendCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
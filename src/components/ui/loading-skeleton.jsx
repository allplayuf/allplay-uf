import React from 'react';
import { motion } from 'framer-motion';

const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export function MatchCardSkeleton() {
  const reducedMotion = prefersReducedMotion();

  return (
    <motion.div
      initial={reducedMotion ? {} : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.2 }}
      className="bg-[#121715] border border-[#223029] rounded-[16px] p-4 space-y-3 stable-height-sm"
    >
      {/* Header skeleton */}
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="h-6 bg-[#18221E] rounded-lg w-3/4 animate-pulse" />
          <div className="flex gap-2">
            <div className="h-6 bg-[#18221E] rounded-full w-16 animate-pulse" />
            <div className="h-6 bg-[#18221E] rounded-full w-20 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Details skeleton */}
      <div className="space-y-2">
        <div className="h-4 bg-[#18221E] rounded w-1/2 animate-pulse" />
        <div className="h-4 bg-[#18221E] rounded w-2/3 animate-pulse" />
      </div>

      {/* Progress bar skeleton */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <div className="h-3 bg-[#18221E] rounded w-20 animate-pulse" />
          <div className="h-3 bg-[#18221E] rounded w-16 animate-pulse" />
        </div>
        <div className="h-2 bg-[#18221E] rounded-full animate-pulse" />
      </div>

      {/* Button skeleton */}
      <div className="h-11 bg-[#18221E] rounded-[14px] animate-pulse" />
    </motion.div>
  );
}

export function PageLoadingSkeleton() {
  const reducedMotion = prefersReducedMotion();

  return (
    <motion.div 
      initial={reducedMotion ? {} : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.2 }}
      className="space-y-6"
    >
      {/* Title skeleton */}
      <div className="space-y-2">
        <div className="h-8 bg-[#121715] rounded-lg w-48 animate-pulse" />
        <div className="h-4 bg-[#121715] rounded w-64 animate-pulse" />
      </div>

      {/* Tabs skeleton */}
      <div className="bg-[#121715] border border-[#223029] rounded-[16px] p-4">
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-[#18221E] rounded-[14px] animate-pulse" />
          ))}
        </div>
      </div>

      {/* Content skeleton */}
      <div className="grid md:grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => (
          <MatchCardSkeleton key={i} />
        ))}
      </div>
    </motion.div>
  );
}

export function ProfileSkeleton() {
  const reducedMotion = prefersReducedMotion();

  return (
    <motion.div
      initial={reducedMotion ? {} : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.2 }}
      className="min-h-screen bg-[#0F1513] pb-24 lg:pb-8"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Profile header skeleton */}
        <div className="bg-[#121715] border border-[#223029] rounded-[20px] p-6 stable-height-md">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-[#18221E] rounded-full animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-6 bg-[#18221E] rounded w-32 animate-pulse" />
              <div className="h-4 bg-[#18221E] rounded w-48 animate-pulse" />
            </div>
          </div>

          {/* Stats skeleton */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-[#18221E] rounded-xl p-4 animate-pulse h-20" />
            ))}
          </div>
        </div>

        {/* Content skeleton */}
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-[#121715] border border-[#223029] rounded-[16px] p-6 h-32 animate-pulse" />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
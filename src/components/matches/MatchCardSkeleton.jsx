import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

/**
 * Skeleton with exact same layout/height as MatchCard.
 * Prevents layout shift when real data arrives.
 */
export default function MatchCardSkeleton() {
  return (
    <Card className="bg-[#121715] border border-[#223029] rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.3)] h-full flex flex-col">
      <CardContent className="p-4 flex flex-col h-full">
        <div className="space-y-3 flex flex-col h-full animate-pulse">
          {/* Header */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="h-5 w-3/4 bg-[#18221E] rounded-md" />
            </div>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1.5 flex-1">
                <div className="w-4 h-4 bg-[#18221E] rounded-full flex-shrink-0" />
                <div className="h-3.5 w-24 bg-[#18221E] rounded-md" />
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <div className="w-4 h-4 bg-[#18221E] rounded-full flex-shrink-0" />
                <div className="h-3.5 w-28 bg-[#18221E] rounded-md" />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            <div className="h-6 w-16 bg-[#18221E] rounded-md" />
            <div className="h-6 w-10 bg-[#18221E] rounded-md" />
            <div className="h-6 w-14 bg-[#18221E] rounded-md" />
          </div>

          {/* Progress bar */}
          <div className="space-y-2 mt-auto">
            <div className="flex items-center justify-between">
              <div className="h-3 w-12 bg-[#18221E] rounded" />
              <div className="h-3 w-10 bg-[#18221E] rounded" />
            </div>
            <div className="h-1.5 bg-[#18221E] rounded-full" />
            {/* Avatar row */}
            <div className="flex items-center gap-2 pt-1">
              <div className="flex -space-x-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-6 h-6 bg-[#18221E] rounded-full border border-[#121715]" />
                ))}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-3 mt-auto">
            <div className="flex-1 h-12 bg-[#18221E] rounded-2xl" />
            <div className="w-20 h-12 bg-[#18221E] rounded-2xl" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
import React, { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import MatchCard from './MatchCard';
import { MatchCardSkeleton } from '../ui/loading-skeleton';
import { StaggeredList } from '../ui/page-transition';
import { motion } from 'framer-motion';

export default function InfiniteMatchList({ 
  data, 
  fetchNextPage, 
  hasNextPage, 
  isFetchingNextPage,
  isLoading,
  venues,
  user,
  participants,
  onJoin,
  onRefresh
}) {
  const loadMoreRef = useRef(null);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => (
          <MatchCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const allMatches = data?.pages?.flatMap(page => page?.matches || []) || [];

  if (allMatches.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[#B6C2BC] text-lg">Inga matcher hittades</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <StaggeredList className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allMatches.map((match, index) => {
          if (!match) return null;
          
          return (
            <MatchCard
              key={match.id}
              match={match}
              venues={venues || []}
              user={user}
              participants={participants[match.id] || []}
              onJoin={onJoin}
              onRefresh={onRefresh}
              index={index}
            />
          );
        })}
      </StaggeredList>

      {/* Enhanced Load more trigger with skeleton preview */}
      <div ref={loadMoreRef} className="py-8" style={{ minHeight: '64px' }}>
        {isFetchingNextPage && (
          <div className="space-y-4">
            {/* Skeleton loader for next matches */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(2)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.1 }}
                >
                  <MatchCardSkeleton />
                </motion.div>
              ))}
            </div>
          </div>
        )}
        
        {hasNextPage && !isFetchingNextPage && (
          <div className="flex justify-center">
            <div className="text-sm text-[#7B8A83]">Scrolla för att ladda fler matcher...</div>
          </div>
        )}
      </div>
    </div>
  );
}
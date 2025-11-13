import React from 'react';
import { useIsFetching } from '@tanstack/react-query';
import { LoadingOverlay } from './route-progress';

// Routes and their critical query keys that must be loaded
const ROUTE_QUERIES = {
  '/Dashboard': ['user', 'matches', 'venues'],
  '/Matches': ['user', 'matches-infinite', 'venues', 'participants'],
  '/Community': ['user', 'publicUsers', 'friendships'],
  '/Profile': ['user'],
  '/Map': ['venues'],
  '/Admin': ['user']
};

export function RouteGuard({ children, currentRoute }) {
  // Get the number of queries currently fetching
  const isFetching = useIsFetching();
  
  // Check if we're still loading critical data
  const criticalQueries = ROUTE_QUERIES[currentRoute] || [];
  const isLoadingCritical = isFetching > 0 && criticalQueries.length > 0;

  return (
    <>
      <LoadingOverlay isLoading={isLoadingCritical} />
      {children}
    </>
  );
}
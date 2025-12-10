import React, { lazy, Suspense } from 'react';

const MatchEndModal = lazy(() => import('./MatchEndModal'));
const InviteFriendsModal = lazy(() => import('./InviteFriendsModal'));
const MatchReportModal = lazy(() => import('./MatchReportModal'));

const ModalLoadingFallback = () => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="w-8 h-8 border-4 border-[#2BA84A] border-t-transparent rounded-full animate-spin" />
  </div>
);

export function LazyMatchEndModal({ show, ...props }) {
  if (!show) return null;
  return (
    <Suspense fallback={<ModalLoadingFallback />}>
      <MatchEndModal {...props} />
    </Suspense>
  );
}

export function LazyInviteFriendsModal({ show, ...props }) {
  if (!show) return null;
  return (
    <Suspense fallback={<ModalLoadingFallback />}>
      <InviteFriendsModal {...props} />
    </Suspense>
  );
}

export function LazyMatchReportModal({ show, ...props }) {
  if (!show) return null;
  return (
    <Suspense fallback={<ModalLoadingFallback />}>
      <MatchReportModal {...props} />
    </Suspense>
  );
}
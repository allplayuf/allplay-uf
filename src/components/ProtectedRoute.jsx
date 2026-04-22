import { Outlet } from 'react-router-dom';
import { useSupabaseAuth } from '@/components/supabase';

const DefaultFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-[#0B0F0D]">
    <div className="w-8 h-8 border-4 border-[#223029] border-t-[#2BA84A] rounded-full animate-spin"></div>
  </div>
);

/**
 * ProtectedRoute — gates child routes behind Supabase authentication.
 *
 * Replaces the previous Base44-based implementation. Authorization (roles,
 * admin, etc.) is enforced by Supabase RLS / edge functions; this component
 * only guards against *unauthenticated* access at the UI level.
 */
export default function ProtectedRoute({ fallback = <DefaultFallback />, unauthenticatedElement = null }) {
  const { isAuthenticated, isLoading } = useSupabaseAuth();

  if (isLoading) return fallback;
  if (!isAuthenticated) return unauthenticatedElement;

  return <Outlet />;
}
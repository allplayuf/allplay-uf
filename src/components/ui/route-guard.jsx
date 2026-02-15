import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useSupabaseAuth } from "@/components/supabase/AuthProvider";
import { checkIsAdmin } from "@/components/supabase/services/adminService";

/**
 * RouteGuard: Protects routes based on authentication and permissions
 * 
 * RULES:
 * 1. NEVER show a login screen by default
 * 2. Guests can browse freely - only admin routes are blocked
 * 3. Being logged out is NOT an error state
 * 4. Only redirect to login when explicitly required (admin routes)
 * 
 * Admin check uses public.users.is_admin (DB source of truth)
 */
export function RouteGuard({ children, currentRoute }) {
  const navigate = useNavigate();
  const { user, isLoading, isAuthenticated } = useSupabaseAuth();
  const [adminChecked, setAdminChecked] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    const adminRoutes = [
      createPageUrl('Admin'),
      createPageUrl('AdminCleanup')
    ];
    const isAdminRoute = adminRoutes.some(route => currentRoute.includes(route));

    if (!isAdminRoute) {
      // Not an admin route — allow immediately
      setAdminChecked(true);
      return;
    }

    // Admin route: verify via DB
    if (!isAuthenticated || !user) {
      navigate(createPageUrl('Dashboard'));
      return;
    }

    checkIsAdmin().then(isAdmin => {
      console.log('[RouteGuard] Admin route check:', isAdmin);
      if (!isAdmin) {
        navigate(createPageUrl('Dashboard'));
      }
      setAdminChecked(true);
    });
  }, [user, isLoading, isAuthenticated, currentRoute, navigate]);

  // Don't render admin routes until check completes
  const adminRoutes = [createPageUrl('Admin'), createPageUrl('AdminCleanup')];
  const isAdminRoute = adminRoutes.some(route => currentRoute.includes(route));
  if (isAdminRoute && !adminChecked) return null;

  return <>{children}</>;
}
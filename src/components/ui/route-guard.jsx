import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { isGuest, canAccessAdminPanel } from "../utils/permissions";
import { PageLoadingSkeleton } from "./loading-skeleton";

/**
 * RouteGuard: Protects routes based on authentication and permissions
 * 
 * RULES:
 * 1. NEVER show a login screen by default
 * 2. Guests can browse freely - only admin routes are blocked
 * 3. Being logged out is NOT an error state
 * 4. Only redirect to login when explicitly required (admin routes)
 */
export function RouteGuard({ children, currentRoute }) {
  const navigate = useNavigate();
  const [shouldRender, setShouldRender] = useState(true); // Default to true - always render

  const { data: user, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        // Return guest user - no need to create session, just mark as guest
        return { is_guest: true };
      }
      return await base44.auth.me();
    },
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (isLoading) return;

    // ONLY admin routes are blocked for non-admins
    const adminRoutes = [
      createPageUrl('Admin'),
      createPageUrl('AdminCleanup')
    ];

    const isAdminRoute = adminRoutes.some(route => currentRoute.includes(route));

    // Block non-admins from admin routes - redirect to Dashboard
    if (isAdminRoute && !canAccessAdminPanel(user)) {
      navigate(createPageUrl('Dashboard'));
      return;
    }

    // All other routes are accessible to everyone (guests included)
    setShouldRender(true);
  }, [user, isLoading, currentRoute, navigate]);

  // Show loading only briefly, then render content
  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  return <>{children}</>;
}
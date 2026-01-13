import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { isGuest, canAccessAdminPanel } from "@/utils/permissions";
import { PageLoadingSkeleton } from "./loading-skeleton";

/**
 * RouteGuard: Protects routes based on authentication and permissions
 */
export function RouteGuard({ children, currentRoute }) {
  const navigate = useNavigate();
  const [shouldRender, setShouldRender] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        return { is_guest: true };
      }
      return await base44.auth.me();
    },
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (isLoading) return;

    // Define protected routes
    const protectedRoutes = [
      createPageUrl('Profile'),
      createPageUrl('EditProfile'),
      createPageUrl('AccountSettings'),
      createPageUrl('Community')
    ];

    const adminRoutes = [
      createPageUrl('Admin'),
      createPageUrl('AdminCleanup')
    ];

    const isProtected = protectedRoutes.some(route => currentRoute.includes(route));
    const isAdminRoute = adminRoutes.some(route => currentRoute.includes(route));

    // Block guests from protected routes
    if (isGuest(user) && isProtected) {
      base44.auth.redirectToLogin(currentRoute);
      return;
    }

    // Block non-admins from admin routes
    if (isAdminRoute && !canAccessAdminPanel(user)) {
      navigate(createPageUrl('Dashboard'));
      return;
    }

    setShouldRender(true);
  }, [user, isLoading, currentRoute, navigate]);

  if (isLoading || !shouldRender) {
    return <PageLoadingSkeleton />;
  }

  return <>{children}</>;
}
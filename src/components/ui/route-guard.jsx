import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { canAccessAdminPanel } from "../utils/permissions";
import { useSupabaseAuth } from "@/components/supabase/AuthProvider";

/**
 * RouteGuard: Protects routes based on authentication and permissions
 * 
 * RULES:
 * 1. NEVER show a login screen by default
 * 2. Guests can browse freely - only admin routes are blocked
 * 3. Being logged out is NOT an error state
 * 4. Only redirect to login when explicitly required (admin routes)
 * 
 * Uses Supabase auth state (source of truth) instead of base44.auth
 */
export function RouteGuard({ children, currentRoute }) {
  const navigate = useNavigate();
  const { user, isLoading, isAuthenticated, roles, hasRole } = useSupabaseAuth();

  useEffect(() => {
    if (isLoading) return;

    // ONLY admin routes are blocked for non-admins
    const adminRoutes = [
      createPageUrl('Admin'),
      createPageUrl('AdminCleanup')
    ];

    const isAdminRoute = adminRoutes.some(route => currentRoute.includes(route));

    // Build a user-like object for canAccessAdminPanel check
    const userForCheck = isAuthenticated && user ? {
      ...user,
      role: hasRole('admin') ? 'admin' : 'user',
      custom_roles: roles.filter(r => r !== 'admin').map(r => r.toUpperCase())
    } : { is_guest: true };

    // Block non-admins from admin routes - redirect to Dashboard
    if (isAdminRoute && !canAccessAdminPanel(userForCheck)) {
      navigate(createPageUrl('Dashboard'));
      return;
    }
  }, [user, isLoading, isAuthenticated, currentRoute, navigate, roles, hasRole]);

  return <>{children}</>;
}
import React, { useState, useEffect, Suspense, lazy } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MapPin, Calendar, Users, Trophy, User, Shield, AlertCircle } from "lucide-react";
import { Toaster } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { QueryProvider, queryClient } from "@/components/providers/QueryProvider";
import { PageLoadingSkeleton } from "@/components/ui/loading-skeleton";
import { PageTransition } from "@/components/ui/page-transition";
import { base44 } from "@/api/base44Client";
import { RouteProgress } from "@/components/ui/route-progress";
import { RouteGuard } from "@/components/ui/route-guard";
import { OnboardingModal } from "@/components/ui/onboarding-modal";
import ErrorBoundary from "@/components/ui/error-boundary";
import OfflineDetector from "@/components/ui/offline-detector";
import { canAccessAdminPanel } from "./components/utils/permissions";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Map = lazy(() => import("@/pages/Map"));
const Matches = lazy(() => import("@/pages/Matches"));
const Community = lazy(() => import("@/pages/Community"));
const Profile = lazy(() => import("@/pages/Profile"));
const Admin = lazy(() => import("@/pages/Admin"));

const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: Trophy,
    component: Dashboard,
  },
  {
    title: "Karta",
    url: createPageUrl("Map"),
    icon: MapPin,
    component: Map,
  },
  {
    title: "Matcher",
    url: createPageUrl("Matches"),
    icon: Calendar,
    component: Matches,
  },
  {
    title: "Community",
    url: createPageUrl("Community"),
    icon: Users,
    component: Community,
  },
  {
    title: "Profil",
    url: createPageUrl("Profile"),
    icon: User,
    component: Profile,
  }
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckDone, setAdminCheckDone] = useState(false);
  const mainContentRef = React.useRef(null);

  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  // Use useQuery for consistent user state management across the app
  useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        setAdminCheckDone(true);
        return { is_guest: true };
      }
      const currentUser = await base44.auth.me();
      setIsAdmin(canAccessAdminPanel(currentUser));
      setAdminCheckDone(true);
      return currentUser;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (matches AUTH strategy)
    retry: false
  });

  return (
    <QueryProvider>
      <ErrorBoundary>
        <RouteProgress />
        <OnboardingModal />
        <OfflineDetector />
      
      <div className="min-h-screen flex w-full bg-[#131816]">
        <Toaster 
          position="bottom-center"
          theme="dark"
          toastOptions={{
            style: {
              background: '#121715',
              color: '#F4F7F5',
              border: '1px solid #223029',
            },
          }}
        />
        
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 bg-[#121715] border-r border-[#223029] flex-col">
          <div className="p-6 border-b border-[#223029]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden bg-transparent">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68dbdc9e123473250628e807/31f9a1cc1_LOGGAINGENBAGRUNDOUTLINE.png" 
                  alt="AllPlay UF Logo" 
                  className="w-full h-full object-contain"
                  loading="eager"
                />
              </div>
              <div>
                <h2 className="font-semibold text-[#F4F7F5] text-[20px] leading-[28px]">AllPlay UF</h2>
              </div>
            </div>
          </div>
          
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <div className="space-y-1">
              <p className="text-[11px] leading-[16px] font-semibold text-[#7B8A83] uppercase tracking-wider px-3 py-2">
                Navigation
              </p>
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <Link
                    key={item.title}
                    to={item.url}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl min-h-[44px] ${
                      isActive
                        ? 'bg-[#2BA84A]/16 text-[#EAF6EE] ring-1 ring-[#2BA84A]/30'
                        : 'text-[#7B8A83] hover:bg-[#18221E] hover:text-[#F4F7F5]'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[#2BA84A]' : 'text-[#7B8A83]'}`} strokeWidth={2} />
                    <span className="font-medium text-[14px] leading-[20px]">{item.title}</span>
                  </Link>
                );
              })}
            </div>

            {adminCheckDone && isAdmin && (
              <div className="pt-4 space-y-1">
                <p className="text-[11px] leading-[16px] font-semibold text-[#7B8A83] uppercase tracking-wider px-3 py-2">
                  Administration
                </p>
                <Link
                  to={createPageUrl("Admin")}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl min-h-[44px] ${
                    location.pathname === createPageUrl("Admin")
                      ? 'bg-[#F4743B]/16 text-[#FDE3D2] ring-1 ring-[#F4743B]/30'
                      : 'text-[#7B8A83] hover:bg-[#18221E] hover:text-[#F4F7F5]'
                  }`}
                >
                  <Shield className={`w-5 h-5 flex-shrink-0 ${location.pathname === createPageUrl("Admin") ? 'text-[#F4743B]' : 'text-[#7B8A83]'}`} strokeWidth={2} />
                  <span className="font-medium text-[14px] leading-[20px]">Admin</span>
                </Link>
              </div>
            )}
          </nav>

          <div className="p-4 border-t border-[#223029]">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-10 h-10 bg-gradient-to-br from-[#2BA84A] to-[#248232] rounded-full flex items-center justify-center">
                <span className="text-[#EAF6EE] font-semibold text-sm">U</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#F4F7F5] text-[13px] leading-[18px] truncate">User</p>
                <p className="text-[11px] leading-[16px] text-[#2BA84A] font-medium truncate">Redo att spela!</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col bg-[#131816] min-h-screen lg:min-h-0">
          <header className="lg:hidden sticky top-0 z-40 bg-[#121715] border-b border-[#223029] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden bg-transparent">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68dbdc9e123473250628e807/31f9a1cc1_LOGGAINGENBAGRUNDOUTLINE.png" 
                  alt="AllPlay UF Logo" 
                  className="w-full h-full object-contain"
                  loading="eager"
                />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-[#F4F7F5]">AllPlay UF</h1>
              </div>
            </div>
          </header>

          {/* PREVIEW BANNER REMOVED */}

          <div 
            ref={mainContentRef}
            className="flex-1 overflow-auto pb-20 lg:pb-0"
          >
            <RouteGuard currentRoute={location.pathname}>
              <PageTransition pageKey={location.pathname}>
                <Suspense fallback={<PageLoadingSkeleton />}>
                  {children}
                </Suspense>
              </PageTransition>
            </RouteGuard>
          </div>

          <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-[#121715] border-t border-[#223029] safe-area-pb">
            <div className="flex items-center justify-around px-2 py-2">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <Link
                    key={item.title}
                    to={item.url}
                    className={`flex flex-col items-center justify-center min-w-[60px] min-h-[44px] px-3 py-2 rounded-xl ${
                      isActive
                        ? 'bg-[#2BA84A]/16 text-[#EAF6EE]'
                        : 'text-[#7B8A83]'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 mb-1 ${isActive ? 'text-[#2BA84A]' : 'text-[#7B8A83]'}`} strokeWidth={2} />
                    <span className="text-[10px] font-medium">{item.title}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </main>
      </div>
      </ErrorBoundary>
    </QueryProvider>
  );
}
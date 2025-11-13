import React, { useState, useEffect, Suspense, lazy } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MapPin, Calendar, Users, Trophy, User, Shield } from "lucide-react";
import { Toaster } from "sonner";
import { QueryProvider, queryClient } from "@/components/providers/QueryProvider";
import { PageLoadingSkeleton } from "@/components/ui/loading-skeleton";
import { PageTransition } from "@/components/ui/page-transition";
import { base44 } from "@/api/base44Client";
import { RouteProgress } from "@/components/ui/route-progress";
import { RouteGuard } from "@/components/ui/route-guard";

// Lazy load all pages for code splitting
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Map = lazy(() => import("@/pages/Map"));
const Matches = lazy(() => import("@/pages/Matches"));
const Community = lazy(() => import("@/pages/Community"));
const Profile = lazy(() => import("@/pages/Profile"));
const Admin = lazy(() => import("@/pages/Admin"));
const MatchDetail = lazy(() => import("@/pages/MatchDetail"));
const TeamOverview = lazy(() => import("@/pages/TeamOverview"));
const EditProfile = lazy(() => import("@/pages/EditProfile"));

const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: Trophy,
    component: Dashboard,
    prefetchQueries: () => {
      queryClient.prefetchQuery({
        queryKey: ['user'],
        queryFn: () => base44.auth.me()
      });
      queryClient.prefetchQuery({
        queryKey: ['matches'],
        queryFn: () => base44.entities.Match.list('-date', 200)
      });
      queryClient.prefetchQuery({
        queryKey: ['venues'],
        queryFn: () => base44.entities.Venue.list()
      });
    }
  },
  {
    title: "Karta",
    url: createPageUrl("Map"),
    icon: MapPin,
    component: Map,
    prefetchQueries: () => {
      queryClient.prefetchQuery({
        queryKey: ['venues'],
        queryFn: () => base44.entities.Venue.list()
      });
    }
  },
  {
    title: "Matcher",
    url: createPageUrl("Matches"),
    icon: Calendar,
    component: Matches,
    prefetchQueries: () => {
      queryClient.prefetchQuery({
        queryKey: ['matches-infinite', {}],
        queryFn: () => base44.entities.Match.list('-date', 200)
      });
      queryClient.prefetchQuery({
        queryKey: ['venues'],
        queryFn: () => base44.entities.Venue.list()
      });
    }
  },
  {
    title: "Community",
    url: createPageUrl("Community"),
    icon: Users,
    component: Community,
    prefetchQueries: () => {
      queryClient.prefetchQuery({
        queryKey: ['publicUsers'],
        queryFn: async () => {
          const response = await base44.functions.invoke('getPublicUsers');
          return response.data.users || [];
        }
      });
      queryClient.prefetchQuery({
        queryKey: ['publicTeams'],
        queryFn: async () => {
          const response = await base44.functions.invoke('getPublicTeams');
          return response.data.teams || [];
        }
      });
    }
  },
  {
    title: "Profil",
    url: createPageUrl("Profile"),
    icon: User,
    component: Profile,
    prefetchQueries: () => {
      queryClient.prefetchQuery({
        queryKey: ['user'],
        queryFn: () => base44.auth.me()
      });
    }
  }
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [prefetchedPages, setPrefetchedPages] = useState(new Set());
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [adminCheckDone, setAdminCheckDone] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Track navigation state
  useEffect(() => {
    setIsNavigating(true);
    const timeout = setTimeout(() => setIsNavigating(false), 500);
    return () => clearTimeout(timeout);
  }, [location.pathname]);

  useEffect(() => {
    // Only run once on mount
    if (adminCheckDone) return;
    
    checkAdminStatus();
    
    // Enable View Transitions API if supported
    if (document.startViewTransition) {
      setIsTransitioning(true);
    }
  }, []); // Empty dependency array - only run once!

  const checkAdminStatus = async () => {
    try {
      // FIRST: Check if we already have cached user data
      const cachedUser = queryClient.getQueryData(['user']);
      
      if (cachedUser) {
        // Use cached data immediately - no API call!
        setIsAdmin(cachedUser.role === 'admin');
        setAdminCheckDone(true);
        return;
      }

      // ONLY if no cache exists, make ONE API call
      const currentUser = await base44.auth.me();
      setIsAdmin(currentUser.role === 'admin');
      
      // Cache the result so we never need to check again
      queryClient.setQueryData(['user'], currentUser);
      setAdminCheckDone(true);
      
    } catch (error) {
      // Silently fail on rate limit - admin link just won't show
      console.warn("Could not check admin status (rate limited)");
      setIsAdmin(false);
      setAdminCheckDone(true);
    }
  };

  // Prefetch page on hover or intersection - IMPROVED
  const handlePrefetch = (navItem) => {
    if (prefetchedPages.has(navItem.title)) return;
    
    // Prefetch component
    if (navItem.component?.preload) {
      navItem.component.preload();
    }
    
    // Prefetch queries aggressively
    if (navItem.prefetchQueries) {
      navItem.prefetchQueries();
    }
    
    setPrefetchedPages(new Set([...prefetchedPages, navItem.title]));
  };

  // Setup intersection observer for prefetching
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const pageName = entry.target.getAttribute('data-page');
            const navItem = navigationItems.find(item => item.title === pageName);
            if (navItem) {
              handlePrefetch(navItem);
            }
          }
        });
      },
      { rootMargin: '50px' }
    );

    // Observe navigation items
    document.querySelectorAll('[data-page]').forEach(el => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Prefetch on mount for likely next pages
  useEffect(() => {
    // Prefetch Dashboard if not there
    if (location.pathname !== createPageUrl("Dashboard")) {
      const dashboardNav = navigationItems.find(n => n.title === "Dashboard");
      if (dashboardNav) {
        setTimeout(() => handlePrefetch(dashboardNav), 1000);
      }
    }
  }, []);

  return (
    <QueryProvider>
      <RouteProgress />
      
      <div className="min-h-screen flex w-full bg-[#0F1513]">
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
          {/* Logo/Header */}
          <div className="p-6 border-b border-[#223029]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden bg-transparent">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68dbdc9e123473250628e807/8501d9a99_upscalemedia-transformed.png" 
                  alt="AllPlay UF Logo" 
                  className="w-full h-full object-contain"
                  loading="eager"
                />
              </div>
              <div>
                <h2 className="font-semibold text-[#F4F7F5] text-[20px] leading-[28px]">AllPlay UF</h2>
                <p className="text-[11px] leading-[16px] text-[#B6C2BC] font-medium tracking-wide">PLAY TOGETHER, ANYWHERE!</p>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
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
                    data-page={item.title}
                    onMouseEnter={() => handlePrefetch(item)}
                    onClick={() => handlePrefetch(item)} // Prefetch on click too
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group min-h-[44px] ${
                      isActive
                        ? 'bg-[#2BA84A]/16 text-[#EAF6EE] ring-1 ring-[#2BA84A]/30'
                        : 'text-[#7B8A83] hover:bg-[#18221E] hover:text-[#F4F7F5]'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[#2BA84A]' : 'text-[#7B8A83] group-hover:text-[#9FC9AC]'}`} strokeWidth={2} />
                    <span className="font-medium text-[14px] leading-[20px]">{item.title}</span>
                  </Link>
                );
              })}
            </div>

            {/* Admin link - only show when adminCheckDone and isAdmin */}
            {adminCheckDone && isAdmin && (
              <div className="pt-4 space-y-1">
                <p className="text-[11px] leading-[16px] font-semibold text-[#7B8A83] uppercase tracking-wider px-3 py-2">
                  Administration
                </p>
                <Link
                  to={createPageUrl("Admin")}
                  onMouseEnter={() => {
                    if (!prefetchedPages.has("Admin")) {
                      Admin.preload?.();
                      setPrefetchedPages(new Set([...prefetchedPages, "Admin"]));
                    }
                  }}
                  onClick={() => {
                    if (!prefetchedPages.has("Admin")) {
                      Admin.preload?.();
                      setPrefetchedPages(new Set([...prefetchedPages, "Admin"]));
                    }
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group min-h-[44px] ${
                    location.pathname === createPageUrl("Admin")
                      ? 'bg-[#F4743B]/16 text-[#FDE3D2] ring-1 ring-[#F4743B]/30'
                      : 'text-[#7B8A83] hover:bg-[#18221E] hover:text-[#F4F7F5]'
                  }`}
                >
                  <Shield className={`w-5 h-5 flex-shrink-0 ${location.pathname === createPageUrl("Admin") ? 'text-[#F4743B]' : 'text-[#7B8A83] group-hover:text-[#9FC9AC]'}`} strokeWidth={2} />
                  <span className="font-medium text-[14px] leading-[20px]">Admin</span>
                </Link>
              </div>
            )}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-[#223029]">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-10 h-10 bg-gradient-to-br from-[#2BA84A] to-[#248232] rounded-full flex items-center justify-center shadow-md">
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
        <main className="flex-1 flex flex-col bg-[#0F1513] min-h-screen lg:min-h-0">
          {/* Mobile Header */}
          <header className="lg:hidden sticky top-0 z-40 bg-[#121715] border-b border-[#223029] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg overflow-hidden bg-transparent">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68dbdc9e123473250628e807/8501d9a99_upscalemedia-transformed.png" 
                  alt="AllPlay UF Logo" 
                  className="w-full h-full object-contain"
                  loading="eager"
                />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-[#F4F7F5]">AllPlay UF</h1>
                <p className="text-[10px] text-[#B6C2BC] font-medium tracking-wide">PLAY TOGETHER, ANYWHERE!</p>
              </div>
            </div>
          </header>

          {/* Page Content with Transitions and Route Guard */}
          <div className="flex-1 overflow-auto pb-20 lg:pb-0">
            <RouteGuard currentRoute={location.pathname}>
              <PageTransition pageKey={location.pathname}>
                <Suspense fallback={<PageLoadingSkeleton />}>
                  {children}
                </Suspense>
              </PageTransition>
            </RouteGuard>
          </div>

          {/* Mobile Bottom Navigation */}
          <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-[#121715] border-t border-[#223029] safe-area-pb shadow-[0_-4px_12px_rgba(0,0,0,0.15)]">
            <div className="flex items-center justify-around px-2 py-2">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <Link
                    key={item.title}
                    to={item.url}
                    data-page={item.title}
                    onTouchStart={() => handlePrefetch(item)}
                    onClick={() => handlePrefetch(item)}
                    className={`flex flex-col items-center justify-center min-w-[60px] min-h-[44px] px-3 py-2 rounded-xl transition-all duration-150 ${
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
    </QueryProvider>
  );
}
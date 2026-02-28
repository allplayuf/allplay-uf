import React, { useState, useEffect, Suspense, lazy } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MapPin, Calendar, Users, Trophy, User, Shield, AlertCircle } from "lucide-react";
import { Toaster } from "sonner";
import { QueryProvider, queryClient } from "@/components/providers/QueryProvider";
import { PageLoadingSkeleton } from "@/components/ui/loading-skeleton";
import { PageTransition } from "@/components/ui/page-transition";
import { RouteProgress } from "@/components/ui/route-progress";
import { RouteGuard } from "@/components/ui/route-guard";
import { OnboardingModal } from "@/components/ui/onboarding-modal";
import ErrorBoundary from "@/components/ui/error-boundary";
import OfflineDetector from "@/components/ui/offline-detector";
import { canAccessAdminPanel } from "./components/utils/permissions";
import { checkIsAdmin, clearAdminCache } from "./components/supabase/services/adminService";
import { GuestBanner } from "@/components/ui/guest-banner";
import { SupabaseAuthProvider, useSupabaseAuth, initSupabase } from "@/components/supabase";
import { triggerHaptic } from "@/components/utils/motionTokens";
import ConsentChecker from "@/components/legal/ConsentChecker";
import { NavigationProvider } from "@/components/navigation/NavigationProvider";

// Guest banner wrapper that uses Supabase auth state
// Must be rendered INSIDE SupabaseAuthProvider (it's in LayoutInner)
function GuestBannerWrapper() {
  const { isGuest: isGuestUser, isLoading } = useSupabaseAuth();
  
  if (isLoading || !isGuestUser) return null;
  return <GuestBanner />;
}

// Initialize Supabase on app load
initSupabase().catch(console.error);

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

function LayoutInner({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckDone, setAdminCheckDone] = useState(false);
  const mainContentRef = React.useRef(null);
  
  // Track current path per tab for stack preservation
  const [tabPaths, setTabPaths] = useState({
    'Dashboard': createPageUrl('Dashboard'),
    'Map': createPageUrl('Map'),
    'Matches': createPageUrl('Matches'),
    'Community': createPageUrl('Community'),
    'Profile': createPageUrl('Profile')
  });

  // Update tab paths when location changes
  useEffect(() => {
    const currentPath = location.pathname;
    const activeTab = navigationItems.find(item => currentPath.startsWith(item.url));
    
    if (activeTab) {
      setTabPaths(prev => ({
        ...prev,
        [activeTab.title]: currentPath
      }));
    }
  }, [location.pathname]);

  // Scroll restoration is now handled by NavigationProvider.
  // No manual scrollTop = 0 here — that would fight scroll-position persistence.
  
  // Handle tab click - navigate to root if already active, else to last path
  const handleTabClick = (item) => {
    triggerHaptic('light');
    
    const isCurrentTab = location.pathname.startsWith(item.url);
    
    if (isCurrentTab) {
      navigate(item.url);
    } else {
      navigate(tabPaths[item.title] || item.url);
    }
  };

  // Use Supabase auth state for admin check
  const { user: supabaseUser, isAuthenticated: isSupabaseAuth, isLoading: isSupabaseLoading, roles: supabaseRoles, hasRole: supabaseHasRole } = useSupabaseAuth();

  // Admin check: single source of truth from public.users.is_admin via adminService
  useEffect(() => {
    if (isSupabaseLoading) return;
    
    if (isSupabaseAuth && supabaseUser) {
      checkIsAdmin({ forceRefresh: true }).then(result => {
        console.log('[Layout] Admin check result:', result, 'for user:', supabaseUser.id);
        setIsAdmin(result);
        setAdminCheckDone(true);
      }).catch(() => {
        setIsAdmin(false);
        setAdminCheckDone(true);
      });
    } else {
      clearAdminCache();
      setIsAdmin(false);
      setAdminCheckDone(true);
    }
  }, [isSupabaseLoading, isSupabaseAuth, supabaseUser?.id]);

  // Determine if current page is a root page or sub-page
  const isRootPage = navigationItems.some(item => location.pathname === item.url);

  return (
    <ErrorBoundary>
        <RouteProgress />
        <OnboardingModal />
        <OfflineDetector />

        {/* Guest Banner - shown when browsing as guest */}
        <GuestBannerWrapper />

        {/* Consent check - blocks authenticated users without valid consent */}
        <ConsentChecker>

        <div className="min-h-screen flex w-full bg-[#0B0F0D]">
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
          containerStyle={{
            bottom: 'calc(5rem + env(safe-area-inset-bottom))',
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
              <p className="text-[11px] leading-[16px] font-semibold text-[#9EAAA4] uppercase tracking-wider px-3 py-2">
                Navigation
              </p>
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <button
                    key={item.title}
                    onClick={() => handleTabClick(item)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl min-h-[44px] w-full text-left ${
                      isActive
                        ? 'bg-[#2BA84A]/16 text-[#EAF6EE] ring-1 ring-[#2BA84A]/30'
                        : 'text-[#9EAAA4] hover:bg-[#18221E] hover:text-[#F4F7F5]'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[#2BA84A]' : 'text-[#9EAAA4]'}`} strokeWidth={2} />
                    <span className="font-medium text-[14px] leading-[20px]">{item.title}</span>
                  </button>
                );
              })}
            </div>

            {adminCheckDone && isAdmin && (
              <div className="pt-4 space-y-1">
                <p className="text-[11px] leading-[16px] font-semibold text-[#9EAAA4] uppercase tracking-wider px-3 py-2">
                  Administration
                </p>
                <Link
                  to={createPageUrl("Admin")}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl min-h-[44px] ${
                    location.pathname === createPageUrl("Admin")
                      ? 'bg-[#F4743B]/16 text-[#FDE3D2] ring-1 ring-[#F4743B]/30'
                      : 'text-[#9EAAA4] hover:bg-[#18221E] hover:text-[#F4F7F5]'
                  }`}
                >
                  <Shield className={`w-5 h-5 flex-shrink-0 ${location.pathname === createPageUrl("Admin") ? 'text-[#F4743B]' : 'text-[#9EAAA4]'}`} strokeWidth={2} />
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
                <p className="text-[11px] leading-[16px] text-[#2BA84A] font-semibold truncate">Redo att spela!</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col bg-[#0B0F0D] min-h-screen lg:min-h-0">
          {/* iOS safe-area spacer for root pages (no header, just dark background behind status bar) */}
          <div className="lg:hidden bg-[#0B0F0D]" style={{ paddingTop: 'env(safe-area-inset-top)' }} />

          {/* Mobile back header for sub-pages (scrolls with content, NOT sticky) */}
          {!isRootPage && (
            <header className="lg:hidden bg-[#0B0F0D] border-b border-[#223029]" style={{ paddingLeft: 'calc(1rem + env(safe-area-inset-left))', paddingRight: 'calc(1rem + env(safe-area-inset-right))', paddingBottom: '0.75rem' }}>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  navigate(-1);
                }}
                className="flex items-center gap-2 text-[#F4F7F5] hover:text-[#2BA84A] transition-colors min-h-[44px]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6"/>
                </svg>
                <span className="font-semibold">Tillbaka</span>
              </button>
            </header>
          )}

          {/* PREVIEW BANNER REMOVED */}

          <div 
            ref={mainContentRef}
            className="flex-1 overflow-y-auto lg:pb-0"
            style={{ 
              paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))',
              WebkitOverflowScrolling: 'touch',
              overscrollBehaviorY: 'contain',
            }}
          >
            <NavigationProvider mainContentRef={mainContentRef}>
              <RouteGuard currentRoute={location.pathname}>
                <PageTransition pageKey={location.pathname}>
                  <Suspense fallback={<PageLoadingSkeleton />}>
                    {children}
                  </Suspense>
                </PageTransition>
              </RouteGuard>
            </NavigationProvider>
          </div>

          <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-[#0B0F0D] border-t border-[#223029]">
            <div className="flex items-center justify-around" style={{ paddingLeft: 'calc(0.5rem + env(safe-area-inset-left))', paddingRight: 'calc(0.5rem + env(safe-area-inset-right))', paddingTop: '0.5rem', paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}>
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <button
                    key={item.title}
                    onClick={() => handleTabClick(item)}
                    className={`flex flex-col items-center justify-center min-w-[60px] min-h-[44px] px-3 py-2 rounded-xl ${
                      isActive
                        ? 'bg-[#2BA84A]/16 text-[#EAF6EE]'
                        : 'text-[#9EAAA4]'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 mb-1 ${isActive ? 'text-[#2BA84A]' : 'text-[#9EAAA4]'}`} strokeWidth={2} />
                    <span className="text-[10px] font-medium">{item.title}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </main>
        </div>
        </ConsentChecker>
    </ErrorBoundary>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <QueryProvider>
      <SupabaseAuthProvider>
        <LayoutInner>{children}</LayoutInner>
      </SupabaseAuthProvider>
    </QueryProvider>
  );
}
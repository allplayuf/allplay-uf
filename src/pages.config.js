/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
// Pages are lazy-loaded so each route becomes its own chunk — static imports
// here put leaflet, recharts, cups, admin etc. into the main bundle (~2.4 MB).
// Layout.jsx renders children inside <Suspense>, which handles the fallback.
import { lazy } from 'react';

const AboutAllPlay = lazy(() => import('./pages/AboutAllPlay'));
const AccountSettings = lazy(() => import('./pages/AccountSettings'));
const Admin = lazy(() => import('./pages/Admin'));
const AdminCleanup = lazy(() => import('./pages/AdminCleanup'));
const Community = lazy(() => import('./pages/Community'));
const CreateCup = lazy(() => import('./pages/CreateCup'));
const CupDetail = lazy(() => import('./pages/CupDetail'));
const Cups = lazy(() => import('./pages/Cups'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const EditProfile = lazy(() => import('./pages/EditProfile'));
const Feedback = lazy(() => import('./pages/Feedback'));
const Home = lazy(() => import('./pages/Home'));
const LegalPolicy = lazy(() => import('./pages/LegalPolicy'));
const Map = lazy(() => import('./pages/Map'));
const MatchDetail = lazy(() => import('./pages/MatchDetail'));
const Matches = lazy(() => import('./pages/Matches'));
const Profile = lazy(() => import('./pages/Profile'));
const TeamOverview = lazy(() => import('./pages/TeamOverview'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
import __Layout from './Layout.jsx';


export const PAGES = {
    "AboutAllPlay": AboutAllPlay,
    "AccountSettings": AccountSettings,
    "Admin": Admin,
    "AdminCleanup": AdminCleanup,
    "Community": Community,
    "CreateCup": CreateCup,
    "CupDetail": CupDetail,
    "Cups": Cups,
    "Dashboard": Dashboard,
    "EditProfile": EditProfile,
    "Feedback": Feedback,
    "Home": Home,
    "LegalPolicy": LegalPolicy,
    "Map": Map,
    "MatchDetail": MatchDetail,
    "Matches": Matches,
    "Profile": Profile,
    "TeamOverview": TeamOverview,
    "TermsOfService": TermsOfService,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
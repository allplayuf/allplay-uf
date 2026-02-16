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
import AboutAllPlay from './pages/AboutAllPlay';
import AccountSettings from './pages/AccountSettings';
import Admin from './pages/Admin';
import AdminCleanup from './pages/AdminCleanup';
import CreateCup from './pages/CreateCup';
import CupDetail from './pages/CupDetail';
import Cups from './pages/Cups';
import EditProfile from './pages/EditProfile';
import Feedback from './pages/Feedback';
import Home from './pages/Home';
import LegalPolicy from './pages/LegalPolicy';
import Map from './pages/Map';
import MatchDetail from './pages/MatchDetail';
import Matches from './pages/Matches';
import TeamOverview from './pages/TeamOverview';
import TermsOfService from './pages/TermsOfService';
import Community from './pages/Community';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AboutAllPlay": AboutAllPlay,
    "AccountSettings": AccountSettings,
    "Admin": Admin,
    "AdminCleanup": AdminCleanup,
    "CreateCup": CreateCup,
    "CupDetail": CupDetail,
    "Cups": Cups,
    "EditProfile": EditProfile,
    "Feedback": Feedback,
    "Home": Home,
    "LegalPolicy": LegalPolicy,
    "Map": Map,
    "MatchDetail": MatchDetail,
    "Matches": Matches,
    "TeamOverview": TeamOverview,
    "TermsOfService": TermsOfService,
    "Community": Community,
    "Dashboard": Dashboard,
    "Profile": Profile,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
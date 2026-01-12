import AboutAllPlay from './pages/AboutAllPlay';
import Admin from './pages/Admin';
import AdminCleanup from './pages/AdminCleanup';
import Community from './pages/Community';
import CreateCup from './pages/CreateCup';
import CupDetail from './pages/CupDetail';
import Cups from './pages/Cups';
import Dashboard from './pages/Dashboard';
import EditProfile from './pages/EditProfile';
import Feedback from './pages/Feedback';
import Home from './pages/Home';
import Map from './pages/Map';
import MatchDetail from './pages/MatchDetail';
import Matches from './pages/Matches';
import Profile from './pages/Profile';
import TeamOverview from './pages/TeamOverview';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AboutAllPlay": AboutAllPlay,
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
    "Map": Map,
    "MatchDetail": MatchDetail,
    "Matches": Matches,
    "Profile": Profile,
    "TeamOverview": TeamOverview,
    "PrivacyPolicy": PrivacyPolicy,
    "TermsOfService": TermsOfService,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
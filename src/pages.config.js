import Dashboard from './pages/Dashboard';
import Map from './pages/Map';
import Admin from './pages/Admin';
import Matches from './pages/Matches';
import Profile from './pages/Profile';
import Community from './pages/Community';
import MatchDetail from './pages/MatchDetail';
import TeamOverview from './pages/TeamOverview';
import EditProfile from './pages/EditProfile';
import Feedback from './pages/Feedback';
import Cups from './pages/Cups';
import CupDetail from './pages/CupDetail';
import CreateCup from './pages/CreateCup';
import Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Map": Map,
    "Admin": Admin,
    "Matches": Matches,
    "Profile": Profile,
    "Community": Community,
    "MatchDetail": MatchDetail,
    "TeamOverview": TeamOverview,
    "EditProfile": EditProfile,
    "Feedback": Feedback,
    "Cups": Cups,
    "CupDetail": CupDetail,
    "CreateCup": CreateCup,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: Layout,
};
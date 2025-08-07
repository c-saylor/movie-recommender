import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; // Import Router
import { AuthProvider } from './utils/Auth';
import { FavoritesProvider } from './utils/Favorites';
import Home from './pages/Home';
import Login from './pages/Login';
import Browse from './pages/Browse';
import All from './pages/All';
import Header from './components/Header';
import Watchlist from './pages/Watchlist';
import Favorites from './pages/Favorites';
import Credits from './pages/Credits';
import { Recommendations } from './pages/Recommendations';
import { WatchlistProvider } from './utils/Watchlist';
import { UninterestedProvider } from './utils/Uninterested';
import './App.css';
import './styles/base.scss';
import 'bootstrap-icons/font/bootstrap-icons.css';
import NotInterested from './pages/NotInterested';

function App() {
  return (
    <div className="app-wrapper">
      <AuthProvider>
        <FavoritesProvider>
          <WatchlistProvider>
            <UninterestedProvider>
            <Router>
              <Header />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/recommendations" element={<Recommendations />} />
                <Route path="/browse" element={<Browse />} />
                <Route path="/all" element={<All />} />
                <Route path="/credits" element={<Credits />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/watchlist" element={<Watchlist />} />
                <Route path="/not-interested" element={<NotInterested />} />
              </Routes>
            </Router>
            </UninterestedProvider>
          </WatchlistProvider>
        </FavoritesProvider>
      </AuthProvider>
    </div>
  );
}

export default App;

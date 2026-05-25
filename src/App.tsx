import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './utils/Auth';
import { FavoritesProvider } from './utils/Favorites';
import { WatchlistProvider } from './utils/Watchlist';
import { UninterestedProvider } from './utils/Uninterested';
import { ToastProvider } from './utils/Toast';
import Header from './components/Header';
import './App.css';
import './styles/base.scss';
import 'bootstrap-icons/font/bootstrap-icons.css';

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Browse = lazy(() => import('./pages/Browse'));
const All = lazy(() => import('./pages/All'));
const Favorites = lazy(() => import('./pages/Favorites'));
const Watchlist = lazy(() => import('./pages/Watchlist'));
const NotInterested = lazy(() => import('./pages/NotInterested'));
const Credits = lazy(() => import('./pages/Credits'));
const Recommendations = lazy(() =>
  import('./pages/Recommendations').then((m) => ({ default: m.Recommendations }))
);

function App() {
  return (
    <div className="app-wrapper">
      <AuthProvider>
        <FavoritesProvider>
          <WatchlistProvider>
            <UninterestedProvider>
              <ToastProvider>
                <Router>
                  <Header />
                  <main>
                    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: '#fff' }}>Loading...</div>}>
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
                    </Suspense>
                  </main>
                </Router>
              </ToastProvider>
            </UninterestedProvider>
          </WatchlistProvider>
        </FavoritesProvider>
      </AuthProvider>
    </div>
  );
}

export default App;

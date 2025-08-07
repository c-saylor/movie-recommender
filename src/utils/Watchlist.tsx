import React, { useContext } from 'react';
import { useAuth } from './Auth';

interface WatchlistContextType {
    watchlist: number[];
    addToWatchlist: (movieId: number) => void;
    removeFromWatchlist: (movieId: number) => void;
}

const WatchlistContext = React.createContext<WatchlistContextType | undefined>(undefined);

export const useWatchlist = () => {
    const context = useContext(WatchlistContext);
    if (!context) {
        throw new Error('useWatchlist must be used within a WatchlistProvider');
    }
    return context;
};

export const WatchlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [watchlist, setWatchlist] = React.useState<number[]>([]);

    React.useEffect(() => {
        if (user) {
            const storedWatchlist = localStorage.getItem(`watchlist_${user}`);
            if (storedWatchlist) {
                setWatchlist(JSON.parse(storedWatchlist));
            }
        } else {
            setWatchlist([]);
        }
    }, [user]);

    const storeWatchlist = (newWatchlist: number[]) => {
        if (user) {
            localStorage.setItem(`watchlist_${user}`, JSON.stringify(newWatchlist));
        }
    };

    const addToWatchlist = (movieId: number) => {
        if (!watchlist.includes(movieId)) {
            const updated = [...watchlist, movieId];
            setWatchlist(updated);
            storeWatchlist(updated);
        }
    };

    const removeFromWatchlist = (movieId: number) => {
        const updated = watchlist.filter(id => id !== movieId);
        setWatchlist(updated);
        storeWatchlist(updated);
    };

    return (
        <WatchlistContext.Provider value={{ watchlist, addToWatchlist, removeFromWatchlist }}>
            {children}
        </WatchlistContext.Provider>
    );
};
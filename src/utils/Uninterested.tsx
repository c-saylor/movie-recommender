import React, { useContext } from 'react';
import { useAuth } from './Auth';
import { useFavorites } from './Favorites';
import { useWatchlist } from './Watchlist';

interface UninterestedContextType {
    uninterested: number[];
    addToUninterested: (movieId: number) => void;
    removeFromUninterested: (movieId: number) => void;
}

const UninterestedContext = React.createContext<UninterestedContextType | undefined>(undefined);

export const useUninterested = () => {
    const context = useContext(UninterestedContext);
    if (!context) {
        throw new Error('useUninterested must be used within a UninterestedProvider');
    }
    return context;
};

export const UninterestedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [uninterested, setUninterested] = React.useState<number[]>([]);
    const { favorites, removeFavorite } = useFavorites();
    const { watchlist, removeFromWatchlist } = useWatchlist();

    React.useEffect(() => {
        if (user) {
            const storedUninterested = localStorage.getItem(`uninterested_${user}`);
            if (storedUninterested) {
                const parsed = JSON.parse(storedUninterested);
                const coerced = parsed.map((id: string | number) => Number(id));
                setUninterested(coerced);
            }
        } else {
            setUninterested([]);
        }
    }, [user]);

    const storeUninterested = (newUninterested: number[]) => {
        if (user) {
            const unique = Array.from(new Set(newUninterested.map(Number)));
            localStorage.setItem(`uninterested_${user}`, JSON.stringify(unique));
        }
    };

    const addToUninterested = (movieId: number) => {
        if (!uninterested.includes(movieId)) {
            const updated = [...uninterested, movieId];
            setUninterested(updated);
            storeUninterested(updated);
            // Remove from favorites and watchlist if it exists there
            if (favorites.includes(movieId)) {
                removeFavorite(movieId);
            }
            if (watchlist.includes(movieId)) {
                removeFromWatchlist(movieId);
            }
        }
    };

    const removeFromUninterested = (movieId: number) => {
        const updated = uninterested.filter(id => id !== movieId);

        setUninterested(updated);
        storeUninterested(updated);
    };

    return (
        <UninterestedContext.Provider value={{ uninterested, addToUninterested, removeFromUninterested }}>
            {children}
        </UninterestedContext.Provider>
    );
};
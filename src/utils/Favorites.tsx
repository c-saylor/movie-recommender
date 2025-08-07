import React, {createContext, useContext, useEffect, useState} from 'react';
import {useAuth} from './Auth';

interface FavoritesContextType {
    favorites: number[];
    addFavorite: (movieId: number) => void;
    removeFavorite: (movieId: number) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const useFavorites = () => {
    const context = useContext(FavoritesContext);
    if (!context) {
        throw new Error('useFavorites must be used within a FavoritesProvider');
    }
    return context;
};

export const FavoritesProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
    const {user} = useAuth();
    const [favorites, setFavorites] = useState<number[]>([]);

    useEffect(() => {
        if (user) {
            const storedFavorites = localStorage.getItem(`favorites_${user}`);
            if (storedFavorites) {
                setFavorites(JSON.parse(storedFavorites));
            }
        } else {
            setFavorites([]);
        }
    }, [user]);

    const storeFavorites = (newFavorites: number[]) => {
        if (user) {
            localStorage.setItem(`favorites_${user}`, JSON.stringify(newFavorites));
        }
    };

    const addFavorite = (movieId: number) => {
        if (!favorites.includes(movieId)) {
            const updated = [...favorites, movieId];
            setFavorites(updated);
            storeFavorites(updated);
        }
    };

    const removeFavorite = (movieId: number) => {
        const updated = favorites.filter(id => id !== movieId);
        setFavorites(updated);
        storeFavorites(updated);
    };

    return (
        <FavoritesContext.Provider value={{favorites, addFavorite, removeFavorite}}>
            {children}
        </FavoritesContext.Provider>
    );
};
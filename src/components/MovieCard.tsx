import React from 'react';
import { useFavorites } from '../utils/Favorites';
import { Movie } from '../interfaces/movie';
import { useWatchlist } from '../utils/Watchlist';
import { useUninterested } from '../utils/Uninterested';
import { useToast } from '../utils/Toast';
import '../styles/movieCard.scss';

interface MovieCardProps extends Movie {
    onOpenDetail?: (movieId: number) => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({ id, title, poster_path, overview, vote_average, release_date, onOpenDetail, genres }) => {
    const { favorites, addFavorite, removeFavorite } = useFavorites();
    const { watchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();
    const { uninterested, addToUninterested, removeFromUninterested } = useUninterested();
    const { addToast } = useToast();
    const isInWatchlist = watchlist.includes(id);
    const isFavorited = favorites.includes(id);
    const isInUninterested = uninterested.includes(id);

    return (
        <div className="movie-card" onClick={() => onOpenDetail ? onOpenDetail(id) : null} style={{ cursor: 'pointer' }}>
            <div className='poster-container'>
                <img
                    className="poster"
                    src={`https://image.tmdb.org/t/p/w342${poster_path}`}
                    alt={title}
                    width="342"
                    height="513"
                    loading="lazy"
                    decoding="async"
                />
            </div>
            <div className="movie-info">
                <h4>{title}</h4>
                <p>Rating: {vote_average ? vote_average.toFixed(1) : '--'}</p>

                <div className="movie-actions">
                    <button aria-label={isFavorited ? 'Remove from Favorites' : 'Add to Favorites'} onClick={(e) => {
                        e.stopPropagation();
                        if (isFavorited) { removeFavorite(id); addToast('Removed from Favorites', 'remove'); }
                        else { addFavorite(id); addToast('Added to Favorites'); }
                    }}>
                        <i className={`bi ${isFavorited ? 'bi-heart-fill' : 'bi-heart'}`} aria-hidden="true" />
                    </button>
                    <button aria-label={isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'} onClick={(e) => {
                        e.stopPropagation();
                        if (isInWatchlist) { removeFromWatchlist(id); addToast('Removed from Watchlist', 'remove'); }
                        else { addToWatchlist(id); addToast('Added to Watchlist'); }
                    }}>
                        <i className={`bi ${isInWatchlist ? 'bi-bookmark-fill' : 'bi-bookmark'}`} aria-hidden="true" />
                    </button>
                    <button aria-label={isInUninterested ? 'Remove from Not Interested' : 'Mark as Not Interested'} onClick={(e) => {
                        e.stopPropagation();
                        if (isInUninterested) { removeFromUninterested(id); addToast('Removed from Not Interested', 'remove'); }
                        else { addToUninterested(id); addToast('Marked as Not Interested', 'remove'); }
                    }}>
                        <i className={`bi ${isInUninterested ? 'bi-x-circle-fill' : 'bi-x-circle'}`} aria-hidden="true" />
                    </button>
                </div>
            </div>
        </div>
    );
};
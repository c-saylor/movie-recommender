import React, { useEffect, useState } from 'react';
import { Movie } from '../interfaces/movie';
import '../styles/movieDetailModal.scss';
import { useFavorites } from '../utils/Favorites';
import { useWatchlist } from '../utils/Watchlist';
import { useUninterested } from '../utils/Uninterested';
import { motion, AnimatePresence } from 'framer-motion';
import { Container } from 'react-bootstrap';

const API_KEY = process.env.REACT_APP_TMDB_API_KEY;

interface MovieDetailModalProps {
    isOpen: boolean;
    movieId: number | null;
    onClose: () => void;
}

const MovieDetailModal: React.FC<MovieDetailModalProps> = ({ isOpen, movieId, onClose }) => {
    const [movie, setMovie] = useState<Movie | null>(null);
    const [loading, setLoading] = useState(false);

    const { favorites, addFavorite, removeFavorite } = useFavorites();
    const { watchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();
    const { uninterested, addToUninterested, removeFromUninterested } = useUninterested();

    useEffect(() => {
        if (!movieId) return;
        const fetchMovie = async () => {
            setLoading(true);
            try {
                const res = await fetch(
                    `https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&language=en-US`
                );
                const data = await res.json();
                setMovie(data);
            } catch (e) {
                console.error('Failed to fetch movie details', e);
            } finally {
                setLoading(false);
            }
        };
        fetchMovie();
    }, [movieId]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (loading) return (
        <div className="modal-overlay">
            <div className="modal-content">Loading...</div>
        </div>
    );

    if (!movie) return null;

    const isFavorited = favorites.includes(movie.id);
    const isInWatchlist = watchlist.includes(movie.id);
    const isInUninterested = uninterested.includes(movie.id);

    return (
        <AnimatePresence>
            {isOpen && movie ? (
                <motion.div className="modal-overlay" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Container className="justify-content-center">
                        <motion.div className="modal-content" onClick={e => e.stopPropagation()} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.2, ease: 'easeInOut' }}>
                            <motion.button className="close-button" onClick={onClose} initial={{ opacity: 0, scale: 0.5, rotate: -90 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={{ opacity: 0, scale: 0.5, rotate: 0 }} transition={{ duration: 0.3, ease: 'easeOut' }} whileHover={{ scale: 1.2, rotate: 15 }} whileTap={{ scale: 0.9 }}><i className="bi bi-x-lg" /></motion.button>
                            <div className="modal-body">
                                <img
                                    className="modal-poster"
                                    src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                                    alt={movie.title}
                                />

                                <div className="modal-info">
                                    <h2>{movie.title}</h2>
                                    <div className="genre-tags">
                                    {movie.genres?.map((genre) => (
                                        <span key={genre.id} className="genre-tag">{genre.name}</span>
                                    ))}
                                    </div>
                                    <p className="meta">
                                        <i className="bi bi-star-fill" /> {movie.vote_average ? movie.vote_average.toFixed(1) : null} • {movie.release_date}
                                    </p>
                                    <p className="overview">{movie.overview}</p>

                                    <div className="modal-actions">
                                        <button
                                            className={`btn ${isFavorited ? 'btn-danger' : 'btn-primary'}`}
                                            onClick={() =>
                                                isFavorited ? removeFavorite(movie.id) : addFavorite(movie.id)
                                            }
                                        >
                                            {isFavorited ? 'Remove from Favorites' : 'Add to Favorites'}
                                        </button>

                                        <button
                                            className={`btn ${isInWatchlist ? 'btn-secondary' : 'btn-outline'}`}
                                            onClick={() =>
                                                isInWatchlist ? removeFromWatchlist(movie.id) : addToWatchlist(movie.id)
                                            }
                                        >
                                            {isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                                        </button>
                                        <button
                                            className={`btn ${isInUninterested ? 'btn-secondary' : 'btn-outline'}`}
                                            onClick={() =>
                                                isInUninterested ? removeFromUninterested(movie.id) : addToUninterested(movie.id)
                                            }
                                        >
                                            {isInUninterested ? 'Remove from "Not Interested"' : 'Not Interested'}
                                        </button>

                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </Container>

                </motion.div>
            ) : null}
        </AnimatePresence>
    );
};

export default MovieDetailModal;

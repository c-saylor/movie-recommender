import React, { useState } from 'react';
import { MovieCard } from './MovieCard';
import { Movie } from '../interfaces/movie';
import { ScrollRow } from './ScrollRow';
import '../styles/genreRow.scss';
import MovieDetailModal from './MovieDetailModal';

interface GenreRowProps {
    genreId: number;
    genreName: string;
}

const API_KEY = process.env.REACT_APP_TMDB_API_KEY;

export const GenreRow: React.FC<GenreRowProps> = ({ genreId, genreName }) => {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
    const [showModal, setShowModal] = useState(false);

    const openMovieDetail = (id: number | null) => {
        setSelectedMovieId(id);
        setShowModal(true);
    }

    const closeMovieDetail = () => {
        setSelectedMovieId(null);
        setShowModal(false);
    }

    React.useEffect(() => {
        const fetchMoviesByGenre = async () => {
            setLoading(true);
            try {
                const res = await fetch(
                    `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=en-US&sort_by=popularity.desc&with_genres=${genreId}&page=${page}`
                );
                const data = await res.json();
                setMovies(prev => {
                    const combined = [...prev, ...data.results.map((movie: any) => ({
                        id: movie.id,
                        title: movie.title,
                        poster_path: movie.poster_path,
                        vote_average: movie.vote_average,
                        overview: movie.overview,
                        release_date: movie.release_date
                    }))];

                    const deduped = Array.from(new Map(combined.map(m => [m.id, m])).values());
                    return deduped;
                });
            } catch (err) {
                console.error("Failed to load movies:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchMoviesByGenre();
    }, [genreId, page]);

    return (
        <div className="genre-row">
            {loading && <div className="loading-spinner">Loading...</div>}
            <ScrollRow title={genreName}>
                {movies.map(movie => (
                    <MovieCard 
                    key={`${movie.id}-${genreName}`} 
                    id={movie.id} title={movie.title} 
                    poster_path={movie.poster_path} 
                    vote_average={movie.vote_average} 
                    overview={movie.overview} 
                    release_date={movie.release_date} 
                    onOpenDetail={() => openMovieDetail(movie.id)} 
                    genres={movie.genres}
                />
                ))}
            </ScrollRow>
            <MovieDetailModal isOpen={showModal} movieId={selectedMovieId} onClose={() => closeMovieDetail()} />
            <button className="load-more" onClick={() => setPage(prev => prev + 1)} disabled={loading}>
                {loading ? <i className="bi bi-hourglass-top" /> : <i className="bi bi-plus-lg" />}
            </button>
        </div>
    );
}
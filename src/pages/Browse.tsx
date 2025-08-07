import React, { useEffect, useRef, useState } from 'react';
import { genres } from '../data/genres';
import { GenreRow } from '../components/GenreRow';
import { Movie } from '../interfaces/movie';
import { useFavorites } from '../utils/Favorites';
import { MovieCard } from '../components/MovieCard';
import { ScrollRow, ScrollRowHandle } from '../components/ScrollRow';
import { Container } from 'react-bootstrap';
import MovieDetailModal from '../components/MovieDetailModal';
import { useUninterested } from '../utils/Uninterested';
import '../styles/browse.scss';

const API_KEY = process.env.REACT_APP_TMDB_API_KEY;

const Browse: React.FC = () => {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
    const [showModal, setShowModal] = useState(false);
    const { uninterested } = useUninterested();

    const scrollRef = useRef<ScrollRowHandle>(null);
    const pendingScroll = useRef<number | null>(null);
    const handleLoadMore = () => {
        if (!loading) {
            pendingScroll.current = scrollRef.current?.getScrollLeft() ?? 0;
            setPage(prev => prev + 1);
        }
    };

    const openMovieDetail = (id: number | null) => {
        setSelectedMovieId(id);
        setShowModal(true);
    }

    const closeMovieDetail = () => {
        setSelectedMovieId(null);
        setShowModal(false);
    }

    const { favorites } = useFavorites();

    useEffect(() => {
        const fetchPopular = async () => {
            setLoading(true);
            try {
                const res = await fetch(
                    `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=en-US&page=${page}`
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
                    const filtered = deduped.filter(movie => !uninterested.includes(movie.id));
                    return filtered;
                });
            } catch (err) {
                console.error("Failed to load movies:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPopular();
    }, [page, uninterested]);

    useEffect(() => {
        if (pendingScroll.current !== null) {
            scrollRef.current?.setScrollLeft(pendingScroll.current);
            pendingScroll.current = null;
        }
    }, [movies]);

    return (
        <section className="browse page">
            <Container>
                {loading && <p>Loading...</p>}
                {!favorites.length && (<div className="no-favs-message"><h1>First things first...</h1><p>add some movies to your favorites to help us get to know your tastes.</p></div>)}
                {!loading &&
                    <div>
                        <ScrollRow ref={scrollRef} title='Popular Movies'>
                            {movies.map((movie) => (
                                <MovieCard
                                    key={movie.id}
                                    id={movie.id}
                                    title={movie.title}
                                    poster_path={movie.poster_path}
                                    vote_average={movie.vote_average}
                                    overview={movie.overview}
                                    release_date={movie.release_date}
                                    onOpenDetail={() => openMovieDetail(movie.id)}
                                    genres={movie.genres}
                                />
                            ))}
                            {loading && <div className="loading">Loading...</div>}
                            {/* <button type="button" className="load-more" onClick={handleLoadMore} disabled={loading}>
                                {loading ? <i className="bi bi-hourglass-top" /> : <i className="bi bi-plus-lg" />}
                            </button> */}
                        </ScrollRow>
                        <MovieDetailModal isOpen={showModal} movieId={selectedMovieId} onClose={() => closeMovieDetail()} />
                        {genres.map((genre) => (
                            <GenreRow
                                key={genre.id}
                                genreId={genre.id}
                                genreName={genre.name}
                            />
                        ))}
                    </div>
                }
            </Container>
        </section>
    )
}

export default Browse;
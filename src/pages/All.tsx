import React, { useEffect, useMemo, useState } from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import { useInfiniteMovies } from '../hooks/infiniteMovies';
import { MovieCard } from '../components/MovieCard';
import { Container } from 'react-bootstrap';
import MovieDetailModal from '../components/MovieDetailModal';
import { genres } from '../data/genres';
import '../styles/all.scss';

const All: React.FC = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const searchQuery = queryParams.get('query')?.toLowerCase() || '';
    const { movies, loading, lastMovieRef } = useInfiniteMovies({query: searchQuery});
    const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedGenre, setSelectedGenre] = useState<number | 'all'>('all');
    const [minRating, setMinRating] = useState(0);
    const [sortOption, setSortOption] = useState<string>('title-asc');
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo({top:0, behavior: 'smooth'});
    }, [searchQuery]);

    const filteredAndSortedMovies = useMemo(() => {
        let filtered = movies.filter(movie => {
            const passesGenre = selectedGenre === 'all' || movie.genres?.some(genre => genre.id === selectedGenre);
            const passesRating = movie.vote_average >= minRating;
            const passesSearch = searchQuery === '' || movie.title.toLowerCase().includes(searchQuery) || movie.overview.toLowerCase().includes(searchQuery);
            return passesGenre && passesRating && passesSearch;
        });

        switch (sortOption) {
            case 'title-asc':
                filtered.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'title-desc':
                filtered.sort((a, b) => b.title.localeCompare(a.title));
                break;
            case 'date-new':
                filtered.sort((a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime());
                break;
            case 'date-old':
                filtered.sort((a, b) => new Date(a.release_date).getTime() - new Date(b.release_date).getTime());
                break;
            case 'rating-high':
                filtered.sort((a, b) => b.vote_average - a.vote_average);
                break;
            case 'rating-low':
                filtered.sort((a, b) => a.vote_average - b.vote_average);
                break;
        }

        return filtered;
    }, [movies, selectedGenre, minRating, sortOption, searchQuery]);

    const openMovieDetail = (id: number | null) => {
        setSelectedMovieId(id);
        setShowModal(true);
    }

    const closeMovieDetail = () => {
        setSelectedMovieId(null);
        setShowModal(false);
    }

    return (
        <section className="all page">
            <Container>
                <h2>All Movies</h2>
                <div className="controls">
                    <div className="filters">
                        <select onChange={e => setSelectedGenre(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
                            <option value="all">All Genres</option>
                            {genres.map(({ id, name }) => (
                                <option key={id} value={id}>{name}</option>
                            ))}
                        </select>
                        <select onChange={e => setSortOption(e.target.value)} value={sortOption}>
                            <option value="title-asc">Title (A-Z)</option>
                            <option value="title-desc">Title (Z-A)</option>
                            <option value="date-new">Release Date (Newest)</option>
                            <option value="date-old">Release Date (Oldest)</option>
                            <option value="rating-high">Rating (High to Low)</option>
                            <option value="rating-low">Rating (Low to High)</option>
                        </select>
                        <label className="rating-dropdown">
                            Minimum Rating:
                            <select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))}>
                                <option value={0}>All Ratings</option>
                                {[...Array(10)].map((_, i) => {
                                    const rating = (i + 1).toFixed(1);
                                    return <option key={rating} value={rating}>{rating}+</option>;
                                })}
                            </select>
                        </label>
                        <button className="clear-btn" onClick={() => {
                            setSelectedGenre('all');
                            setMinRating(0);
                            setSortOption('title-asc');
                        }}>
                            Clear Filters
                        </button>
                    </div>
                </div>
                {searchQuery && (
                    <button className="btn-primary btn-back" onClick={() => navigate('/all')}>
                        <i className="bi bi-chevron-left"/>All Movies
                    </button>
                )}
                <div className="movie-grid">
                    {filteredAndSortedMovies.map((movie, index) => {
                        const isLast = index === movies.length - 1;
                        return (
                            <div ref={isLast ? lastMovieRef : null} key={movie.id}>
                                <MovieCard
                                    id={movie.id}
                                    title={movie.title}
                                    poster_path={movie.poster_path}
                                    vote_average={movie.vote_average}
                                    overview={movie.overview}
                                    release_date={movie.release_date}
                                    genres={movie.genres}
                                    onOpenDetail={() => openMovieDetail(movie.id)}
                                />
                            </div>
                        );
                    })}
                    <MovieDetailModal isOpen={showModal} movieId={selectedMovieId} onClose={() => closeMovieDetail()} />
                </div>
                {loading && <p>Loading more movies...</p>}
            </Container>
        </section>
    );
}

export default All;
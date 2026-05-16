import React, { useState } from 'react';
import { Container } from 'react-bootstrap';
import { useFavorites } from '../utils/Favorites';
import { MovieCard } from '../components/MovieCard';
import { SkeletonCard } from '../components/SkeletonCard';
import { useMovieDetails } from '../hooks/useMovieDetails';
import MovieDetailModal from '../components/MovieDetailModal';
import '../styles/favorites.scss';

const Favorites: React.FC = () => {
    const { favorites } = useFavorites();
    const { movies: detailedFavorites, loading } = useMovieDetails(favorites);
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

    return (
        <section className="favorites page">
            <Container>
                <h2>Your Favorites</h2>
                {favorites.length === 0 ? (
                    <p className="empty-message">You haven’t added any favorites yet.</p>
                ) : loading ? (
                    <div className="favorites-grid">
                        {favorites.map((id) => <SkeletonCard key={id} />)}
                    </div>
                ) : (
                    <div className="favorites-grid">
                        {detailedFavorites.map((movie) => (
                            <MovieCard
                                key={movie.id}
                                id={movie.id}
                                title={movie.title}
                                poster_path={movie.poster_path}
                                overview={movie.overview}
                                release_date={movie.release_date}
                                vote_average={movie.vote_average}
                                onOpenDetail={() => openMovieDetail(movie.id)}
                                genres={movie.genres}
                            />
                        ))}
                    </div>
                )}
                <MovieDetailModal isOpen={showModal} movieId={selectedMovieId} onClose={() => closeMovieDetail()} />
            </Container>
        </section>
    );
}

export default Favorites;
import React from 'react';
import { Container } from 'react-bootstrap';
import { useWatchlist } from '../utils/Watchlist';
import { MovieCard } from '../components/MovieCard';
import { useMovieDetails } from '../hooks/useMovieDetails';
import '../styles/watchlist.scss';
import MovieDetailModal from '../components/MovieDetailModal';


const Watchlist: React.FC = () => {
    const { watchlist } = useWatchlist();
    const {movies: detailedWatchlist} = useMovieDetails(watchlist);
    const [selectedMovieId, setSelectedMovieId] = React.useState<number | null>(null);
    const [showModal, setShowModal] = React.useState(false);

    const openMovieDetail = (id: number | null) => {
        setSelectedMovieId(id);
        setShowModal(true);
    }

    const closeMovieDetail = () => {
        setSelectedMovieId(null);
        setShowModal(false);
    }

    return (
        <section className="watchlist page">
            <Container>
                <h2>Watchlist</h2>
                {detailedWatchlist.length === 0 ? (
                    <p className="empty-message">You haven’t added anything to your watchlist yet.</p>
                ) : (
                    <div className="watchlist-grid">
                        {detailedWatchlist.map((movie) => (
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

export default Watchlist;
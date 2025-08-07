import React from 'react';

import { useUninterested } from '../utils/Uninterested';
import { useMovieDetails } from '../hooks/useMovieDetails';
import {MovieCard} from '../components/MovieCard';
import '../styles/notInterested.scss';
import { Container } from 'react-bootstrap';
import MovieDetailModal from '../components/MovieDetailModal';

const NotInterested: React.FC = () => {
    const {uninterested} = useUninterested();
    const {movies: detailedUninterested} = useMovieDetails(uninterested);
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
        <section className="not-interested page">
            <Container>
                <h2>Not Interested</h2>
                {detailedUninterested.length === 0 ? (
                    <p className="empty-message">You haven’t marked anything as not interested yet.</p>
                ) : (
                    <div className="not-interested-grid">
                        {detailedUninterested.map((movie) => (
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
    )
}

export default NotInterested;
import React, { useEffect, useState } from 'react';
import { useFavorites } from '../utils/Favorites';
import { useAuth } from '../utils/Auth';
import { MovieCard } from '../components/MovieCard';
import { ScrollRow } from '../components/ScrollRow';
import { Link } from 'react-router-dom';
import { Movie } from '../interfaces/movie';
import { Container } from 'react-bootstrap';
import '../styles/recommendations.scss';
import MovieDetailModal from '../components/MovieDetailModal';
import { useUninterested } from '../utils/Uninterested';

const API_KEY = process.env.REACT_APP_TMDB_API_KEY;

interface GroupedRecommendations {
    [favoriteTitle: string]: Movie[];
}

export const Recommendations: React.FC = () => {
    const { favorites } = useFavorites();
    const { user } = useAuth();
    const [groupedRecs, setGroupedRecs] = React.useState<GroupedRecommendations>({});
    const [generalRecs, setGeneralRecs] = React.useState<Movie[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
    const [showModal, setShowModal] = useState(false);
    const {uninterested} = useUninterested();

    const openMovieDetail = (id: number | null) => {
        setSelectedMovieId(id);
        setShowModal(true);
    }

    const closeMovieDetail = () => {
        setSelectedMovieId(null);
        setShowModal(false);
    }

    useEffect(() => {
        const fetchGroupedRecommendations = async () => {
            if (!favorites.length) return;
            setLoading(true);

            const grouped: GroupedRecommendations = {};
            const seenMovieIds = new Set<number>();
            const combinedRecs = new Map<number, Movie>();


            try {
                await Promise.all(
                    favorites.map(async (movieId) => {
                        const movieDetailsRes = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}`);
                        const movieDetails = await movieDetailsRes.json();
                        const sourceTitle = movieDetails.title;

                        const similarRes = await fetch(
                            `https://api.themoviedb.org/3/movie/${movieId}/similar?api_key=${API_KEY}&language=en-US&page=1`
                        );
                        const similarData = await similarRes.json();

                        const uniqueSimilar: Movie[] = similarData.results.filter((rec: Movie) => {
                            if (seenMovieIds.has(rec.id) || favorites.includes(rec.id)) return false;
                            seenMovieIds.add(rec.id);
                            return true;
                        });

                        if (uniqueSimilar.length > 0) {
                            grouped[sourceTitle] = uniqueSimilar;
                        }

                        const recRes = await fetch(
                            `https://api.themoviedb.org/3/movie/${movieId}/recommendations?api_key=${API_KEY}&language=en-US&page=1`
                        );
                        const recData = await recRes.json();
                        recData.results.forEach((rec: Movie) => {
                            if (!favorites.includes(rec.id) && !combinedRecs.has(rec.id)) {
                                combinedRecs.set(rec.id, rec);
                              }
                        });
                    })
                );

                // filter out uninterested movies from grouped recommendations
                const filteredGrouped: GroupedRecommendations = {};
                for (const [title, movies] of Object.entries(grouped)) {
                    filteredGrouped[title] = movies.filter(movie => !uninterested.includes(movie.id));
                }
                setGroupedRecs(filteredGrouped)
                setGeneralRecs(Array.from(combinedRecs.values()).filter(movie => !uninterested.includes(movie.id)));


                
            } catch (err) {
                console.error("Failed to fetch grouped recommendations:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchGroupedRecommendations();
    }, [favorites]);

    return (
        <section className="recommendations page">
            <Container>
                {!user && (
                    <p>please log in to see recommendations</p>
                )}
                {loading && (<p>Loading recommendations...</p>)}
                {!Object.keys(groupedRecs).length && (
                    <div className="empty-recs-wrapper">
                        <h3>Nothing yet</h3>
                        <p>Add some movies to your favorites so we can come up with some recommendations that suit your tastes!</p>
                        <Link to="/browse" className="btn btn-primary">Browse Movies</Link>
                    </div>
                )}
                {user && !loading && Object.keys(groupedRecs).length > 0 && (
                    <div className="recs-grid-wrapper">
                        <h2>We think you'll like these titles:</h2>
                        {generalRecs.length > 0 && (
                            <div className="recommendation-group">
                            <h3>Recommended for you</h3>
                            <ScrollRow>
                                    {generalRecs.map(movie => (
                                        <MovieCard
                                            key={`${movie.id}-general`}
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
                            </ScrollRow>
    
                        </div>
                            )}
                        {Object.entries(groupedRecs).map(([sourceTitle, movies]) => (
                            <div className="recommendation-group" key={sourceTitle}>
                                <h3>Because you liked <span className="highlight">{sourceTitle}</span></h3>
                                <ScrollRow>
                                        {movies.map(movie => (
                                            <MovieCard
                                                key={`${movie.id}-${sourceTitle}`}
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
                                </ScrollRow>
        
                            </div>
                        ))}
                    </div>
                )}
                <MovieDetailModal isOpen={showModal} movieId={selectedMovieId} onClose={() => closeMovieDetail()} />
            </Container>
        </section>
    );
};
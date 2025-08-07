import {useEffect, useState} from 'react';
import {Movie} from '../interfaces/movie';
const API_KEY = process.env.REACT_APP_TMDB_API_KEY;

export const useMovieDetails = (movieIds: number[]) => {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchMovies = async () => {
            if (!movieIds.length) {
                setMovies([]);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const results = await Promise.all(movieIds.map(async (id) => {

                    const res = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}`);
                    if (!res.ok) throw new Error(`Failed to fetch movie ${id}`);
                    return await res.json();
                }));
                setMovies(results.filter((m): m is Movie => m !== null));
            } catch (err) {
                console.error('Failed to fetch movie details: ', err);
                setError(err as Error);
            } finally {
                setLoading(false);
            }
        };

        fetchMovies();
    }, [movieIds]);

    return {movies, loading, error};
};
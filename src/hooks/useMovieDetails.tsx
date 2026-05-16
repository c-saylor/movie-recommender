import {useEffect, useState} from 'react';
import {Movie} from '../interfaces/movie';
import { TMDB_BASE, tmdbAuth } from '../utils/tmdb';

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
                const results = await Promise.allSettled(movieIds.map(async (id) => {
                    const res = await fetch(`${TMDB_BASE}/movie/${id}?language=en-US`, { headers: tmdbAuth });
                    if (!res.ok) throw new Error(`Failed to fetch movie ${id}`);
                    return await res.json() as Movie;
                }));
                setMovies(
                    results
                        .filter((r): r is PromiseFulfilledResult<Movie> => r.status === 'fulfilled')
                        .map((r) => r.value)
                );
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
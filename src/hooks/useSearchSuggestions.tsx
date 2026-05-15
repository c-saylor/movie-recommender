import {useState, useEffect} from 'react';
import {Movie} from '../interfaces/movie';
import { TMDB_BASE, tmdbAuth } from '../utils/tmdb';

export const useSearchSuggestions = (query: string) => {
    const [suggestions, setSuggestions] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const controller = new AbortController();

        const fetchSuggestions = async () => {
            if (!query) {
                setSuggestions([]);
                return;
            }

            setLoading(true);
            try {
                const res = await fetch(
                    `${TMDB_BASE}/search/movie?language=en-US&query=${encodeURIComponent(query)}&page=1`,
                    { signal: controller.signal, headers: tmdbAuth }
                );
                const data = await res.json();
                if (data.results) {
                    setSuggestions(data.results.slice(0, 6));
                }
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    console.error('Suggestion fetch error:', err);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchSuggestions();

        return () => controller.abort();
    }, [query]);

    return {suggestions, loading};
};
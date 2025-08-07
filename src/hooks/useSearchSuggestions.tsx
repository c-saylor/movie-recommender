import {useState, useEffect} from 'react';
import {Movie} from '../interfaces/movie';

const API_KEY = process.env.REACT_APP_TMDB_API_KEY;

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
                    `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(query)}&page=1`,
                    {signal: controller.signal}
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
import { useEffect, useState, useRef, useCallback } from 'react';
import { Movie } from '../interfaces/movie';
import { useUninterested } from '../utils/Uninterested';
import {genres as genreList} from '../data/genres';

const API_KEY = process.env.REACT_APP_TMDB_API_KEY;

interface useInfiniteMoviesOptions {
  query?: string;
}

export const useInfiniteMovies = ({query = ''}: useInfiniteMoviesOptions = {}) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const { uninterested } = useUninterested();
  const genreMap = new Map(genreList.map(genre => [genre.id, genre]));

  useEffect(() => {
    setMovies([]);
    setPage(1);
    setHasMore(true);
  }, [query]);

  const lastMovieRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1);
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchMovies = async () => {
      setLoading(true);

      const baseUrl = query ? `https://api.themoviedb.org/3/search/movie` : `https://api.themoviedb.org/3/discover/movie`;

      const url = `${baseUrl}?api_key=${API_KEY}&language=en-US&page=${page}${query ? `&query=${encodeURIComponent(query)}` : '&sort_by=popularity.desc'}`;

      try {
        const res = await fetch(url, {signal: controller.signal});
        const data = await res.json();

        if (data.results && data.results.length > 0) {
          setMovies(prev => {
            const existingIds = new Set(prev.map(m => m.id));
            const newUnique = data.results.filter((m: { id: number; }) => !existingIds.has(m.id) && !uninterested.includes(m.id)).map((m: any) => ({...m, genres: m.genre_ids?.map((id: number) => genreMap.get(id)).filter(Boolean) || []}));
            return [...prev, ...newUnique];
          }

          );
          setHasMore(page < data.total_pages);
        } else {
          setHasMore(false);
        }
      } catch (err) {
        console.error('Failed to fetch movies:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [page, uninterested, query]);

  return { movies, loading, lastMovieRef };
};

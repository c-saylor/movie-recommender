export const TMDB_BASE = 'https://api.themoviedb.org/3';

export const tmdbAuth: HeadersInit = {
  Authorization: `Bearer ${process.env.REACT_APP_TMDB_API_KEY}`,
};

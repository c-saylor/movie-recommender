import React, { useEffect, useMemo, useState } from 'react';
import Groq from 'groq-sdk';
import { useFavorites } from '../utils/Favorites';
import { useWatchlist } from '../utils/Watchlist';
import { useAuth } from '../utils/Auth';
import { useUninterested } from '../utils/Uninterested';
import { useMovieDetails } from '../hooks/useMovieDetails';
import { MovieCard } from '../components/MovieCard';
import { ScrollRow } from '../components/ScrollRow';
import { Link } from 'react-router-dom';
import { Movie } from '../interfaces/movie';
import { Container } from 'react-bootstrap';
import '../styles/recommendations.scss';
import MovieDetailModal from '../components/MovieDetailModal';
import { TMDB_BASE, tmdbAuth } from '../utils/tmdb';

const MOOD_TAGS = [
  'Cozy', 'Mind-bending', 'Feel-good', 'Dark', 'Action-packed',
  'Romantic', 'Thrilling', 'Laugh-out-loud', 'Heartwarming', 'Thought-provoking',
];

interface AISuggestion {
  title: string;
  year: number;
  reason: string;
  confidence: 'high' | 'medium';
}

interface EnrichedSuggestion extends AISuggestion {
  tmdbData: Movie | null;
}

interface GroupedRecommendations {
  [favoriteTitle: string]: Movie[];
}

type AIPhase = 'input' | 'streaming' | 'results';

// ─── pure helpers ─────────────────────────────────────────────────────────────

function normalizeSuggestion(raw: any): AISuggestion | null {
  const title = raw.title ?? raw.movie_title ?? raw.name ?? raw.film_title ?? raw.movie ?? raw.film;
  if (!title || typeof title !== 'string' || !title.trim()) return null;

  const rawYear = raw.year ?? raw.release_year ?? raw.year_released ?? raw.releaseYear;
  const year = Number(rawYear);

  const reason = String(
    raw.reason ?? raw.explanation ?? raw.why ?? raw.rationale ?? raw.description ?? 'A great match for your taste.'
  );

  const rawConf = String(raw.confidence ?? raw.match_confidence ?? raw.match ?? 'medium').toLowerCase();
  const confidence: 'high' | 'medium' = rawConf === 'high' ? 'high' : 'medium';

  return { title: title.trim(), year: isNaN(year) ? 0 : year, reason, confidence };
}

function tryParseArray(s: string): AISuggestion[] | null {
  try {
    const p = JSON.parse(s.trim());
    if (!Array.isArray(p) || p.length === 0) return null;
    const normalized = p.map(normalizeSuggestion).filter((x): x is AISuggestion => x !== null);
    return normalized.length > 0 ? normalized : null;
  } catch {
    return null;
  }
}

function extractSuggestions(text: string): AISuggestion[] | null {
  // 1. RESULTS: delimiter — the prompt anchors JSON here
  const markerIdx = text.lastIndexOf('RESULTS:');
  if (markerIdx !== -1) {
    const section = text.slice(markerIdx + 'RESULTS:'.length).trim();
    const r = tryParseArray(section);
    if (r) return r;
    // Also try first '[' to last ']' within the section
    const f = section.indexOf('[');
    const l = section.lastIndexOf(']');
    if (f !== -1 && l > f) {
      const r2 = tryParseArray(section.slice(f, l + 1));
      if (r2) return r2;
    }
  }

  // 2. ```json code block
  const jsonBlock = text.match(/```json\s*([\s\S]*?)```/);
  if (jsonBlock) {
    const r = tryParseArray(jsonBlock[1]);
    if (r) return r;
  }

  // 3. Any fenced code block
  const anyBlock = text.match(/```[\w]*\s*([\s\S]*?)```/);
  if (anyBlock) {
    const r = tryParseArray(anyBlock[1]);
    if (r) return r;
  }

  // 4. Backward scan: for each ']' from the end, scan left for a '[' that
  //    produces a valid array. Handles trailing prose after the JSON.
  for (let end = text.length - 1; end >= 0; end--) {
    if (text[end] !== ']') continue;
    for (let start = end - 1; start >= 0; start--) {
      if (text[start] !== '[') continue;
      const r = tryParseArray(text.slice(start, end + 1));
      if (r && r.length >= 3) return r;
    }
  }

  return null;
}

async function searchTMDb(title: string, year: number): Promise<Movie | null> {
  if (!title) return null;
  const base = `${TMDB_BASE}/search/movie?language=en-US`;
  try {
    const r1 = await fetch(`${base}&query=${encodeURIComponent(title)}${year ? `&year=${year}` : ''}`, { headers: tmdbAuth });
    const d1 = await r1.json();
    if (d1.results?.length > 0) return d1.results[0];

    const r2 = await fetch(`${base}&query=${encodeURIComponent(title)}`, { headers: tmdbAuth });
    const d2 = await r2.json();
    return d2.results?.[0] ?? null;
  } catch {
    return null;
  }
}

// ─── component ────────────────────────────────────────────────────────────────

export const Recommendations: React.FC = () => {
  const { user } = useAuth();
  const { favorites } = useFavorites();
  const { watchlist } = useWatchlist();
  const { uninterested } = useUninterested();

  // ── AI state ──────────────────────────────────────────────────────────────
  const [aiPhase, setAiPhase] = useState<AIPhase>('input');
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [conversationalInput, setConversationalInput] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [aiResults, setAiResults] = useState<EnrichedSuggestion[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);

  // useMemo prevents new array references on every render, which would cause
  // useMovieDetails to re-fetch on every render cycle (infinite loop)
  const favSlice = useMemo(() => favorites.slice(0, 8), [favorites]);
  const watchSlice = useMemo(() => watchlist.slice(0, 8), [watchlist]);
  const { movies: favMovies } = useMovieDetails(favSlice);
  const { movies: watchMovies } = useMovieDetails(watchSlice);

  // ── TMDb grouped recs state ───────────────────────────────────────────────
  const [groupedRecs, setGroupedRecs] = useState<GroupedRecommendations>({});
  const [generalRecs, setGeneralRecs] = useState<Movie[]>([]);
  const [tmdbLoading, setTmdbLoading] = useState(false);

  // ── modal state ───────────────────────────────────────────────────────────
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);

  const openMovieDetail = (id: number) => { setSelectedMovieId(id); setShowModal(true); };
  const closeMovieDetail = () => { setSelectedMovieId(null); setShowModal(false); };

  // ── existing TMDb grouped recommendations ─────────────────────────────────
  useEffect(() => {
    const run = async () => {
      if (!favorites.length) return;
      setTmdbLoading(true);

      const grouped: GroupedRecommendations = {};
      const seenIds = new Set<number>();
      const combined = new Map<number, Movie>();

      try {
        await Promise.all(
          favorites.map(async (movieId) => {
            const detRes = await fetch(`${TMDB_BASE}/movie/${movieId}?language=en-US`, { headers: tmdbAuth });
            const det = await detRes.json();
            const sourceTitle: string = det.title;

            const [simRes, recRes] = await Promise.all([
              fetch(`${TMDB_BASE}/movie/${movieId}/similar?language=en-US&page=1`, { headers: tmdbAuth }),
              fetch(`${TMDB_BASE}/movie/${movieId}/recommendations?language=en-US&page=1`, { headers: tmdbAuth }),
            ]);

            const simData = await simRes.json();
            const unique: Movie[] = simData.results.filter((r: Movie) => {
              if (seenIds.has(r.id) || favorites.includes(r.id)) return false;
              seenIds.add(r.id);
              return true;
            });
            if (unique.length > 0) grouped[sourceTitle] = unique;

            const recData = await recRes.json();
            recData.results.forEach((r: Movie) => {
              if (!favorites.includes(r.id) && !combined.has(r.id)) combined.set(r.id, r);
            });
          })
        );

        const filteredGrouped: GroupedRecommendations = {};
        for (const [title, movies] of Object.entries(grouped)) {
          filteredGrouped[title] = movies.filter((m) => !uninterested.includes(m.id));
        }
        setGroupedRecs(filteredGrouped);
        setGeneralRecs(Array.from(combined.values()).filter((m) => !uninterested.includes(m.id)));
      } catch (err) {
        console.error('Failed to fetch TMDb recommendations:', err);
      } finally {
        setTmdbLoading(false);
      }
    };
    run();
  }, [favorites, uninterested]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── AI helpers ────────────────────────────────────────────────────────────

  const toggleMood = (tag: string) =>
    setSelectedMoods((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );

  const hasEnoughInput = () =>
    favorites.length > 0 || watchlist.length > 0 ||
    selectedMoods.length > 0 || conversationalInput.trim().length > 0;

  const buildPrompt = (): string => {
    const lines = [
      'Based on the user taste profile below, recommend exactly 5 movies.',
      '',
      'TASTE PROFILE:',
    ];
    if (favMovies.length) lines.push(`- Favorites: ${favMovies.map((m) => m.title).join(', ')}`);
    if (watchMovies.length) lines.push(`- Watchlist: ${watchMovies.map((m) => m.title).join(', ')}`);
    if (selectedMoods.length) lines.push(`- Mood/vibe: ${selectedMoods.join(', ')}`);
    if (conversationalInput.trim()) lines.push(`- In their own words: "${conversationalInput.trim()}"`);

    lines.push(
      '',
      'Write 1-2 sentences explaining your picks. Then output the exact token RESULTS: on its own line, followed immediately by valid JSON — nothing else after the array.',
      '',
      'RESULTS:',
      '[{"title":"Exact Movie Title","year":2020,"reason":"One sentence why this fits.","confidence":"high"}]',
      '',
      'Rules:',
      '- Use EXACTLY these JSON keys: title, year, reason, confidence',
      '- confidence must be "high" or "medium" (high = perfect match, medium = solid pick)',
      '- Only recommend real, existing movies',
      '- No extra keys, no trailing text after the JSON array'
    );
    return lines.join('\n');
  };

  const handleAIRecommend = async () => {
    if (!hasEnoughInput()) {
      setAiError("Add some mood tags or describe what you're looking for to get started.");
      return;
    }

    const groqKey = process.env.REACT_APP_GROQ_API_KEY;
    if (!groqKey) {
      setAiError('REACT_APP_GROQ_API_KEY is not set. Add it to your .env file and restart the dev server.');
      return;
    }

    setAiPhase('streaming');
    setStreamingText('');
    setAiError(null);

    try {
      const groq = new Groq({ apiKey: groqKey, dangerouslyAllowBrowser: true });

      const stream = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: buildPrompt() }],
        stream: true,
      });

      let full = '';
      for await (const chunk of stream) {
        full += chunk.choices[0]?.delta?.content || '';
        setStreamingText(full);
      }

      const suggestions = extractSuggestions(full);
      if (!suggestions) {
        console.error('[AI] Raw output that failed to parse:\n', full);
        throw new Error('Could not parse AI recommendations. Please try again.');
      }
      console.log('[AI] Parsed suggestions:', suggestions);

      const enriched = await Promise.all(
        suggestions.map(async (s) => ({ ...s, tmdbData: await searchTMDb(s.title, s.year) }))
      );

      setAiResults(enriched);
      setAiPhase('results');
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setAiPhase('input');
    }
  };

  const resetAI = () => {
    setAiPhase('input');
    setAiResults([]);
    setStreamingText('');
    setAiError(null);
  };

  // ── render ────────────────────────────────────────────────────────────────

  const showTMDbSection = user && !tmdbLoading && Object.keys(groupedRecs).length > 0;

  return (
    <section className="recommendations page">
      <Container>

        {/* ── AI finder section ────────────────────────────────────────── */}
        <div className="ai-section">
          <h2 className="ai-section-title">Find Your Perfect Movie</h2>
          <p className="ai-section-subtitle">
            Tell us what you're in the mood for — AI will curate picks from your taste
          </p>

          {/* Favorites context chips */}
          {favMovies.length > 0 && (
            <div className="taste-context">
              <span className="taste-context-label">Based on your favorites:</span>
              <div className="taste-chips">
                {favMovies.slice(0, 5).map((m) => (
                  <span key={m.id} className="taste-chip">{m.title}</span>
                ))}
                {favMovies.length > 5 && (
                  <span className="taste-chip taste-chip--more">+{favMovies.length - 5} more</span>
                )}
              </div>
            </div>
          )}

          {/* Mood tags */}
          <div className="mood-tags">
            {MOOD_TAGS.map((tag) => (
              <button
                key={tag}
                className={`mood-tag${selectedMoods.includes(tag) ? ' mood-tag--selected' : ''}`}
                onClick={() => toggleMood(tag)}
                disabled={aiPhase === 'streaming'}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Conversational input */}
          <div className="conversational-input">
            <textarea
              value={conversationalInput}
              onChange={(e) => setConversationalInput(e.target.value)}
              placeholder="Describe what you're in the mood for... (e.g. something like Parasite but funnier)"
              rows={3}
              disabled={aiPhase === 'streaming'}
            />
          </div>

          {aiError && <p className="ai-error">{aiError}</p>}

          {aiPhase === 'input' && (
            <button
              className="btn btn-primary find-btn"
              onClick={handleAIRecommend}
              disabled={!hasEnoughInput()}
            >
              Find my movies ✦
            </button>
          )}

          {/* Streaming / thinking state */}
          {aiPhase === 'streaming' && (
            <div className="ai-thinking">
              <div className="ai-thinking-header">
                <span className="ai-thinking-dot" />
                <span>Finding your movies...</span>
              </div>
              <div className="ai-thinking-text">
                {streamingText || 'Analyzing your taste...'}
              </div>
            </div>
          )}

          {/* AI results grid */}
          {aiPhase === 'results' && aiResults.length > 0 && (
            <>
              <div className="ai-results-header">
                <h3>Your personalized picks</h3>
                <button className="ai-try-again-btn" onClick={resetAI}>
                  Try again
                </button>
              </div>
              <div className="ai-results-grid">
                {aiResults.map((rec, i) =>
                  rec.tmdbData ? (
                    <div key={`${rec.title}-${i}`} className="ai-result-item">
                      <span className={`confidence-badge confidence-badge--${rec.confidence}`}>
                        {rec.confidence === 'high' ? '★ High Match' : '◆ Good Match'}
                      </span>
                      <MovieCard
                        id={rec.tmdbData.id}
                        title={rec.tmdbData.title}
                        poster_path={rec.tmdbData.poster_path}
                        vote_average={rec.tmdbData.vote_average}
                        overview={rec.tmdbData.overview}
                        release_date={rec.tmdbData.release_date}
                        genres={rec.tmdbData.genres}
                        onOpenDetail={() => openMovieDetail(rec.tmdbData!.id)}
                      />
                      <p className="ai-reason">{rec.reason}</p>
                    </div>
                  ) : null
                )}
              </div>
            </>
          )}
        </div>

        {/* ── TMDb section ─────────────────────────────────────────────── */}
        {!user && <p className="please-login">Please log in to see recommendations.</p>}
        {tmdbLoading && <p className="loading-msg">Loading recommendations...</p>}

        {user && !favorites.length && !tmdbLoading && (
          <div className="empty-recs-wrapper">
            <h3>Nothing yet</h3>
            <p>
              Add some movies to your favorites so we can come up with recommendations
              that suit your tastes!
            </p>
            <Link to="/browse" className="btn btn-primary">Browse Movies</Link>
          </div>
        )}

        {showTMDbSection && (
          <div className="recs-grid-wrapper">
            <h2>More picks based on your favorites</h2>

            {generalRecs.length > 0 && (
              <div className="recommendation-group">
                <h3>Recommended for you</h3>
                <ScrollRow>
                  {generalRecs.map((movie) => (
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
                  {movies.map((movie) => (
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

        <MovieDetailModal isOpen={showModal} movieId={selectedMovieId} onClose={closeMovieDetail} />
      </Container>
    </section>
  );
};

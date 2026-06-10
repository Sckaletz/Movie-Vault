import { useState, useEffect } from "react";
import MovieCard from "../components/MovieCard";
import { useAuth } from "../context/AuthContext";
import { fetchSeenMovies } from "../lib/api";
import "../components/MovieGrid.css";
import "./SeenMovies.css";

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  release_date: string;
}

interface SeenMoviesProps {
  onSelectMovie: (id: number) => void;
  onSignIn: () => void;
}

function SeenMovies({ onSelectMovie, onSignIn }: SeenMoviesProps) {
  const { user, loading: authLoading, seenMovieIds } = useAuth();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const seenKey = Array.from(seenMovieIds).sort((a, b) => a - b).join(",");

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setMovies([]);
      setLoading(false);
      return;
    }

    const loadSeenMovies = async () => {
      setLoading(true);
      setError(null);

      try {
        const ids = await fetchSeenMovies();
        if (ids.length === 0) {
          setMovies([]);
          return;
        }

        const results = await Promise.all(
          ids.map(async (id) => {
            const response = await fetch(`${apiUrl}/movies/${id}`);
            if (!response.ok) return null;
            return response.json() as Promise<Movie>;
          }),
        );

        setMovies(results.filter((movie): movie is Movie => movie !== null));
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setMovies([]);
      } finally {
        setLoading(false);
      }
    };

    loadSeenMovies();
  }, [user, authLoading, seenKey, apiUrl]);

  if (authLoading || loading) {
    return <div className="seen-loading">Loading your seen movies...</div>;
  }

  if (!user) {
    return (
      <div className="seen-empty">
        <h1>Movies I&apos;ve Seen</h1>
        <p>Sign in to view and track movies you&apos;ve watched.</p>
        <button className="seen-signin-btn" onClick={onSignIn}>
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="movie-grid-container">
      <h1 className="grid-title">Movies I&apos;ve Seen</h1>

      {error && <div className="error-message">Error: {error}</div>}

      {movies.length > 0 ? (
        <div className="movie-grid">
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              isSeen
              onClick={() => onSelectMovie(movie.id)}
            />
          ))}
        </div>
      ) : (
        <div className="seen-empty-inline">
          <p>You haven&apos;t marked any movies as seen yet.</p>
          <p className="seen-empty-hint">
            Browse Popular or Trending and click &quot;Mark as Seen&quot; on a movie.
          </p>
        </div>
      )}
    </div>
  );
}

export default SeenMovies;

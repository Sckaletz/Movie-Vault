import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import "./MovieDetail.css";

interface MovieData {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  genres: Array<{ id: number; name: string }>;
  runtime: number;
  budget: number;
  revenue: number;
  cast: Array<{
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
  }>;
}

interface MovieDetailProps {
  movieId: number;
  onBack: () => void;
}

function MovieDetail({ movieId, onBack }: MovieDetailProps) {
  const [movie, setMovie] = useState<MovieData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seenLoading, setSeenLoading] = useState(false);
  const [seenError, setSeenError] = useState<string | null>(null);
  const { user, seenMovieIds, toggleSeen } = useAuth();

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const isSeen = seenMovieIds.has(movieId);

  useEffect(() => {
    const fetchMovieDetail = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${apiUrl}/movies/${movieId}`);
        if (!response.ok) throw new Error("Failed to fetch movie details");
        const data = await response.json();
        setMovie(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchMovieDetail();
  }, [movieId, apiUrl]);

  if (loading)
    return <div className="detail-loading">Loading movie details...</div>;
  if (error)
    return <div className="detail-error">Error: {error}</div>;
  if (!movie)
    return <div className="detail-error">Movie not found</div>;

  const backdropUrl = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
    : null;
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : null;
  const year = new Date(movie.release_date).getFullYear();

  const handleToggleSeen = async () => {
    if (!user) return;
    setSeenLoading(true);
    setSeenError(null);
    try {
      await toggleSeen(movieId);
    } catch (err) {
      setSeenError(
        err instanceof Error ? err.message : "Failed to update seen status",
      );
    } finally {
      setSeenLoading(false);
    }
  };

  return (
    <div className="movie-detail">
      <button className="back-btn" onClick={onBack}>
        ← Back
      </button>

      {backdropUrl && (
        <div className="detail-backdrop">
          <img src={backdropUrl} alt={movie.title} />
          <div className="backdrop-overlay" />
        </div>
      )}

      <div className="detail-content">
        <div className="detail-poster">
          {posterUrl ? (
            <img src={posterUrl} alt={movie.title} />
          ) : (
            <div className="no-poster-detail">No Poster</div>
          )}
        </div>

        <div className="detail-info">
          <h1>{movie.title}</h1>
          <p className="detail-year">{year}</p>

          <div className="seen-actions">
            {user ? (
              <button
                className={`seen-btn ${isSeen ? "seen-btn--active" : ""}`}
                onClick={handleToggleSeen}
                disabled={seenLoading}
              >
                {seenLoading
                  ? "Saving..."
                  : isSeen
                    ? "✓ Marked as Seen"
                    : "Mark as Seen"}
              </button>
            ) : (
              <p className="seen-login-hint">
                Sign in to track movies you&apos;ve seen
              </p>
            )}
            {seenError && <p className="seen-error">{seenError}</p>}
          </div>

          <div className="detail-meta">
            <div className="meta-item">
              <span className="meta-label">Rating:</span>
              <span className="rating-value">{movie.vote_average.toFixed(1)}/10</span>
            </div>
            {movie.runtime > 0 && (
              <div className="meta-item">
                <span className="meta-label">Runtime:</span>
                <span>{movie.runtime} minutes</span>
              </div>
            )}
          </div>

          {movie.genres.length > 0 && (
            <div className="genres">
              {movie.genres.map((genre) => (
                <span key={genre.id} className="genre-tag">
                  {genre.name}
                </span>
              ))}
            </div>
          )}

          <div className="overview">
            <h2>Overview</h2>
            <p>{movie.overview || "No overview available"}</p>
          </div>

          {movie.cast.length > 0 && (
            <div className="cast">
              <h2>Cast</h2>
              <div className="cast-list">
                {movie.cast.map((actor) => (
                  <div key={actor.id} className="cast-member">
                    <div className="cast-photo">
                      {actor.profile_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                          alt={actor.name}
                        />
                      ) : (
                        <div className="no-photo">No Photo</div>
                      )}
                    </div>
                    <div className="cast-info">
                      <p className="cast-name">{actor.name}</p>
                      <p className="cast-character">{actor.character}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MovieDetail;

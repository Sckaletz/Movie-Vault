import { useState, useEffect } from "react";
import MovieCard from "./MovieCard";
import { useAuth } from "../context/AuthContext";
import "./MovieGrid.css";

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  release_date: string;
}

interface MovieGridProps {
  endpoint?: "popular" | "trending";
  onSelectMovie: (id: number) => void;
  title?: string;
}

function MovieGrid({
  endpoint = "popular",
  onSelectMovie,
  title,
}: MovieGridProps) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { seenMovieIds } = useAuth();

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    fetchMovies(1);
  }, [endpoint]);

  const fetchMovies = async (pageNum: number) => {
    setLoading(true);
    setError(null);

    try {
      const url = `${apiUrl}/movies/${endpoint}?page=${pageNum}`;
      const response = await fetch(url);

      if (!response.ok) throw new Error("Failed to fetch movies");

      const data = await response.json();
      setMovies((prev) =>
        pageNum === 1 ? data.results : [...prev, ...data.results],
      );
      setPage(pageNum);
      setHasMore(pageNum < data.total_pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    fetchMovies(page + 1);
  };

  return (
    <div className="movie-grid-container">
      {title && <h1 className="grid-title">{title}</h1>}

      {error && <div className="error-message">Error: {error}</div>}

      <div className="movie-grid">
        {movies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            isSeen={seenMovieIds.has(movie.id)}
            onClick={() => onSelectMovie(movie.id)}
          />
        ))}
      </div>

      {hasMore && (
        <div className="load-more-container">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="load-more-btn"
          >
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}

      {movies.length === 0 && !loading && (
        <div className="no-movies">No movies found</div>
      )}
    </div>
  );
}

export default MovieGrid;

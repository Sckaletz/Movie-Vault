import "./MovieCard.css";

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  release_date: string;
}

interface MovieCardProps {
  movie: Movie;
  onClick: () => void;
}

function MovieCard({ movie, onClick }: MovieCardProps) {
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : null;

  const year = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : "N/A";

  return (
    <div className="movie-card" onClick={onClick}>
      <div className="movie-poster">
        {posterUrl ? (
          <img src={posterUrl} alt={movie.title} />
        ) : (
          <div className="no-poster">No Poster</div>
        )}
        {movie.vote_average > 0 && (
          <div className="movie-rating">{movie.vote_average.toFixed(1)}</div>
        )}
      </div>
      <div className="movie-info">
        <h3 className="movie-title" title={movie.title}>
          {movie.title}
        </h3>
        <p className="movie-year">{year}</p>
      </div>
    </div>
  );
}

export default MovieCard;

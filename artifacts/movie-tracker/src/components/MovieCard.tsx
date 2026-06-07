import { Link } from "wouter";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import type { Movie, ListEntry } from "@workspace/api-client-react";

type MovieCardProps = {
  movie: Movie | ListEntry;
  onClick?: () => void;
};

export const GENRES: Record<number, string> = {
  28:"Action",18:"Drama",35:"Comedy",27:"Horror",10749:"Romance",
  878:"Sci-Fi",53:"Thriller",16:"Animation",80:"Crime",12:"Adventure",
  14:"Fantasy",36:"History",10402:"Music",9648:"Mystery",10752:"War",37:"Western",
  99:"Documentary",10770:"TV Movie",10751:"Family"
};

export function MovieCard({ movie, onClick }: MovieCardProps) {
  const isListEntry = 'status' in movie;
  const tmdbId = isListEntry ? movie.tmdb_id : movie.tmdb_id;
  
  const posterUrl = movie.poster_path 
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group relative flex flex-col gap-2 cursor-pointer w-full h-full"
      onClick={onClick}
    >
      <Link href={`/movie/${tmdbId}`} className="block relative aspect-[2/3] overflow-hidden rounded-lg bg-muted/30">
        {posterUrl ? (
          <img 
            src={posterUrl} 
            alt={movie.title} 
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-secondary p-4 text-center">
            <span className="text-sm font-medium text-muted-foreground">{movie.title}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </Link>
      
      <div className="flex flex-col flex-1 px-1">
        <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors" title={movie.title}>
          {movie.title}
        </h3>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          {(!isListEntry && (movie as Movie).release_date) && (
            <span>{(movie as Movie).release_date?.substring(0, 4)}</span>
          )}
          
          {(isListEntry ? (movie as ListEntry).rating : (movie as Movie).vote_average) ? (
            <div className="flex items-center gap-1 text-primary">
              <Star className="h-3 w-3 fill-primary" />
              <span>
                {isListEntry
                  ? (movie as ListEntry).rating
                  : (movie as Movie).vote_average?.toFixed(1)}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}

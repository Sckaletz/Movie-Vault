import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Search, TrendingUp, Flame, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MovieCard } from "@/components/MovieCard";
import {
  useSearchMovies,
  useGetTrendingMovies,
  useGetPopularMovies,
  getSearchMoviesQueryKey,
} from "@workspace/api-client-react";

export default function Discovery() {
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [, setLocation] = useLocation();

  const { data: searchData, isLoading: searchLoading } = useSearchMovies(
    { q: activeQuery, page: 1 },
    { query: { enabled: activeQuery.length > 0, queryKey: getSearchMoviesQueryKey({ q: activeQuery, page: 1 }) } }
  );
  const { data: trendingData, isLoading: trendingLoading } = useGetTrendingMovies({ page: 1 });
  const { data: popularData, isLoading: popularLoading } = useGetPopularMovies({ page: 1 });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveQuery(query.trim());
  };

  const clearSearch = () => {
    setQuery("");
    setActiveQuery("");
  };

  const MovieGrid = ({ movies, loading }: { movies: typeof trendingData; loading: boolean }) => {
    if (loading) {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="aspect-[2/3] rounded-lg" />
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
            </div>
          ))}
        </div>
      );
    }
    if (!movies?.results?.length) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Search className="h-12 w-12 mb-4 opacity-30" />
          <p className="text-lg">No movies found</p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {movies.results.map((movie, i) => (
          <motion.div
            key={movie.tmdb_id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03, duration: 0.3 }}
          >
            <MovieCard movie={movie} onClick={() => setLocation(`/movie/${movie.tmdb_id}`)} />
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero search */}
      <div className="relative py-16 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3 tracking-tight">
            Discover Films
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            Explore trending cinema, find your next watch
          </p>
          <form onSubmit={handleSearch} className="max-w-xl mx-auto flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                data-testid="input-search"
                type="search"
                placeholder="Search movies..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 pr-10 bg-card border-border/60 h-12 text-base"
              />
              {query && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button type="submit" data-testid="button-search" className="h-12 px-6 font-semibold">
              Search
            </Button>
          </form>
        </motion.div>
      </div>

      <div className="container mx-auto px-4 pb-16 space-y-12">
        <AnimatePresence mode="wait">
          {activeQuery ? (
            <motion.section
              key="search"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  Results for &ldquo;{activeQuery}&rdquo;
                  {searchData && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      {searchData.total_results.toLocaleString()} films
                    </span>
                  )}
                </h2>
                <Button variant="ghost" size="sm" onClick={clearSearch}>
                  Clear
                </Button>
              </div>
              <MovieGrid movies={searchData} loading={searchLoading} />
            </motion.section>
          ) : (
            <motion.div
              key="browse"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-12"
            >
              <section>
                <h2 className="text-xl font-semibold flex items-center gap-2 mb-6">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Trending This Week
                </h2>
                <MovieGrid movies={trendingData} loading={trendingLoading} />
              </section>

              <section>
                <h2 className="text-xl font-semibold flex items-center gap-2 mb-6">
                  <Flame className="h-5 w-5 text-primary" />
                  Popular Right Now
                </h2>
                <MovieGrid movies={popularData} loading={popularLoading} />
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

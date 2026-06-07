import { motion } from "framer-motion";
import { Eye, Bookmark, Star, Film, BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import {
  useGetUserStats,
  useGetRecentActivity,
  getGetUserStatsQueryKey,
  getGetRecentActivityQueryKey,
} from "@workspace/api-client-react";
import { useLocation } from "wouter";

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.35 } }),
};

export default function Stats() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: stats, isLoading: statsLoading } = useGetUserStats(
    { userId: user?.id ?? "" },
    { query: { enabled: !!user, queryKey: getGetUserStatsQueryKey({ userId: user?.id ?? "" }) } }
  );

  const { data: recent, isLoading: recentLoading } = useGetRecentActivity(
    { userId: user?.id ?? "", limit: 6 },
    { query: { enabled: !!user, queryKey: getGetRecentActivityQueryKey({ userId: user?.id ?? "", limit: 6 }) } }
  );

  const statCards = [
    {
      icon: Eye,
      label: "Movies Watched",
      value: stats?.watched_count ?? 0,
      color: "text-primary",
      bg: "bg-primary/10 border-primary/20",
    },
    {
      icon: Bookmark,
      label: "Watchlist",
      value: stats?.want_to_see_count ?? 0,
      color: "text-amber-400",
      bg: "bg-amber-400/10 border-amber-400/20",
    },
    {
      icon: Star,
      label: "Avg. Rating",
      value: stats?.avg_rating != null ? stats.avg_rating.toFixed(1) : "—",
      color: "text-rose-400",
      bg: "bg-rose-400/10 border-rose-400/20",
    },
    {
      icon: Film,
      label: "Total in Library",
      value: (stats?.watched_count ?? 0) + (stats?.want_to_see_count ?? 0),
      color: "text-violet-400",
      bg: "bg-violet-400/10 border-violet-400/20",
    },
  ];

  const maxGenreCount = stats?.top_genres?.[0]?.count ?? 1;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-1">Your Stats</h1>
          <p className="text-muted-foreground">A snapshot of your film journey</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {statsLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))
            : statCards.map((card, i) => (
                <motion.div
                  key={card.label}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  data-testid={`stat-card-${card.label.toLowerCase().replace(/\s/g, "-")}`}
                  className={`rounded-xl border p-5 ${card.bg}`}
                >
                  <card.icon className={`h-6 w-6 mb-3 ${card.color}`} />
                  <div className={`text-3xl font-bold ${card.color}`}>{card.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{card.label}</div>
                </motion.div>
              ))}
        </div>

        {/* Top Genres */}
        {!statsLoading && stats?.top_genres && stats.top_genres.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mb-12"
          >
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-5">
              <BarChart3 className="h-5 w-5 text-primary" />
              Top Genres
            </h2>
            <div className="space-y-3">
              {stats.top_genres.map((genre, i) => {
                const pct = Math.round((genre.count / maxGenreCount) * 100);
                return (
                  <motion.div
                    key={genre.genre_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.07 }}
                    className="flex items-center gap-4"
                  >
                    <div className="w-24 text-sm text-muted-foreground text-right flex-shrink-0">
                      {genre.genre_name}
                    </div>
                    <div className="flex-1 bg-card rounded-full h-3 overflow-hidden border border-border/40">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.5 + i * 0.07, duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                    <div className="w-8 text-sm font-semibold text-right flex-shrink-0">
                      {genre.count}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* Recent Activity */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <h2 className="text-lg font-semibold mb-5">Recent Activity</h2>
          {recentLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : !recent || recent.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Film className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No activity yet. Start building your library.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.06 }}
                  data-testid={`activity-item-${entry.id}`}
                  className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border/40 cursor-pointer hover:border-primary/30 transition-colors"
                  onClick={() => setLocation(`/movie/${entry.tmdb_id}`)}
                >
                  {entry.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w92${entry.poster_path}`}
                      alt={entry.title}
                      className="w-10 h-14 object-cover rounded-lg flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-14 bg-muted rounded-lg flex-shrink-0 flex items-center justify-center">
                      <Film className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-1">{entry.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.status === "watched" ? "Watched" : "Added to watchlist"}
                    </p>
                  </div>
                  {entry.rating && (
                    <div className="flex items-center gap-1 text-amber-400 text-sm flex-shrink-0">
                      <Star className="h-3 w-3 fill-amber-400" />
                      {entry.rating}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
}

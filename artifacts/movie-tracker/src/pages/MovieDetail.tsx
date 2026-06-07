import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Star, Clock, Calendar, Eye, Bookmark, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  useGetMovieDetails,
  useGetUserList,
  useAddToList,
  useUpdateListEntry,
  useRemoveFromList,
  getGetUserListQueryKey,
  getGetMovieDetailsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const STAR_RATINGS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function MovieDetail() {
  const { id } = useParams<{ id: string }>();
  const tmdbId = parseInt(id ?? "0", 10);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<"watched" | "want_to_see">("watched");
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  const { data: movie, isLoading } = useGetMovieDetails(tmdbId, {
    query: { enabled: !!tmdbId, queryKey: getGetMovieDetailsQueryKey(tmdbId) },
  });

  const { data: userList } = useGetUserList(
    { userId: user?.id ?? "" },
    { query: { enabled: !!user, queryKey: getGetUserListQueryKey({ userId: user?.id ?? "" }) } }
  );

  const existingEntry = userList?.find((e) => e.tmdb_id === tmdbId);

  const addToList = useAddToList();
  const updateEntry = useUpdateListEntry();
  const removeFromList = useRemoveFromList();

  const invalidateLists = () => {
    queryClient.invalidateQueries({ queryKey: getGetUserListQueryKey({ userId: user?.id ?? "" }) });
  };

  const openAddDialog = (status: "watched" | "want_to_see") => {
    if (!user) { setLocation("/auth"); return; }
    setSelectedStatus(status);
    if (existingEntry) {
      setRating(existingEntry.rating ?? null);
      setNotes(existingEntry.notes ?? "");
    } else {
      setRating(null);
      setNotes("");
    }
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!user || !movie) return;
    const genreIds = movie.genres?.map((g) => g.id) ?? [];

    if (existingEntry) {
      updateEntry.mutate(
        { id: existingEntry.id, data: { status: selectedStatus, rating, notes: notes || null } },
        {
          onSuccess: () => {
            invalidateLists();
            setDialogOpen(false);
            toast({ title: "Updated", description: "Entry updated in your library." });
          },
        }
      );
    } else {
      addToList.mutate(
        {
          data: {
            user_id: user.id,
            tmdb_id: tmdbId,
            title: movie.title,
            poster_path: movie.poster_path ?? null,
            status: selectedStatus,
            rating,
            notes: notes || null,
            genre_ids: genreIds,
          },
        },
        {
          onSuccess: () => {
            invalidateLists();
            setDialogOpen(false);
            toast({ title: "Added", description: `"${movie.title}" added to your library.` });
          },
        }
      );
    }
  };

  const handleRemove = () => {
    if (!existingEntry) return;
    removeFromList.mutate(
      { id: existingEntry.id },
      {
        onSuccess: () => {
          invalidateLists();
          toast({ title: "Removed", description: "Removed from your library." });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="w-full h-[50vh]" />
        <div className="container mx-auto px-4 py-8 space-y-4">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-lg">Movie not found.</p>
      </div>
    );
  }

  const backdropUrl = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
    : null;
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Backdrop */}
      <div className="relative w-full h-[55vh] overflow-hidden">
        {backdropUrl ? (
          <img src={backdropUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-card" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />

        <button
          data-testid="button-back"
          onClick={() => setLocation("/")}
          className="absolute top-4 left-4 flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-black/30 backdrop-blur rounded-lg px-3 py-2 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 -mt-48 relative z-10 pb-16">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-shrink-0"
          >
            <div className="w-48 md:w-64 rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
              {posterUrl ? (
                <img src={posterUrl} alt={movie.title} className="w-full aspect-[2/3] object-cover" />
              ) : (
                <div className="w-full aspect-[2/3] bg-card flex items-center justify-center p-4">
                  <span className="text-center text-muted-foreground text-sm">{movie.title}</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1 pt-8 md:pt-16"
          >
            {movie.tagline && (
              <p className="text-primary text-sm font-medium tracking-wider uppercase mb-2">
                {movie.tagline}
              </p>
            )}
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-3">{movie.title}</h1>

            <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-muted-foreground">
              {movie.release_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {movie.release_date.substring(0, 4)}
                </span>
              )}
              {movie.runtime && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                </span>
              )}
              {movie.vote_average && (
                <span className="flex items-center gap-1 text-amber-400">
                  <Star className="h-4 w-4 fill-amber-400" />
                  {movie.vote_average.toFixed(1)} / 10
                </span>
              )}
            </div>

            {movie.genres && movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {movie.genres.map((g) => (
                  <span
                    key={g.id}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            {movie.overview && (
              <p className="text-muted-foreground leading-relaxed text-base mb-8 max-w-2xl">
                {movie.overview}
              </p>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 mb-8">
              {existingEntry ? (
                <>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary text-sm font-medium">
                    {existingEntry.status === "watched" ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <Bookmark className="h-4 w-4" />
                    )}
                    {existingEntry.status === "watched" ? "Watched" : "Want to See"}
                    {existingEntry.rating && (
                      <span className="ml-1 text-amber-400 flex items-center gap-1">
                        <Star className="h-3 w-3 fill-amber-400" />
                        {existingEntry.rating}
                      </span>
                    )}
                  </div>
                  <Button
                    data-testid="button-edit-entry"
                    variant="outline"
                    size="sm"
                    onClick={() => openAddDialog(existingEntry.status)}
                  >
                    Edit Entry
                  </Button>
                  <Button
                    data-testid="button-remove"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={handleRemove}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    data-testid="button-mark-watched"
                    onClick={() => openAddDialog("watched")}
                    className="font-semibold"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Mark as Watched
                  </Button>
                  <Button
                    data-testid="button-want-to-see"
                    variant="outline"
                    onClick={() => openAddDialog("want_to_see")}
                  >
                    <Bookmark className="h-4 w-4 mr-2" />
                    Want to See
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </div>

        {/* Cast */}
        {movie.cast && movie.cast.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-12"
          >
            <h2 className="text-xl font-semibold mb-5">Cast</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {movie.cast.map((actor) => (
                <div key={actor.id} className="flex flex-col items-center text-center gap-2">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-card ring-1 ring-white/10 flex-shrink-0">
                    {actor.profile_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                        alt={actor.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                        {actor.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-tight">{actor.name}</p>
                    <p className="text-xs text-muted-foreground leading-tight line-clamp-1">{actor.character}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-card border-border/60">
          <DialogHeader>
            <DialogTitle>
              {existingEntry ? "Edit Entry" : selectedStatus === "watched" ? "Mark as Watched" : "Add to Watchlist"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div>
              <Label className="mb-2 block text-sm">Status</Label>
              <div className="flex gap-3">
                {(["watched", "want_to_see"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedStatus(s)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      selectedStatus === s
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {s === "watched" ? "Watched" : "Want to See"}
                  </button>
                ))}
              </div>
            </div>
            {selectedStatus === "watched" && (
              <div>
                <Label className="mb-2 block text-sm">Your Rating (optional)</Label>
                <div className="flex gap-1 flex-wrap">
                  {STAR_RATINGS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      data-testid={`button-rating-${n}`}
                      onClick={() => setRating(rating === n ? null : n)}
                      className={`w-9 h-9 rounded-lg border text-sm font-semibold transition-colors ${
                        rating === n
                          ? "border-amber-400 bg-amber-400/20 text-amber-400"
                          : "border-border text-muted-foreground hover:border-amber-400/50"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <Label className="mb-2 block text-sm">Notes (optional)</Label>
              <Textarea
                data-testid="textarea-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Your thoughts on the film..."
                className="bg-background/50 resize-none"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              data-testid="button-save-entry"
              onClick={handleSave}
              disabled={addToList.isPending || updateEntry.isPending}
            >
              {addToList.isPending || updateEntry.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

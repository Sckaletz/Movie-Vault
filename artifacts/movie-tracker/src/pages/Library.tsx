import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Bookmark, Star, Trash2, Edit, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
  useGetUserList,
  useUpdateListEntry,
  useRemoveFromList,
  getGetUserListQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import type { ListEntry } from "@workspace/api-client-react";

const STAR_RATINGS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function Library() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const [activeTab, setActiveTab] = useState<"watched" | "want_to_see">("watched");
  const [editEntry, setEditEntry] = useState<ListEntry | null>(null);
  const [editRating, setEditRating] = useState<number | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState<"watched" | "want_to_see">("watched");

  const { data: list, isLoading } = useGetUserList(
    { userId: user?.id ?? "" },
    { query: { enabled: !!user, queryKey: getGetUserListQueryKey({ userId: user?.id ?? "" }) } }
  );

  const updateEntry = useUpdateListEntry();
  const removeFromList = useRemoveFromList();

  const invalidateLists = () => {
    queryClient.invalidateQueries({ queryKey: getGetUserListQueryKey({ userId: user?.id ?? "" }) });
  };

  const filtered = list?.filter((e) => e.status === activeTab) ?? [];

  const openEdit = (entry: ListEntry) => {
    setEditEntry(entry);
    setEditRating(entry.rating ?? null);
    setEditNotes(entry.notes ?? "");
    setEditStatus(entry.status);
  };

  const handleSave = () => {
    if (!editEntry) return;
    updateEntry.mutate(
      { id: editEntry.id, data: { status: editStatus, rating: editRating, notes: editNotes || null } },
      {
        onSuccess: () => {
          invalidateLists();
          setEditEntry(null);
          toast({ title: "Updated", description: "Entry updated." });
        },
      }
    );
  };

  const handleRemove = (entry: ListEntry) => {
    removeFromList.mutate(
      { id: entry.id },
      {
        onSuccess: () => {
          invalidateLists();
          toast({ title: "Removed", description: `"${entry.title}" removed.` });
        },
      }
    );
  };

  const watchedCount = list?.filter((e) => e.status === "watched").length ?? 0;
  const wantCount = list?.filter((e) => e.status === "want_to_see").length ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">My Library</h1>
          <p className="text-muted-foreground">Your personal film collection</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-border/40 pb-px">
          <button
            data-testid="tab-watched"
            onClick={() => setActiveTab("watched")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === "watched"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Eye className="h-4 w-4" />
            Watched
            <Badge variant="secondary" className="ml-1">{watchedCount}</Badge>
          </button>
          <button
            data-testid="tab-want-to-see"
            onClick={() => setActiveTab("want_to_see")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === "want_to_see"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Bookmark className="h-4 w-4" />
            Want to See
            <Badge variant="secondary" className="ml-1">{wantCount}</Badge>
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            {activeTab === "watched" ? (
              <Eye className="h-14 w-14 mb-4 text-muted-foreground/30" />
            ) : (
              <Bookmark className="h-14 w-14 mb-4 text-muted-foreground/30" />
            )}
            <h3 className="text-lg font-medium mb-2">
              {activeTab === "watched" ? "No watched movies yet" : "Watchlist is empty"}
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              {activeTab === "watched"
                ? "Mark movies as watched from the movie details page."
                : "Add movies to your watchlist to keep track of what you want to see."}
            </p>
            <Button onClick={() => setLocation("/")} variant="outline">
              Browse Movies
            </Button>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ delay: i * 0.03, duration: 0.2 }}
                  data-testid={`card-movie-${entry.id}`}
                  className="group flex gap-3 bg-card rounded-xl border border-border/40 overflow-hidden hover:border-primary/30 transition-colors"
                >
                  {/* Poster */}
                  <div
                    className="w-20 flex-shrink-0 cursor-pointer"
                    onClick={() => setLocation(`/movie/${entry.tmdb_id}`)}
                  >
                    {entry.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w185${entry.poster_path}`}
                        alt={entry.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full min-h-[7rem] bg-muted flex items-center justify-center p-2">
                        <span className="text-xs text-muted-foreground text-center">{entry.title}</span>
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex flex-col flex-1 py-3 pr-3 min-w-0">
                    <h3
                      className="font-semibold text-sm line-clamp-2 cursor-pointer hover:text-primary transition-colors mb-1"
                      onClick={() => setLocation(`/movie/${entry.tmdb_id}`)}
                    >
                      {entry.title}
                    </h3>
                    {entry.rating && (
                      <div className="flex items-center gap-1 text-amber-400 text-xs mb-1">
                        <Star className="h-3 w-3 fill-amber-400" />
                        <span>{entry.rating}/10</span>
                      </div>
                    )}
                    {entry.notes && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{entry.notes}</p>
                    )}
                    <div className="flex items-center gap-1 mt-auto opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        data-testid={`button-edit-${entry.id}`}
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={() => openEdit(entry)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        data-testid={`button-remove-${entry.id}`}
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                        onClick={() => handleRemove(entry)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editEntry} onOpenChange={(open) => !open && setEditEntry(null)}>
        <DialogContent className="max-w-md bg-card border-border/60">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              Edit: {editEntry?.title}
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
                    onClick={() => setEditStatus(s)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      editStatus === s
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {s === "watched" ? "Watched" : "Want to See"}
                  </button>
                ))}
              </div>
            </div>
            {editStatus === "watched" && (
              <div>
                <Label className="mb-2 block text-sm">Rating (optional)</Label>
                <div className="flex gap-1 flex-wrap">
                  {STAR_RATINGS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setEditRating(editRating === n ? null : n)}
                      className={`w-9 h-9 rounded-lg border text-sm font-semibold transition-colors ${
                        editRating === n
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
              <Label className="mb-2 block text-sm">Notes</Label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Your thoughts..."
                className="bg-background/50 resize-none"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditEntry(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={updateEntry.isPending}>
              {updateEntry.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

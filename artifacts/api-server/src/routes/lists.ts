import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, movieListsTable } from "@workspace/db";
import {
  GetUserListQueryParams,
  AddToListBody,
  UpdateListEntryParams,
  UpdateListEntryBody,
  RemoveFromListParams,
  GetUserStatsQueryParams,
  GetRecentActivityQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

const GENRE_NAMES: Record<number, string> = {
  28: "Action", 18: "Drama", 35: "Comedy", 27: "Horror", 10749: "Romance",
  878: "Sci-Fi", 53: "Thriller", 16: "Animation", 80: "Crime", 12: "Adventure",
  14: "Fantasy", 36: "History", 10402: "Music", 9648: "Mystery", 10752: "War",
  37: "Western", 99: "Documentary", 10770: "TV Movie", 10751: "Family",
};

function formatEntry(row: typeof movieListsTable.$inferSelect) {
  return {
    id: row.id,
    user_id: row.userId,
    tmdb_id: row.tmdbId,
    title: row.title,
    poster_path: row.posterPath ?? null,
    status: row.status,
    rating: row.rating ? parseFloat(row.rating) : null,
    notes: row.notes ?? null,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
    genre_ids: (row.genreIds as number[]) ?? [],
  };
}

router.get("/lists", async (req, res): Promise<void> => {
  const parsed = GetUserListQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { userId, status } = parsed.data;
  const conditions = [eq(movieListsTable.userId, userId)];
  if (status) {
    conditions.push(eq(movieListsTable.status, status));
  }
  const rows = await db
    .select()
    .from(movieListsTable)
    .where(and(...conditions))
    .orderBy(desc(movieListsTable.updatedAt));
  res.json(rows.map(formatEntry));
});

router.post("/lists", async (req, res): Promise<void> => {
  const parsed = AddToListBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { user_id, tmdb_id, title, poster_path, status, rating, notes, genre_ids } = parsed.data;

  // Check if entry already exists for this user+movie
  const existing = await db
    .select()
    .from(movieListsTable)
    .where(and(eq(movieListsTable.userId, user_id), eq(movieListsTable.tmdbId, tmdb_id)));

  if (existing.length > 0) {
    // Update existing
    const [updated] = await db
      .update(movieListsTable)
      .set({
        status,
        rating: rating != null ? String(rating) : null,
        notes: notes ?? null,
        posterPath: poster_path ?? null,
        updatedAt: new Date(),
      })
      .where(eq(movieListsTable.id, existing[0].id))
      .returning();
    res.status(201).json(formatEntry(updated));
    return;
  }

  const [row] = await db
    .insert(movieListsTable)
    .values({
      userId: user_id,
      tmdbId: tmdb_id,
      title,
      posterPath: poster_path ?? null,
      status,
      rating: rating != null ? String(rating) : null,
      notes: notes ?? null,
      genreIds: genre_ids ?? [],
    })
    .returning();
  res.status(201).json(formatEntry(row));
});

router.patch("/lists/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const paramsParsed = UpdateListEntryParams.safeParse({ id: rawId });
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const bodyParsed = UpdateListEntryBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error.message });
    return;
  }
  const { status, rating, notes } = bodyParsed.data;
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (status !== undefined) updateData.status = status;
  if (rating !== undefined) updateData.rating = rating != null ? String(rating) : null;
  if (notes !== undefined) updateData.notes = notes;

  const [row] = await db
    .update(movieListsTable)
    .set(updateData)
    .where(eq(movieListsTable.id, paramsParsed.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }
  res.json(formatEntry(row));
});

router.delete("/lists/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = RemoveFromListParams.safeParse({ id: rawId });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(movieListsTable).where(eq(movieListsTable.id, parsed.data.id));
  res.sendStatus(204);
});

router.get("/stats", async (req, res): Promise<void> => {
  const parsed = GetUserStatsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { userId } = parsed.data;
  const rows = await db
    .select()
    .from(movieListsTable)
    .where(eq(movieListsTable.userId, userId));

  const watched = rows.filter((r) => r.status === "watched");
  const wantToSee = rows.filter((r) => r.status === "want_to_see");

  const ratings = watched
    .map((r) => (r.rating ? parseFloat(r.rating) : null))
    .filter((r): r is number => r !== null);
  const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

  // Count genres
  const genreCounts: Record<number, number> = {};
  for (const row of rows) {
    const ids = (row.genreIds as number[]) ?? [];
    for (const id of ids) {
      genreCounts[id] = (genreCounts[id] ?? 0) + 1;
    }
  }
  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => ({
      genre_id: parseInt(id),
      genre_name: GENRE_NAMES[parseInt(id)] ?? "Unknown",
      count,
    }));

  res.json({
    watched_count: watched.length,
    want_to_see_count: wantToSee.length,
    avg_rating: avgRating,
    top_genres: topGenres,
    total_movies: rows.length,
  });
});

router.get("/activity", async (req, res): Promise<void> => {
  const parsed = GetRecentActivityQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { userId, limit = 10 } = parsed.data;
  const rows = await db
    .select()
    .from(movieListsTable)
    .where(eq(movieListsTable.userId, userId))
    .orderBy(desc(movieListsTable.updatedAt))
    .limit(limit);
  res.json(rows.map(formatEntry));
});

export default router;

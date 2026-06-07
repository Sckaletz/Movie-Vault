import { pgTable, text, integer, numeric, uuid, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const movieListsTable = pgTable("movie_lists", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  tmdbId: integer("tmdb_id").notNull(),
  title: text("title").notNull(),
  posterPath: text("poster_path"),
  status: text("status", { enum: ["watched", "want_to_see"] }).notNull(),
  rating: numeric("rating", { precision: 3, scale: 1 }),
  notes: text("notes"),
  genreIds: jsonb("genre_ids").$type<number[]>().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertMovieListSchema = createInsertSchema(movieListsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMovieList = z.infer<typeof insertMovieListSchema>;
export type MovieList = typeof movieListsTable.$inferSelect;

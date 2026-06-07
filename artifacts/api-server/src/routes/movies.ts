import { Router, type IRouter } from "express";
import {
  SearchMoviesQueryParams,
  GetTrendingMoviesQueryParams,
  GetPopularMoviesQueryParams,
  GetMovieDetailsParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_KEY = process.env.TMDB_API_KEY;

function tmdbHeaders() {
  return {
    Authorization: `Bearer ${TMDB_KEY}`,
    "Content-Type": "application/json",
  };
}

function mapMovie(m: Record<string, unknown>) {
  return {
    tmdb_id: m.id,
    title: m.title,
    overview: m.overview ?? null,
    poster_path: m.poster_path ?? null,
    backdrop_path: m.backdrop_path ?? null,
    release_date: m.release_date ?? null,
    vote_average: m.vote_average ?? null,
    genre_ids: m.genre_ids ?? [],
  };
}

router.get("/movies/search", async (req, res): Promise<void> => {
  const parsed = SearchMoviesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { q, page = 1 } = parsed.data;
  const url = `${TMDB_BASE}/search/movie?query=${encodeURIComponent(q)}&page=${page}&language=en-US`;
  const resp = await fetch(url, { headers: tmdbHeaders() });
  const data = (await resp.json()) as Record<string, unknown>;
  const results = (data.results as Record<string, unknown>[]) ?? [];
  res.json({
    results: results.map(mapMovie),
    total_results: data.total_results ?? 0,
    total_pages: data.total_pages ?? 0,
    page: data.page ?? 1,
  });
});

router.get("/movies/trending", async (req, res): Promise<void> => {
  const parsed = GetTrendingMoviesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { page = 1 } = parsed.data;
  const url = `${TMDB_BASE}/trending/movie/week?page=${page}&language=en-US`;
  const resp = await fetch(url, { headers: tmdbHeaders() });
  const data = (await resp.json()) as Record<string, unknown>;
  const results = (data.results as Record<string, unknown>[]) ?? [];
  res.json({
    results: results.map(mapMovie),
    total_results: data.total_results ?? 0,
    total_pages: data.total_pages ?? 0,
    page: data.page ?? 1,
  });
});

router.get("/movies/popular", async (req, res): Promise<void> => {
  const parsed = GetPopularMoviesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { page = 1 } = parsed.data;
  const url = `${TMDB_BASE}/movie/popular?page=${page}&language=en-US`;
  const resp = await fetch(url, { headers: tmdbHeaders() });
  const data = (await resp.json()) as Record<string, unknown>;
  const results = (data.results as Record<string, unknown>[]) ?? [];
  res.json({
    results: results.map(mapMovie),
    total_results: data.total_results ?? 0,
    total_pages: data.total_pages ?? 0,
    page: data.page ?? 1,
  });
});

router.get("/movies/:tmdbId", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.tmdbId) ? req.params.tmdbId[0] : req.params.tmdbId;
  const parsed = GetMovieDetailsParams.safeParse({ tmdbId: parseInt(rawId, 10) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid movie id" });
    return;
  }
  const { tmdbId } = parsed.data;
  const [movieResp, creditsResp] = await Promise.all([
    fetch(`${TMDB_BASE}/movie/${tmdbId}?language=en-US`, { headers: tmdbHeaders() }),
    fetch(`${TMDB_BASE}/movie/${tmdbId}/credits?language=en-US`, { headers: tmdbHeaders() }),
  ]);
  const movie = (await movieResp.json()) as Record<string, unknown>;
  const credits = (await creditsResp.json()) as Record<string, unknown>;
  const cast = ((credits.cast as Record<string, unknown>[]) ?? []).slice(0, 10).map((c) => ({
    id: c.id,
    name: c.name,
    character: c.character ?? "",
    profile_path: c.profile_path ?? null,
  }));
  const genres = ((movie.genres as Record<string, unknown>[]) ?? []).map((g) => ({
    id: g.id,
    name: g.name,
  }));
  res.json({
    tmdb_id: movie.id,
    title: movie.title,
    overview: movie.overview ?? null,
    poster_path: movie.poster_path ?? null,
    backdrop_path: movie.backdrop_path ?? null,
    release_date: movie.release_date ?? null,
    vote_average: movie.vote_average ?? null,
    runtime: movie.runtime ?? null,
    tagline: movie.tagline ?? null,
    genres,
    cast,
  });
});

export default router;

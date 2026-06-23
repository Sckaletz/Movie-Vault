import { Router } from "express";

const router = Router();

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_KEY = process.env.TMDB_API_KEY;

if (!TMDB_KEY) {
  console.warn("⚠️  TMDB_API_KEY is not set. Movies API will not work.");
}

function getTmdbHeaders() {
  return {
    Authorization: `Bearer ${TMDB_KEY}`,
    "Content-Type": "application/json",
  };
}

function mapMovie(m: any) {
  return {
    id: m.id,
    title: m.title,
    overview: m.overview ?? null,
    poster_path: m.poster_path ?? null,
    backdrop_path: m.backdrop_path ?? null,
    release_date: m.release_date ?? null,
    vote_average: m.vote_average ?? null,
    genre_ids: m.genre_ids ?? [],
  };
}

function validatePage(page: any): number {
  const pageNum = Number(page) || 1;
  if (pageNum < 1 || pageNum > 10000) {
    return 1;
  }
  return pageNum;
}

// Search movies
router.get("/movies/search", async (req, res) => {
  try {
    const { q, page } = req.query;

    if (!q) {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }

    const validatedPage = validatePage(page);
    const url = `${TMDB_BASE}/search/movie?query=${encodeURIComponent(String(q))}&page=${validatedPage}&language=en-US`;
    const response = await fetch(url, { headers: getTmdbHeaders() });
    const data = await response.json();

    res.json({
      results: (data.results ?? []).map(mapMovie),
      total_results: data.total_results ?? 0,
      total_pages: data.total_pages ?? 0,
      page: data.page ?? 1,
    });
  } catch (error) {
    console.error("Error searching movies:", (error as Error).message);
    res.status(500).json({ error: "Failed to search movies" });
  }
});

// Get trending movies
router.get("/movies/trending", async (req, res) => {
  try {
    const { page } = req.query;
    const validatedPage = validatePage(page);
    const url = `${TMDB_BASE}/trending/movie/week?page=${validatedPage}&language=en-US`;
    const response = await fetch(url, { headers: getTmdbHeaders() });
    const data = await response.json();

    res.json({
      results: (data.results ?? []).map(mapMovie),
      total_results: data.total_results ?? 0,
      total_pages: data.total_pages ?? 0,
      page: data.page ?? 1,
    });
  } catch (error) {
    console.error("Error fetching trending movies:", (error as Error).message);
    res.status(500).json({ error: "Failed to fetch trending movies" });
  }
});

// Get popular movies
router.get("/movies/popular", async (req, res) => {
  try {
    const { page } = req.query;
    const validatedPage = validatePage(page);
    const url = `${TMDB_BASE}/movie/popular?page=${validatedPage}&language=en-US`;
    const response = await fetch(url, { headers: getTmdbHeaders() });
    const data = await response.json();

    res.json({
      results: (data.results ?? []).map(mapMovie),
      total_results: data.total_results ?? 0,
      total_pages: data.total_pages ?? 0,
      page: data.page ?? 1,
    });
  } catch (error) {
    console.error("Error fetching popular movies:", (error as Error).message);
    res.status(500).json({ error: "Failed to fetch popular movies" });
  }
});

// Get movie details
router.get("/movies/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: "Valid movie ID is required" });
    }

    const [movieResponse, creditsResponse] = await Promise.all([
      fetch(`${TMDB_BASE}/movie/${id}?language=en-US`, { headers: getTmdbHeaders() }),
      fetch(`${TMDB_BASE}/movie/${id}/credits?language=en-US`, { headers: getTmdbHeaders() }),
    ]);

    const movie = await movieResponse.json();
    const credits = await creditsResponse.json();

    if (movie.success === false) {
      return res.status(404).json({ error: "Movie not found" });
    }

    res.json({
      ...mapMovie(movie),
      genres: movie.genres ?? [],
      runtime: movie.runtime ?? null,
      budget: movie.budget ?? null,
      revenue: movie.revenue ?? null,
      cast: (credits.cast ?? []).slice(0, 10).map((actor: any) => ({
        id: actor.id,
        name: actor.name,
        character: actor.character,
        profile_path: actor.profile_path,
      })),
    });
  } catch (error) {
    console.error("Error fetching movie details:", (error as Error).message);
    res.status(500).json({ error: "Failed to fetch movie details" });
  }
});

export default router;

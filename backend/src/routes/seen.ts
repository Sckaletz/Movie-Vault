import { Router } from "express";
import { pool } from "../db";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

router.get("/seen", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await pool.query(
      "SELECT movie_id, created_at FROM seen_movies WHERE user_id = $1 ORDER BY created_at DESC",
      [req.userId],
    );
    res.json({ movies: result.rows });
  } catch (error) {
    console.error("Error fetching seen movies:", error);
    res.status(500).json({ error: "Failed to fetch seen movies" });
  }
});

router.get("/seen/:movieId", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const movieId = Number(req.params.movieId);
    if (isNaN(movieId)) {
      return res.status(400).json({ error: "Valid movie ID is required" });
    }

    const result = await pool.query(
      "SELECT movie_id FROM seen_movies WHERE user_id = $1 AND movie_id = $2",
      [req.userId, movieId],
    );
    res.json({ seen: result.rows.length > 0 });
  } catch (error) {
    console.error("Error checking seen status:", error);
    res.status(500).json({ error: "Failed to check seen status" });
  }
});

router.post("/seen/:movieId", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const movieId = Number(req.params.movieId);
    if (isNaN(movieId)) {
      return res.status(400).json({ error: "Valid movie ID is required" });
    }

    await pool.query(
      `INSERT INTO seen_movies (user_id, movie_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, movie_id) DO NOTHING`,
      [req.userId, movieId],
    );
    res.json({ seen: true, movie_id: movieId });
  } catch (error) {
    console.error("Error marking movie as seen:", error);
    res.status(500).json({ error: "Failed to mark movie as seen" });
  }
});

router.delete("/seen/:movieId", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const movieId = Number(req.params.movieId);
    if (isNaN(movieId)) {
      return res.status(400).json({ error: "Valid movie ID is required" });
    }

    await pool.query(
      "DELETE FROM seen_movies WHERE user_id = $1 AND movie_id = $2",
      [req.userId, movieId],
    );
    res.json({ seen: false, movie_id: movieId });
  } catch (error) {
    console.error("Error unmarking movie as seen:", error);
    res.status(500).json({ error: "Failed to unmark movie as seen" });
  }
});

export default router;

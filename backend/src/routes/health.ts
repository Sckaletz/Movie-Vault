import { Router } from "express";
import myPool from "../db";

const router = Router();

router.get("/health", async (req, res) => {
  const result = await myPool.query("SELECT NOW()");
  res.json({ status: "ok", time: result.rows[0].now });
});

export default router;
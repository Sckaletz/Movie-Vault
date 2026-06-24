import express from "express";
import cors from "cors";
import movieRoutes from "./routes/movies";
import healthRoutes from "./routes/health";
import seenRoutes from "./routes/seen";
import { collectDefaultMetrics, register } from 'prom-client';

// Start collecting default metrics (CPU, Memory, etc) immediately
collectDefaultMetrics();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Routes
app.use("/api", healthRoutes);
app.use("/api", movieRoutes);
app.use("/api", seenRoutes);

export default app;

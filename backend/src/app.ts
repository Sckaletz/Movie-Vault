import express from "express";
import cors from "cors";
import movieRoutes from "./routes/movies";
import healthRoutes from "./routes/health";
import seenRoutes from "./routes/seen";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", healthRoutes);
app.use("/api", movieRoutes);
app.use("/api", seenRoutes);

export default app;

import express from "express";
import cors from "cors";
import movieRoutes from "./routes/movies";
import healthRoutes from "./routes/health";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", healthRoutes);
app.use("/api", movieRoutes);

export default app;

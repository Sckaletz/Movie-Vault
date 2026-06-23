import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import movieRoutes from "./routes/movies";
import healthRoutes from "./routes/health";
import seenRoutes from "./routes/seen";

const app = express();

// Dokploy runs containers behind Traefik. Without this, express-rate-limit
// sees every request as coming from the proxy's IP instead of the real client.
app.set("trust proxy", 1);

// Middleware: Configure CORS to only allow your frontend
const corsOptions = {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "10kb" })); // Prevent large payload DoS attacks

// Rate limiting: Prevent abuse and protect TMDB API quota
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per IP per window
    message: "Too many requests, please try again later",
    standardHeaders: true,
    legacyHeaders: false,
});

app.use("/api/", apiLimiter);

// Routes
app.use("/api", healthRoutes);
app.use("/api", movieRoutes);
app.use("/api", seenRoutes);

export default app;

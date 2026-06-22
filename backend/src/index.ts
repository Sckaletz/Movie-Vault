import "dotenv/config";
import app from "./app";
import { initDatabase } from "./db";

const PORT = process.env.PORT;

async function start() {
  try {
    await initDatabase();
    console.log("✅ Database initialized");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
}

start();

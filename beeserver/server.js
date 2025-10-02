import express from "express";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import scrapeRoutes from "./routes/scrapeRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import { runMigrations } from "./migrations/migrate.js";
import pool from "./db.js";

const app = express();
const PORT = 8080;

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send(" Express + Postgres + Puppeteer is live!");
});

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT NOW()");
    res.status(200).json({
      status: "ok",
      server: "running",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ DB health check failed:", error.message);
    res.status(500).json({
      status: "error",
      server: "running",
      database: "not connected",
      error: error.message,
    });
  }
});

app.use("/users", userRoutes);
app.use("/scrape", scrapeRoutes);
app.use("/api/jobs", jobRoutes);

const startServer = async () => {
  await runMigrations();
  app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
  });
};

startServer();

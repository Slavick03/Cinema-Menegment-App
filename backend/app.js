import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import userRouter from "./routes/user-router.js";
import adminRouter from "./routes/admin-router.js";
import movieRouter from "./routes/movie-router.js";
import bookingsRouter from "./routes/booking-router.js";
import { prisma } from "./lib/prisma.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootEnvPath = path.resolve(__dirname, "../.env");
const backendEnvPath = path.resolve(__dirname, ".env");

dotenv.config({ path: rootEnvPath });
dotenv.config({ path: backendEnvPath, override: false });

export const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use("/uploads", express.static(path.resolve(__dirname, "uploads")));

  app.get("/", (req, res) => {
    res.status(200).json({ message: "ShowPulse API is running" });
  });

  app.use("/user", userRouter);
  app.use("/admin", adminRouter);
  app.use("/movie", movieRouter);
  app.use("/booking", bookingsRouter);

  return app;
};

export const app = createApp();

export const startServer = async () => {
  const port = Number(process.env.PORT) || 5001;
  const databaseUrl = process.env.DATABASE_URL || "";

  if (!databaseUrl || databaseUrl.includes("undefined")) {
    console.error("PostgreSQL connection string is missing. Set DATABASE_URL in .env.");
    return null;
  }

  try {
    await prisma.$connect();

    const server = app.listen(port, () => {
      console.log(`Connected to database. Server running on port ${port}.`);
    });

    server.on("close", async () => {
      await prisma.$disconnect();
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(
          `Port ${port} is already in use. Change PORT in your .env or stop the process using that port.`,
        );
        return;
      }

      console.error("Failed to start HTTP server:", error);
    });

    return server;
  } catch (error) {
    console.error("Failed to start server:", error);
    return null;
  }
};

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (isDirectRun) {
  startServer();
}

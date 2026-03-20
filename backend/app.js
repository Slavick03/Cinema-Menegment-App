import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import userRouter from "./routes/user-router.js";
import adminRouter from "./routes/admin-router.js";
import movieRouter from "./routes/movie-router.js";
import bookingsRouter from "./routes/booking-router.js";
import Bookings from "./models/Bookings.js";
import Comment from "./models/Comment.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootEnvPath = path.resolve(__dirname, "../.env");
const backendEnvPath = path.resolve(__dirname, ".env");

dotenv.config({ path: rootEnvPath });
dotenv.config({ path: backendEnvPath, override: false });

const removeLegacyCommentIndexes = async () => {
  const commentCollection = mongoose.connection.collection("comments");
  const indexes = await commentCollection.indexes();
  const removableIndexNames = indexes
    .filter((index) => {
      if (!index.unique || index.name === "_id_") {
        return false;
      }

      const indexKeys = Object.keys(index.key || {});
      return (
        indexKeys.length === 1 &&
        ["user", "userEmail"].includes(indexKeys[0])
      );
    })
    .map((index) => index.name);

  for (const indexName of removableIndexNames) {
    await commentCollection.dropIndex(indexName);
    console.log(`Dropped legacy comment index: ${indexName}`);
  }
};

export const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());

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

const resolveMongoUri = () => {
  const mongoDatabase = process.env.MONGODB_DATABASE || "sample_mflix";
  const mongoCluster = process.env.MONGODB_CLUSTER || "cluster0.mongodb.net";

  return (
    process.env.MONGODB_URI ||
    (process.env.MONGODB_USERNAME && process.env.MONGODB_PASSWORD
      ? `mongodb+srv://${encodeURIComponent(process.env.MONGODB_USERNAME)}:${encodeURIComponent(process.env.MONGODB_PASSWORD)}@${mongoCluster}/${mongoDatabase}?retryWrites=true&w=majority`
      : "")
  );
};

export const startServer = async () => {
  const port = Number(process.env.PORT) || 5001;
  const mongoUri = resolveMongoUri();

  if (!mongoUri || mongoUri.includes("undefined")) {
    console.error(
      "MongoDB connection string is missing. Set MONGODB_URI or provide MONGODB_USERNAME and MONGODB_PASSWORD in .env.",
    );
    return null;
  }

  try {
    await mongoose.connect(mongoUri);
    await removeLegacyCommentIndexes();
    await Bookings.syncIndexes();
    await Comment.syncIndexes();

    const server = app.listen(port, () => {
      console.log(`Connected to database. Server running on port ${port}.`);
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
    if (error.code === "ENOTFOUND") {
      console.error(
        `Failed to resolve MongoDB host. Check MONGODB_URI/MONGODB_CLUSTER in .env: ${error.hostname}`,
      );
      return null;
    }

    console.error("Failed to start server:", error);
    return null;
  }
};

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (isDirectRun) {
  startServer();
}

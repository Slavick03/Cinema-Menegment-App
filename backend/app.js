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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootEnvPath = path.resolve(__dirname, "../.env");
const backendEnvPath = path.resolve(__dirname, ".env");

dotenv.config({ path: rootEnvPath });
dotenv.config({ path: backendEnvPath, override: false });

const app = express();
const port = Number(process.env.PORT) || 5001;
const mongoDatabase = process.env.MONGODB_DATABASE || "sample_mflix";
const mongoCluster = process.env.MONGODB_CLUSTER || "cluster0.mongodb.net";
const mongoUri =
  process.env.MONGODB_URI ||
  (process.env.MONGODB_USERNAME && process.env.MONGODB_PASSWORD
    ? `mongodb+srv://${encodeURIComponent(process.env.MONGODB_USERNAME)}:${encodeURIComponent(process.env.MONGODB_PASSWORD)}@${mongoCluster}/${mongoDatabase}?retryWrites=true&w=majority`
    : "");

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({ message: "ShowPulse API is running" });
});

app.use("/user", userRouter);
app.use("/admin", adminRouter);
app.use("/movie", movieRouter);
app.use("/booking", bookingsRouter);

if (!mongoUri || mongoUri.includes("undefined")) {
  console.error(
    "MongoDB connection string is missing. Set MONGODB_URI or provide MONGODB_USERNAME and MONGODB_PASSWORD in .env.",
  );
  process.exit(1);
}

const startServer = async () => {
  try {
    await mongoose.connect(mongoUri);

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
  } catch (error) {
    if (error.code === "ENOTFOUND") {
      console.error(
        `Failed to resolve MongoDB host. Check MONGODB_URI/MONGODB_CLUSTER in .env: ${error.hostname}`,
      );
      return;
    }

    console.error("Failed to start server:", error);
  }
};

startServer();

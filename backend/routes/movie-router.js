import express from "express";
import {
  addMovie,
  addMovieReview,
  deleteMovie,
  deleteMovieReview,
  getAllMovies,
  getHomeHeroSettings,
  getMovieById,
  updateMovie,
  updateMovieReview,
} from "../controller/movie-controller.js";
import { getThemeSettings } from "../controller/theme-controller.js";

const movieRouter = express.Router();
movieRouter.get("/", getAllMovies);
movieRouter.get("/home-hero", getHomeHeroSettings);
movieRouter.get("/theme", getThemeSettings);
movieRouter.get("/:id", getMovieById);
movieRouter.post("/:id/reviews", addMovieReview);
movieRouter.put("/:id/reviews/:reviewId", updateMovieReview);
movieRouter.delete("/:id/reviews/:reviewId", deleteMovieReview);
movieRouter.post("/", addMovie);
movieRouter.put("/:id", updateMovie);
movieRouter.delete("/:id", deleteMovie);

export default movieRouter;

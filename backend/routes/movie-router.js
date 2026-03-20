import express from "express";
import {
  addMovie,
  addMovieReview,
  deleteMovie,
  getAllMovies,
  getMovieById,
  updateMovie,
} from "../controller/movie-controller.js";

const movieRouter = express.Router();
movieRouter.get("/", getAllMovies);
movieRouter.get("/:id", getMovieById);
movieRouter.post("/:id/reviews", addMovieReview);
movieRouter.post("/", addMovie);
movieRouter.put("/:id", updateMovie);
movieRouter.delete("/:id", deleteMovie);

export default movieRouter;

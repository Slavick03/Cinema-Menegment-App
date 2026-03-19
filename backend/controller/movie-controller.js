import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Admin from "../models/Admin.js";
import Movie from "../models/Movie.js";

const hasEmptyValue = (...values) =>
  values.some((value) => typeof value !== "string" || value.trim() === "");

export const addMovie = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const extractedToken = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : "";

  if (!extractedToken) {
    return res.status(401).json({ message: "Token not found" });
  }

  let adminId;

  try {
    const decrypted = jwt.verify(extractedToken, process.env.SECRET_KEY);
    adminId = decrypted.id;
  } catch (err) {
    return res.status(401).json({ message: err.message });
  }

  const { title, description, releaseDate, posterUrl, featured, actors } =
    req.body;

  if (hasEmptyValue(title, description, posterUrl, releaseDate)) {
    return res.status(422).json({ message: "Invalid Inputs" });
  }

  if (!Array.isArray(actors) || actors.length === 0) {
    return res.status(422).json({ message: "At least one actor is required" });
  }

  let movie;
  const session = await mongoose.startSession();
  try {
    const adminUser = await Admin.findById(adminId);

    if (!adminUser) {
      session.endSession();
      return res.status(404).json({ message: "Admin not found" });
    }

    session.startTransaction();
    movie = new Movie({
      description: description.trim(),
      releaseDate: new Date(`${releaseDate}`),
      featured: Boolean(featured),
      actors: actors
        .map((actor) => `${actor}`.trim())
        .filter(Boolean),
      admin: adminId,
      posterUrl: posterUrl.trim(),
      title: title.trim(),
    });
    await movie.save({ session });
    adminUser.addedMovies.push(movie);
    await adminUser.save({ session });
    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    return res.status(500).json({ message: "Unable to add movie" });
  } finally {
    session.endSession();
  }

  return res.status(201).json({ movie });
};

export const getAllMovies = async (req, res, next) => {
  let movies;

  try {
    movies = await Movie.find();
  } catch (err) {
    return res.status(500).json({ message: "Request Failed" });
  }
  return res.status(200).json({ movies });
};

export const getMovieById = async (req, res, next) => {
  const id = req.params.id;
  let movie;
  try {
    movie = await Movie.findById(id);
  } catch (err) {
    return res.status(500).json({ message: "Unable to fetch movie" });
  }

  if (!movie) {
    return res.status(404).json({ message: "Invalid Movie ID" });
  }

  return res.status(200).json({ movie });
};

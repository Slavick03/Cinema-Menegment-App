import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Admin from "../models/Admin.js";
import Bookings from "../models/Bookings.js";
import Comment from "../models/Comment.js";
import Movie from "../models/Movie.js";
import User from "../models/User.js";

const hasEmptyValue = (...values) =>
  values.some((value) => typeof value !== "string" || value.trim() === "");

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const normalizeTicketPriceValue = (value) => {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value !== "string") {
    return Number.NaN;
  }

  return Number(value.trim().replace(",", "."));
};

const parseMovieReleaseDate = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const isoDateMatch = trimmedValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (isoDateMatch) {
    const [, year, month, day] = isoDateMatch;
    const normalizedDate = new Date(
      Date.UTC(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0)
    );

    return Number.isNaN(normalizedDate.getTime()) ? null : normalizedDate;
  }

  const parsedDate = new Date(trimmedValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
};

const getAdminIdFromToken = (authHeader = "") => {
  const extractedToken = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : "";

  if (!extractedToken) {
    return { error: "Token not found" };
  }

  try {
    const decrypted = jwt.verify(extractedToken, process.env.SECRET_KEY);
    return { adminId: decrypted.id };
  } catch (err) {
    return { error: err.message };
  }
};

const mapRatingStats = (ratingStats) =>
  ratingStats.reduce((accumulator, item) => {
    accumulator[item._id.toString()] = {
      averageRating: Number(item.averageRating.toFixed(1)),
      ratingsCount: item.ratingsCount,
    };
    return accumulator;
  }, {});

const getMovieRatingsMap = async (movieIds) => {
  if (!movieIds.length) {
    return {};
  }

  const ratingStats = await Comment.aggregate([
    {
      $match: {
        movie: {
          $in: movieIds.map((id) => new mongoose.Types.ObjectId(id)),
        },
      },
    },
    {
      $group: {
        _id: "$movie",
        averageRating: { $avg: "$rating" },
        ratingsCount: { $sum: 1 },
      },
    },
  ]);

  return mapRatingStats(ratingStats);
};

export const addMovie = async (req, res, next) => {
  const { adminId, error } = getAdminIdFromToken(req.headers.authorization || "");

  if (error) {
    return res.status(401).json({ message: error });
  }

  const { title, description, releaseDate, posterUrl, featured, actors, ticketPrice } =
    req.body;
  const normalizedActors = Array.isArray(actors)
    ? actors.map((actor) => `${actor}`.trim()).filter(Boolean)
    : [];
  const normalizedTicketPrice = normalizeTicketPriceValue(ticketPrice);
  const normalizedReleaseDate = parseMovieReleaseDate(releaseDate);

  if (hasEmptyValue(title, description, posterUrl, releaseDate)) {
    return res.status(422).json({ message: "Invalid Inputs" });
  }

  if (!Number.isFinite(normalizedTicketPrice) || normalizedTicketPrice <= 0) {
    return res.status(422).json({ message: "Ticket price must be greater than 0" });
  }

  if (!normalizedReleaseDate) {
    return res.status(422).json({ message: "Release date is invalid" });
  }

  if (!normalizedActors.length) {
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
      releaseDate: normalizedReleaseDate,
      featured: Boolean(featured),
      actors: normalizedActors,
      admin: adminId,
      posterUrl: posterUrl.trim(),
      ticketPrice: normalizedTicketPrice,
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

export const updateMovie = async (req, res, next) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid movie ID" });
  }

  const { adminId, error } = getAdminIdFromToken(req.headers.authorization || "");

  if (error) {
    return res.status(401).json({ message: error });
  }

  const { title, description, releaseDate, posterUrl, featured, actors, ticketPrice } =
    req.body;
  const normalizedActors = Array.isArray(actors)
    ? actors.map((actor) => `${actor}`.trim()).filter(Boolean)
    : [];
  const normalizedTicketPrice = normalizeTicketPriceValue(ticketPrice);
  const normalizedReleaseDate = parseMovieReleaseDate(releaseDate);

  if (hasEmptyValue(title, description, posterUrl, releaseDate)) {
    return res.status(422).json({ message: "Invalid Inputs" });
  }

  if (!Number.isFinite(normalizedTicketPrice) || normalizedTicketPrice <= 0) {
    return res.status(422).json({ message: "Ticket price must be greater than 0" });
  }

  if (!normalizedReleaseDate) {
    return res.status(422).json({ message: "Release date is invalid" });
  }

  if (!normalizedActors.length) {
    return res.status(422).json({ message: "At least one actor is required" });
  }

  let movie;

  try {
    movie = await Movie.findById(id);
  } catch (err) {
    return res.status(500).json({ message: "Unable to update movie" });
  }

  if (!movie) {
    return res.status(404).json({ message: "Movie not found" });
  }

  if (movie.admin.toString() !== adminId) {
    return res.status(403).json({ message: "You can edit only your own movies" });
  }

  try {
    movie.title = title.trim();
    movie.description = description.trim();
    movie.releaseDate = normalizedReleaseDate;
    movie.posterUrl = posterUrl.trim();
    movie.featured = Boolean(featured);
    movie.actors = normalizedActors;
    movie.ticketPrice = normalizedTicketPrice;
    await movie.save();
  } catch (err) {
    return res.status(500).json({ message: "Unable to update movie" });
  }

  return res.status(200).json({ message: "Movie updated successfully", movie });
};

export const deleteMovie = async (req, res, next) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid movie ID" });
  }

  const { adminId, error } = getAdminIdFromToken(req.headers.authorization || "");

  if (error) {
    return res.status(401).json({ message: error });
  }

  let movie;
  let adminUser;
  const session = await mongoose.startSession();

  try {
    movie = await Movie.findById(id);

    if (!movie) {
      session.endSession();
      return res.status(404).json({ message: "Movie not found" });
    }

    if (movie.admin.toString() !== adminId) {
      session.endSession();
      return res.status(403).json({ message: "You can delete only your own movies" });
    }

    adminUser = await Admin.findById(adminId);

    if (!adminUser) {
      session.endSession();
      return res.status(404).json({ message: "Admin not found" });
    }

    const bookings = await Bookings.find({ movie: id }).select("_id user");
    const bookingIds = bookings.map((booking) => booking._id);
    const userIds = [...new Set(bookings.map((booking) => booking.user.toString()))];

    session.startTransaction();

    if (bookingIds.length) {
      await User.updateMany(
        { _id: { $in: userIds } },
        { $pull: { bookings: { $in: bookingIds } } },
        { session }
      );

      await Bookings.deleteMany({ _id: { $in: bookingIds } }, { session });
    }

    await Comment.deleteMany({ movie: id }, { session });
    adminUser.addedMovies.pull(movie._id);
    await adminUser.save({ session });
    await Movie.findByIdAndDelete(id, { session });
    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    return res.status(500).json({ message: "Unable to delete movie" });
  } finally {
    session.endSession();
  }

  return res.status(200).json({ message: "Movie deleted successfully" });
};

export const getAllMovies = async (req, res, next) => {
  let movies;
  let ratingsMap;

  try {
    movies = await Movie.find();
    ratingsMap = await getMovieRatingsMap(movies.map((movie) => movie._id));
  } catch (err) {
    return res.status(500).json({ message: "Request Failed" });
  }

  const moviesWithRatings = movies.map((movie) => {
    const rating = ratingsMap[movie._id.toString()] || {
      averageRating: 0,
      ratingsCount: 0,
    };

    return {
      ...movie.toObject(),
      averageRating: rating.averageRating,
      ratingsCount: rating.ratingsCount,
    };
  });

  return res.status(200).json({ movies: moviesWithRatings });
};

export const getMovieById = async (req, res, next) => {
  const id = req.params.id;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid movie ID" });
  }

  let movie;
  let comments;
  let ratingsMap;
  try {
    movie = await Movie.findById(id);
    comments = await Comment.find({ movie: id }).sort({ updatedAt: -1 });
    ratingsMap = await getMovieRatingsMap([id]);
  } catch (err) {
    return res.status(500).json({ message: "Unable to fetch movie" });
  }

  if (!movie) {
    return res.status(404).json({ message: "Invalid Movie ID" });
  }

  const rating = ratingsMap[id] || {
    averageRating: 0,
    ratingsCount: 0,
  };

  return res.status(200).json({
    movie: {
      ...movie.toObject(),
      averageRating: rating.averageRating,
      ratingsCount: rating.ratingsCount,
    },
    comments,
  });
};

export const addMovieReview = async (req, res, next) => {
  const movieId = req.params.id;
  const { user: userId, rating, comment } = req.body;

  if (!isValidObjectId(movieId) || !isValidObjectId(userId)) {
    return res.status(400).json({ message: "Invalid movie or user ID" });
  }

  if (hasEmptyValue(userId, comment)) {
    return res.status(422).json({ message: "Invalid review input" });
  }

  const numericRating = Number(rating);

  if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
    return res.status(422).json({ message: "Rating must be between 1 and 5" });
  }

  let movie;
  let user;

  try {
    movie = await Movie.findById(movieId);
    user = await User.findById(userId);
  } catch (err) {
    return res.status(500).json({ message: "Unable to save review" });
  }

  if (!movie) {
    return res.status(404).json({ message: "Movie not found" });
  }

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const trimmedComment = comment.trim();

  try {
    await Comment.create({
      movie: movie._id,
      movieTitle: movie.title.trim(),
      user: user._id,
      userName: user.name.trim(),
      userEmail: user.email.trim(),
      text: trimmedComment,
      rating: numericRating,
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({
        message:
          "A database unique index is blocking repeated reviews from the same account. Restart the backend so comment indexes can be synchronized.",
      });
    }

    return res.status(500).json({ message: "Unable to save review" });
  }

  let comments;
  let ratingsMap;
  try {
    comments = await Comment.find({ movie: movie._id }).sort({ updatedAt: -1 });
    ratingsMap = await getMovieRatingsMap([movie._id]);
  } catch (err) {
    return res.status(500).json({ message: "Unable to fetch reviews" });
  }

  const ratingSummary = ratingsMap[movie._id.toString()] || {
    averageRating: 0,
    ratingsCount: 0,
  };

  return res.status(200).json({
    message: "Review added successfully",
    comments,
    averageRating: ratingSummary.averageRating,
    ratingsCount: ratingSummary.ratingsCount,
  });
};

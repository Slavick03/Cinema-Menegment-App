import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import {
  serializeComment,
  serializeMovie,
} from "../utils/serializers.js";

const hasEmptyValue = (...values) =>
  values.some((value) => typeof value !== "string" || value.trim() === "");

const isValidObjectId = (value) =>
  typeof value === "string" && value.trim() !== "";

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
      Date.UTC(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0),
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
    accumulator[item.movieId] = {
      averageRating: Number((item._avg.rating || 0).toFixed(1)),
      ratingsCount: item._count.rating,
    };
    return accumulator;
  }, {});

const getMovieRatingsMap = async (movieIds) => {
  if (!movieIds.length) {
    return {};
  }

  const ratingStats = await prisma.comment.groupBy({
    by: ["movieId"],
    where: {
      movieId: {
        in: movieIds,
      },
    },
    _avg: {
      rating: true,
    },
    _count: {
      rating: true,
    },
  });

  return mapRatingStats(ratingStats);
};

export const addMovie = async (req, res, next) => {
  const { adminId, error } = getAdminIdFromToken(req.headers.authorization || "");

  if (error) {
    return res.status(401).json({ message: error });
  }

  const {
    title,
    description,
    releaseDate,
    posterUrl,
    featured,
    actors,
    ticketPrice,
  } = req.body;
  const normalizedActors = Array.isArray(actors)
    ? actors.map((actor) => `${actor}`.trim()).filter(Boolean)
    : [];
  const normalizedTicketPrice = normalizeTicketPriceValue(ticketPrice);
  const normalizedReleaseDate = parseMovieReleaseDate(releaseDate);

  if (hasEmptyValue(title, description, posterUrl, releaseDate)) {
    return res.status(422).json({ message: "Invalid Inputs" });
  }

  if (!Number.isFinite(normalizedTicketPrice) || normalizedTicketPrice <= 0) {
    return res
      .status(422)
      .json({ message: "Ticket price must be greater than 0" });
  }

  if (!normalizedReleaseDate) {
    return res.status(422).json({ message: "Release date is invalid" });
  }

  if (!normalizedActors.length) {
    return res.status(422).json({ message: "At least one actor is required" });
  }

  let movie;
  try {
    const adminUser = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!adminUser) {
      return res.status(404).json({ message: "Admin not found" });
    }

    movie = await prisma.movie.create({
      data: {
        description: description.trim(),
        releaseDate: normalizedReleaseDate,
        featured: Boolean(featured),
        actors: normalizedActors,
        adminId,
        posterUrl: posterUrl.trim(),
        ticketPrice: normalizedTicketPrice,
        title: title.trim(),
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Unable to add movie" });
  }

  return res.status(201).json({ movie: serializeMovie(movie) });
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

  const {
    title,
    description,
    releaseDate,
    posterUrl,
    featured,
    actors,
    ticketPrice,
  } = req.body;
  const normalizedActors = Array.isArray(actors)
    ? actors.map((actor) => `${actor}`.trim()).filter(Boolean)
    : [];
  const normalizedTicketPrice = normalizeTicketPriceValue(ticketPrice);
  const normalizedReleaseDate = parseMovieReleaseDate(releaseDate);

  if (hasEmptyValue(title, description, posterUrl, releaseDate)) {
    return res.status(422).json({ message: "Invalid Inputs" });
  }

  if (!Number.isFinite(normalizedTicketPrice) || normalizedTicketPrice <= 0) {
    return res
      .status(422)
      .json({ message: "Ticket price must be greater than 0" });
  }

  if (!normalizedReleaseDate) {
    return res.status(422).json({ message: "Release date is invalid" });
  }

  if (!normalizedActors.length) {
    return res.status(422).json({ message: "At least one actor is required" });
  }

  let movie;

  try {
    movie = await prisma.movie.findUnique({
      where: { id },
    });
  } catch (err) {
    return res.status(500).json({ message: "Unable to update movie" });
  }

  if (!movie) {
    return res.status(404).json({ message: "Movie not found" });
  }

  if (movie.adminId !== adminId) {
    return res
      .status(403)
      .json({ message: "You can edit only your own movies" });
  }

  try {
    movie = await prisma.movie.update({
      where: { id },
      data: {
        title: title.trim(),
        description: description.trim(),
        releaseDate: normalizedReleaseDate,
        posterUrl: posterUrl.trim(),
        featured: Boolean(featured),
        actors: normalizedActors,
        ticketPrice: normalizedTicketPrice,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Unable to update movie" });
  }

  return res.status(200).json({
    message: "Movie updated successfully",
    movie: serializeMovie(movie),
  });
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

  try {
    movie = await prisma.movie.findUnique({
      where: { id },
    });
  } catch (err) {
    return res.status(500).json({ message: "Unable to delete movie" });
  }

  if (!movie) {
    return res.status(404).json({ message: "Movie not found" });
  }

  if (movie.adminId !== adminId) {
    return res
      .status(403)
      .json({ message: "You can delete only your own movies" });
  }

  try {
    await prisma.movie.delete({
      where: { id },
    });
  } catch (err) {
    return res.status(500).json({ message: "Unable to delete movie" });
  }

  return res.status(200).json({ message: "Movie deleted successfully" });
};

export const getAllMovies = async (req, res, next) => {
  let movies;
  let ratingsMap;

  try {
    movies = await prisma.movie.findMany();
    ratingsMap = await getMovieRatingsMap(movies.map((movie) => movie.id));
  } catch (err) {
    return res.status(500).json({ message: "Request Failed" });
  }

  const moviesWithRatings = movies.map((movie) => {
    const rating = ratingsMap[movie.id] || {
      averageRating: 0,
      ratingsCount: 0,
    };

    return {
      ...serializeMovie(movie),
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
    [movie, comments, ratingsMap] = await Promise.all([
      prisma.movie.findUnique({
        where: { id },
      }),
      prisma.comment.findMany({
        where: { movieId: id },
        orderBy: { updatedAt: "desc" },
      }),
      getMovieRatingsMap([id]),
    ]);
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
      ...serializeMovie(movie),
      averageRating: rating.averageRating,
      ratingsCount: rating.ratingsCount,
    },
    comments: comments.map(serializeComment),
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

  if (
    !Number.isInteger(numericRating) ||
    numericRating < 1 ||
    numericRating > 5
  ) {
    return res.status(422).json({ message: "Rating must be between 1 and 5" });
  }

  let movie;
  let user;

  try {
    [movie, user] = await Promise.all([
      prisma.movie.findUnique({ where: { id: movieId } }),
      prisma.user.findUnique({ where: { id: userId } }),
    ]);
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
    await prisma.comment.create({
      data: {
        movieId: movie.id,
        movieTitle: movie.title.trim(),
        userId: user.id,
        userName: user.name.trim(),
        userEmail: user.email.trim(),
        text: trimmedComment,
        rating: numericRating,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Unable to save review" });
  }

  let comments;
  let ratingsMap;
  try {
    [comments, ratingsMap] = await Promise.all([
      prisma.comment.findMany({
        where: { movieId: movie.id },
        orderBy: { updatedAt: "desc" },
      }),
      getMovieRatingsMap([movie.id]),
    ]);
  } catch (err) {
    return res.status(500).json({ message: "Unable to fetch reviews" });
  }

  const ratingSummary = ratingsMap[movie.id] || {
    averageRating: 0,
    ratingsCount: 0,
  };

  return res.status(200).json({
    message: "Review added successfully",
    comments: comments.map(serializeComment),
    averageRating: ratingSummary.averageRating,
    ratingsCount: ratingSummary.ratingsCount,
  });
};

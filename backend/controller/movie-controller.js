import { prisma } from "../lib/prisma.js";
import { verifyToken } from "../middleware/auth.js";
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

const normalizeSeatCountValue = (value) => {
  if (typeof value === "number") {
    return Math.trunc(value);
  }

  if (typeof value !== "string") {
    return Number.NaN;
  }

  return Math.trunc(Number(value.trim()));
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

const parseShowtimeDateTime = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const parsedDate = new Date(trimmedValue);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const normalizeShowtimes = (showtimes, fallbackTicketPrice) => {
  if (!Array.isArray(showtimes)) {
    return [];
  }

  return showtimes
    .map((showtime) => {
      const startTime = parseShowtimeDateTime(showtime?.startTime);
      const hall = `${showtime?.hall || ""}`.trim();
      const price =
        showtime?.price === undefined || showtime?.price === null || `${showtime.price}`.trim() === ""
          ? fallbackTicketPrice
          : normalizeTicketPriceValue(showtime.price);
      const totalSeats = normalizeSeatCountValue(showtime?.totalSeats);

      if (
        !startTime ||
        !hall ||
        !Number.isFinite(price) ||
        price <= 0 ||
        !Number.isInteger(totalSeats) ||
        totalSeats <= 0
      ) {
        return null;
      }

      return {
        startTime,
        hall,
        price,
        totalSeats,
      };
    })
    .filter(Boolean);
};

const getShowtimeSignature = (showtime) =>
  JSON.stringify({
    startTime:
      showtime.startTime instanceof Date
        ? showtime.startTime.toISOString()
        : new Date(showtime.startTime).toISOString(),
    hall: `${showtime.hall || ""}`.trim(),
    price: Number(showtime.price),
    totalSeats: Number(showtime.totalSeats),
  });

const getAdminIdFromToken = (authHeader = "") => {
  const { payload, error } = verifyToken(authHeader);

  if (error) {
    return { error };
  }

  return { adminId: payload.id };
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

const parseMovieQueryDate = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  return parseMovieReleaseDate(value);
};

const normalizeMovieStatus = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
};

const normalizeSortField = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().toLowerCase();
};

const normalizeSortOrder = (value) => {
  if (typeof value !== "string") {
    return "desc";
  }

  return value.trim().toLowerCase() === "asc" ? "asc" : "desc";
};

const getMovieStatusPredicate = (status, now) => {
  if (status === "featured") {
    return (movie) => movie.featured;
  }

  if (status === "upcoming") {
    return (movie) => movie.releaseDate > now;
  }

  if (status === "now_showing") {
    return (movie) => movie.releaseDate <= now;
  }

  return null;
};

const sortMovies = (movies, sortBy, sortOrder) => {
  if (!sortBy) {
    return movies;
  }

  const sortDirection = sortOrder === "asc" ? 1 : -1;
  const sortedMovies = [...movies];

  sortedMovies.sort((leftMovie, rightMovie) => {
    if (sortBy === "price") {
      return (leftMovie.ticketPrice - rightMovie.ticketPrice) * sortDirection;
    }

    if (sortBy === "rating") {
      if (leftMovie.averageRating === rightMovie.averageRating) {
        return (leftMovie.ratingsCount - rightMovie.ratingsCount) * sortDirection;
      }

      return (leftMovie.averageRating - rightMovie.averageRating) * sortDirection;
    }

    return 0;
  });

  return sortedMovies;
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
    showtimes,
  } = req.body;
  const normalizedActors = Array.isArray(actors)
    ? actors.map((actor) => `${actor}`.trim()).filter(Boolean)
    : [];
  const normalizedTicketPrice = normalizeTicketPriceValue(ticketPrice);
  const normalizedReleaseDate = parseMovieReleaseDate(releaseDate);
  const normalizedShowtimes = normalizeShowtimes(showtimes, normalizedTicketPrice);

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

  if (!normalizedShowtimes.length) {
    return res.status(422).json({ message: "Add at least one valid showtime" });
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
        showtimes: {
          create: normalizedShowtimes,
        },
      },
      include: {
        showtimes: {
          orderBy: { startTime: "asc" },
        },
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
    showtimes,
  } = req.body;
  const normalizedActors = Array.isArray(actors)
    ? actors.map((actor) => `${actor}`.trim()).filter(Boolean)
    : [];
  const normalizedTicketPrice = normalizeTicketPriceValue(ticketPrice);
  const normalizedReleaseDate = parseMovieReleaseDate(releaseDate);
  const normalizedShowtimes = normalizeShowtimes(showtimes, normalizedTicketPrice);

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

  if (!normalizedShowtimes.length) {
    return res.status(422).json({ message: "Add at least one valid showtime" });
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

  let existingShowtimes;

  try {
    existingShowtimes = await prisma.showtime.findMany({
      where: { movieId: id },
      include: {
        _count: {
          select: { bookings: true },
        },
      },
      orderBy: { startTime: "asc" },
    });
  } catch (err) {
    return res.status(500).json({ message: "Unable to validate existing showtimes" });
  }

  const hasBookedShowtimes = existingShowtimes.some(
    (showtime) => showtime._count?.bookings > 0
  );
  const showtimesChanged =
    existingShowtimes.length !== normalizedShowtimes.length ||
    existingShowtimes.some(
      (showtime, index) =>
        getShowtimeSignature(showtime) !== getShowtimeSignature(normalizedShowtimes[index])
    );

  if (hasBookedShowtimes && showtimesChanged) {
    return res.status(409).json({
      message:
        "This movie already has bookings. Update the showtimes only after moving or cancelling existing bookings.",
    });
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
        showtimes: {
          deleteMany: {},
          create: normalizedShowtimes,
        },
      },
      include: {
        showtimes: {
          orderBy: { startTime: "asc" },
        },
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
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const releaseDateFrom = parseMovieQueryDate(req.query.releaseDateFrom);
  const releaseDateTo = parseMovieQueryDate(req.query.releaseDateTo);
  const status = normalizeMovieStatus(req.query.status);
  const sortBy = normalizeSortField(req.query.sortBy);
  const sortOrder = normalizeSortOrder(req.query.sortOrder);
  const statusPredicate = getMovieStatusPredicate(status, new Date());
  const where = {};

  if (search) {
    where.title = {
      contains: search,
      mode: "insensitive",
    };
  }

  if (releaseDateFrom || releaseDateTo) {
    where.releaseDate = {};

    if (releaseDateFrom) {
      where.releaseDate.gte = releaseDateFrom;
    }

    if (releaseDateTo) {
      where.releaseDate.lte = releaseDateTo;
    }
  }

  let movies;
  let ratingsMap;

  try {
    movies = await prisma.movie.findMany({
      where,
      include: {
        showtimes: {
          orderBy: { startTime: "asc" },
        },
      },
      orderBy:
        sortBy === "price"
          ? { ticketPrice: sortOrder }
          : { releaseDate: "desc" },
    });
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

  const filteredMovies = statusPredicate
    ? moviesWithRatings.filter(statusPredicate)
    : moviesWithRatings;
  const sortedMovies = sortMovies(filteredMovies, sortBy, sortOrder);

  return res.status(200).json({ movies: sortedMovies });
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
        include: {
          showtimes: {
            orderBy: { startTime: "asc" },
          },
        },
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
  const { payload, error } = verifyToken(req.headers.authorization || "");

  if (error) {
    return res.status(401).json({ message: error });
  }

  const userId = payload.id;
  const { user: requestedUserId, rating, comment } = req.body;

  if (
    requestedUserId !== undefined &&
    requestedUserId !== null &&
    `${requestedUserId}`.trim() !== userId
  ) {
    return res.status(403).json({ message: "You can only add reviews from your own account" });
  }

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

export const deleteMovieReview = async (req, res, next) => {
  const { id: movieId, reviewId } = req.params;
  const { payload, error } = verifyToken(req.headers.authorization || "");

  if (error) {
    return res.status(401).json({ message: error });
  }

  const userId = payload.id;

  if (!isValidObjectId(movieId) || !isValidObjectId(reviewId) || !isValidObjectId(userId)) {
    return res.status(400).json({ message: "Invalid movie, review or user ID" });
  }

  let review;

  try {
    review = await prisma.comment.findUnique({
      where: { id: reviewId },
      select: {
        id: true,
        movieId: true,
        userId: true,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Unable to validate review" });
  }

  if (!review || review.movieId !== movieId) {
    return res.status(404).json({ message: "Review not found" });
  }

  if (review.userId !== userId) {
    return res.status(403).json({ message: "You can only delete your own reviews" });
  }

  try {
    await prisma.comment.delete({
      where: { id: reviewId },
    });
  } catch (err) {
    return res.status(500).json({ message: "Unable to delete review" });
  }

  let comments;
  let ratingsMap;
  try {
    [comments, ratingsMap] = await Promise.all([
      prisma.comment.findMany({
        where: { movieId },
        orderBy: { updatedAt: "desc" },
      }),
      getMovieRatingsMap([movieId]),
    ]);
  } catch (err) {
    return res.status(500).json({ message: "Unable to fetch updated reviews" });
  }

  const ratingSummary = ratingsMap[movieId] || {
    averageRating: 0,
    ratingsCount: 0,
  };

  return res.status(200).json({
    message: "Review deleted successfully",
    comments: comments.map(serializeComment),
    averageRating: ratingSummary.averageRating,
    ratingsCount: ratingSummary.ratingsCount,
  });
};

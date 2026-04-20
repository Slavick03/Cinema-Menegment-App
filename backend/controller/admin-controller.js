import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { verifyToken } from "../middleware/auth.js";
import {
  cleanupExpiredReservations,
  PAID_PAYMENT_STATUS,
} from "../utils/booking-lifecycle.js";
import {
  serializeAdmin,
  serializeBooking,
  serializeComment,
  serializeMovie,
} from "../utils/serializers.js";

const hasEmptyValue = (...values) =>
  values.some((value) => typeof value !== "string" || value.trim() === "");

const getAdminIdFromToken = (authHeader = "") => {
  const { payload, error } = verifyToken(authHeader);

  if (error) {
    return { error };
  }

  return { adminId: payload.id };
};

const roundToSingleDecimal = (value) => Number(value.toFixed(1));

const getShowtimeBookingCount = (showtime) =>
  Array.isArray(showtime.bookings) ? showtime.bookings.length : 0;

const getShowtimeOccupancyRate = (showtime) => {
  const totalSeats = Number(showtime.totalSeats) || 0;

  if (!totalSeats) {
    return 0;
  }

  return roundToSingleDecimal((getShowtimeBookingCount(showtime) / totalSeats) * 100);
};

const buildMovieAnalytics = (movie) => {
  const bookings = Array.isArray(movie.bookings) ? movie.bookings : [];
  const paidBookings = bookings.filter(
    (booking) => booking.paymentStatus === PAID_PAYMENT_STATUS,
  );
  const showtimes = Array.isArray(movie.showtimes) ? movie.showtimes : [];
  const comments = Array.isArray(movie.comments) ? movie.comments : [];

  const totalBookings = bookings.length;
  const revenue = paidBookings.reduce(
    (sum, booking) => sum + (Number(booking.totalPrice) || 0),
    0,
  );
  const totalSeats = showtimes.reduce(
    (sum, showtime) => sum + (Number(showtime.totalSeats) || 0),
    0,
  );
  const averageRating =
    comments.length > 0
      ? roundToSingleDecimal(
          comments.reduce((sum, comment) => sum + (Number(comment.rating) || 0), 0) /
            comments.length,
        )
      : 0;

  const mostPopularShowtimes = showtimes
    .map((showtime) => ({
      _id: showtime.id,
      startTime: showtime.startTime.toISOString(),
      hall: showtime.hall,
      price: showtime.price,
      totalSeats: showtime.totalSeats,
      bookingsCount: getShowtimeBookingCount(showtime),
      occupancyRate: getShowtimeOccupancyRate(showtime),
      revenue: (Array.isArray(showtime.bookings) ? showtime.bookings : []).reduce(
        (sum, booking) =>
          booking.paymentStatus === PAID_PAYMENT_STATUS
            ? sum + (Number(booking.totalPrice) || 0)
            : sum,
        0,
      ),
    }))
    .filter((showtime) => showtime.bookingsCount > 0)
    .sort((leftShowtime, rightShowtime) => {
      if (rightShowtime.bookingsCount !== leftShowtime.bookingsCount) {
        return rightShowtime.bookingsCount - leftShowtime.bookingsCount;
      }

      return new Date(leftShowtime.startTime) - new Date(rightShowtime.startTime);
    })
    .slice(0, 3);

  return {
    totalBookings,
    revenue: Number(revenue.toFixed(2)),
    averageRating,
    ratingsCount: comments.length,
    occupancyRate: totalSeats
      ? roundToSingleDecimal((totalBookings / totalSeats) * 100)
      : 0,
    totalShowtimes: showtimes.length,
    totalSeats,
    mostPopularShowtimes,
  };
};

const buildAdminAnalyticsSummary = (movies) => {
  const analyticsEntries = movies.map((movie) => movie.analytics);
  const totalBookings = analyticsEntries.reduce(
    (sum, analytics) => sum + analytics.totalBookings,
    0,
  );
  const totalRevenue = analyticsEntries.reduce(
    (sum, analytics) => sum + analytics.revenue,
    0,
  );
  const totalSeats = analyticsEntries.reduce(
    (sum, analytics) => sum + analytics.totalSeats,
    0,
  );
  const totalRatings = analyticsEntries.reduce(
    (sum, analytics) => sum + analytics.ratingsCount,
    0,
  );
  const weightedRatingSum = analyticsEntries.reduce(
    (sum, analytics) => sum + analytics.averageRating * analytics.ratingsCount,
    0,
  );
  const topMovieByBookings = [...movies].sort((leftMovie, rightMovie) => {
    if (rightMovie.analytics.totalBookings !== leftMovie.analytics.totalBookings) {
      return rightMovie.analytics.totalBookings - leftMovie.analytics.totalBookings;
    }

    return rightMovie.analytics.revenue - leftMovie.analytics.revenue;
  })[0];

  return {
    totalMovies: movies.length,
    totalBookings,
    totalRevenue: Number(totalRevenue.toFixed(2)),
    occupancyRate: totalSeats
      ? roundToSingleDecimal((totalBookings / totalSeats) * 100)
      : 0,
    averageRating: totalRatings ? roundToSingleDecimal(weightedRatingSum / totalRatings) : 0,
    ratingsCount: totalRatings,
    topMovie:
      topMovieByBookings && topMovieByBookings.analytics.totalBookings > 0
        ? {
            _id: topMovieByBookings._id,
            title: topMovieByBookings.title,
            totalBookings: topMovieByBookings.analytics.totalBookings,
            revenue: topMovieByBookings.analytics.revenue,
          }
        : null,
  };
};

const buildManagedBookings = (movies) =>
  movies
    .flatMap((movie) =>
      (movie.bookings || []).map((booking) => ({
        ...serializeBooking(booking),
        movieTitle: movie.title,
      })),
    )
    .sort((leftBooking, rightBooking) => {
      const leftDate = new Date(leftBooking.date || leftBooking.createdAt || 0);
      const rightDate = new Date(rightBooking.date || rightBooking.createdAt || 0);
      return rightDate - leftDate;
    });

const buildManagedReviews = (movies) =>
  movies
    .flatMap((movie) =>
      (movie.comments || []).map((comment) => ({
        ...serializeComment(comment),
        movieTitle: movie.title,
      })),
    )
    .sort((leftComment, rightComment) => {
      const leftDate = new Date(leftComment.createdAt || 0);
      const rightDate = new Date(rightComment.createdAt || 0);
      return rightDate - leftDate;
    });

export const addAdmin = async (req, res, next) => {
  const { email, password } = req.body;

  if (hasEmptyValue(email, password)) {
    return res.status(422).json({ message: "Invalid Inputs" });
  }

  let existingAdmin;
  try {
    existingAdmin = await prisma.admin.findUnique({
      where: { email: email.trim() },
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to validate admin" });
  }

  if (existingAdmin) {
    return res.status(400).json({ message: "Admin already exists" });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  let admin;
  try {
    admin = await prisma.admin.create({
      data: {
        email: email.trim(),
        password: hashedPassword,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Unable to store admin" });
  }

  return res.status(201).json({ admin: serializeAdmin(admin) });
};

export const adminLogin = async (req, res, next) => {
  const { email, password } = req.body;

  if (hasEmptyValue(email, password)) {
    return res.status(422).json({ message: "Invalid Inputs" });
  }

  let existingAdmin;
  try {
    existingAdmin = await prisma.admin.findUnique({
      where: { email: email.trim() },
    });
  } catch (err) {
    return res.status(500).json({ message: "Unable to login admin" });
  }

  if (!existingAdmin) {
    return res.status(400).json({ message: "Admin not found" });
  }

  const isPasswordCorrect = bcrypt.compareSync(
    password,
    existingAdmin.password,
  );

  if (!isPasswordCorrect) {
    return res.status(400).json({ message: "Incorrect Password" });
  }

  const token = jwt.sign({ id: existingAdmin.id }, process.env.SECRET_KEY, {
    expiresIn: "14d",
  });

  return res
    .status(200)
    .json({ message: "Authentication Complete", token, id: existingAdmin.id });
};

export const getAdmins = async (req, res, next) => {
  let admins;
  try {
    admins = await prisma.admin.findMany();
  } catch (err) {
    return res.status(500).json({ message: "Internal Server Error" });
  }

  return res.status(200).json({ admins: admins.map(serializeAdmin) });
};

export const getAdminById = async (req, res, next) => {
  const id = req.params.id;

  let admin;
  try {
    await cleanupExpiredReservations();
    admin = await prisma.admin.findUnique({
      where: { id },
      include: {
        movies: {
          include: {
            bookings: {
              include: {
                movie: true,
                showtime: true,
                user: true,
              },
            },
            comments: {
              include: {
                user: true,
              },
            },
            showtimes: {
              include: {
                bookings: {
                  select: {
                    id: true,
                    totalPrice: true,
                    paymentStatus: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Unable to fetch admin" });
  }

  if (!admin) {
    return res.status(404).json({ message: "Admin not found" });
  }

  const serializedMoviesWithAnalytics = admin.movies.map((movie) => ({
    ...serializeMovie(movie),
    analytics: buildMovieAnalytics(movie),
  }));

  return res.status(200).json({
    admin: {
      ...serializeAdmin(admin),
      analytics: buildAdminAnalyticsSummary(serializedMoviesWithAnalytics),
      addedMovies: serializedMoviesWithAnalytics,
      managedBookings: buildManagedBookings(admin.movies),
      managedReviews: buildManagedReviews(admin.movies),
    },
  });
};

export const deleteAdminManagedBooking = async (req, res, next) => {
  const { id } = req.params;

  if (hasEmptyValue(id)) {
    return res.status(400).json({ message: "Invalid booking ID" });
  }

  const { adminId, error } = getAdminIdFromToken(req.headers.authorization || "");

  if (error) {
    return res.status(401).json({ message: error });
  }

  let booking;
  try {
    booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        movie: {
          select: {
            adminId: true,
          },
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Unable to validate booking" });
  }

  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  if (booking.movie?.adminId !== adminId) {
    return res.status(403).json({ message: "You can manage only bookings for your own movies" });
  }

  try {
    await prisma.booking.delete({
      where: { id },
    });
  } catch (err) {
    return res.status(500).json({ message: "Unable to delete booking" });
  }

  return res.status(200).json({ message: "Booking deleted successfully" });
};

export const deleteAdminManagedReview = async (req, res, next) => {
  const { id } = req.params;

  if (hasEmptyValue(id)) {
    return res.status(400).json({ message: "Invalid review ID" });
  }

  const { adminId, error } = getAdminIdFromToken(req.headers.authorization || "");

  if (error) {
    return res.status(401).json({ message: error });
  }

  let review;
  try {
    review = await prisma.comment.findUnique({
      where: { id },
      include: {
        movie: {
          select: {
            adminId: true,
          },
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Unable to validate review" });
  }

  if (!review) {
    return res.status(404).json({ message: "Review not found" });
  }

  if (review.movie?.adminId !== adminId) {
    return res.status(403).json({ message: "You can manage only reviews for your own movies" });
  }

  try {
    await prisma.comment.delete({
      where: { id },
    });
  } catch (err) {
    return res.status(500).json({ message: "Unable to delete review" });
  }

  return res.status(200).json({ message: "Review deleted successfully" });
};

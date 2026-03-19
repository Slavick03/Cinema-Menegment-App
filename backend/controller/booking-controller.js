import mongoose from "mongoose";
import Bookings from "../models/Bookings.js";
import Movie from "../models/Movie.js";
import User from "../models/User.js";

const getDayRange = (dateValue) => {
  const date = new Date(dateValue);
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return { startOfDay, endOfDay };
};

export const newBooking = async (req, res, next) => {
  const { movie, date, seatNumber, user } = req.body;
  const normalizedSeatNumber = `${seatNumber || ""}`.trim().toUpperCase();

  if (
    !mongoose.Types.ObjectId.isValid(movie) ||
    !mongoose.Types.ObjectId.isValid(user)
  ) {
    return res.status(400).json({ message: "Invalid movie or user ID" });
  }

  if (!date || !normalizedSeatNumber) {
    return res.status(422).json({ message: "Date and seat number are required" });
  }

  let existingMovie;
  let existingUser;
  try {
    existingMovie = await Movie.findById(movie);
    existingUser = await User.findById(user);
  } catch (err) {
    return res.status(500).json({ message: "Unable to validate booking" });
  }

  if (!existingMovie) {
    return res.status(404).json({ message: "Movie not found with given id" });
  }
  if (!existingUser) {
    return res.status(404).json({ message: "User not found with given ID " });
  }

  const { startOfDay, endOfDay } = getDayRange(date);
  let existingBooking;

  try {
    existingBooking = await Bookings.findOne({
      movie,
      seatNumber: normalizedSeatNumber,
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Unable to validate seat availability" });
  }

  if (existingBooking) {
    return res.status(409).json({ message: "This seat is already booked for the selected date" });
  }

  let booking;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    booking = new Bookings({
      movie,
      date: new Date(`${date}`),
      seatNumber: normalizedSeatNumber,
      user,
    });
    existingUser.bookings.push(booking);
    existingMovie.bookings.push(booking);
    await existingUser.save({ session });
    await existingMovie.save({ session });
    await booking.save({ session });
    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    return res.status(500).json({ message: "Unable to create a booking" });
  } finally {
    session.endSession();
  }

  return res.status(201).json({ booking });
};

export const getBookedSeatsByMovieAndDate = async (req, res, next) => {
  const { movieId } = req.params;
  const { date } = req.query;

  if (!mongoose.Types.ObjectId.isValid(movieId)) {
    return res.status(400).json({ message: "Invalid movie ID" });
  }

  if (!date) {
    return res.status(422).json({ message: "Date is required" });
  }

  const { startOfDay, endOfDay } = getDayRange(date);
  let bookings;

  try {
    bookings = await Bookings.find({
      movie: movieId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    }).select("seatNumber");
  } catch (err) {
    return res.status(500).json({ message: "Unable to fetch booked seats" });
  }

  return res.status(200).json({
    bookedSeats: bookings.map((booking) => booking.seatNumber),
  });
};

export const getBookingById = async (req, res, next) => {
  const id = req.params.id;
  let booking;
  try {
    booking = await Bookings.findById(id);
  } catch (err) {
    return res.status(500).json({ message: "Unexpected Error" });
  }
  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }
  return res.status(200).json({ booking });
};

export const deleteBooking = async (req, res, next) => {
  const id = req.params.id;
  let booking;
  const session = await mongoose.startSession();

  try {
    booking = await Bookings.findById(id).populate("user movie");

    if (!booking) {
      session.endSession();
      return res.status(404).json({ message: "Booking not found" });
    }

    session.startTransaction();
    booking.user.bookings.pull(booking._id);
    booking.movie.bookings.pull(booking._id);
    await booking.movie.save({ session });
    await booking.user.save({ session });
    await Bookings.findByIdAndDelete(id, { session });
    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    return res.status(500).json({ message: "Unable to delete booking" });
  } finally {
    session.endSession();
  }

  return res.status(200).json({ message: "Successfully Deleted" });
};

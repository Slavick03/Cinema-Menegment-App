import mongoose from "mongoose";
import crypto from "crypto";
import Bookings from "../models/Bookings.js";
import Movie from "../models/Movie.js";
import User from "../models/User.js";

const createNormalizedBookingDate = (dateValue) => {
  if (typeof dateValue !== "string") {
    return null;
  }

  const trimmedDateValue = dateValue.trim();

  if (!trimmedDateValue) {
    return null;
  }

  const dateOnlyMatch = trimmedDateValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    const normalizedDate = new Date(
      Date.UTC(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0)
    );

    return Number.isNaN(normalizedDate.getTime()) ? null : normalizedDate;
  }

  const parsedDate = new Date(trimmedDateValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  parsedDate.setUTCHours(0, 0, 0, 0);
  return parsedDate;
};

const isValidDateValue = (dateValue) => Boolean(createNormalizedBookingDate(dateValue));
const hasEmptyValue = (...values) =>
  values.some((value) => typeof value !== "string" || value.trim() === "");

const validPaymentMethods = new Set(["apple_pay", "google_pay", "card"]);
const normalizePhoneNumber = (phoneNumber) => `${phoneNumber || ""}`.trim();
const isValidPhoneNumber = (phoneNumber) =>
  /^[0-9+\-\s()]{7,20}$/.test(phoneNumber);
const createTicketCode = () => `TKT-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

export const newBooking = async (req, res, next) => {
  const {
    movie,
    date,
    seatNumber,
    user,
    customerFirstName,
    customerLastName,
    phoneNumber,
    paymentMethod,
  } = req.body;
  const normalizedSeatNumber = `${seatNumber || ""}`.trim().toUpperCase();
  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
  const normalizedFirstName = `${customerFirstName || ""}`.trim();
  const normalizedLastName = `${customerLastName || ""}`.trim();

  if (
    !mongoose.Types.ObjectId.isValid(movie) ||
    !mongoose.Types.ObjectId.isValid(user)
  ) {
    return res.status(400).json({ message: "Invalid movie or user ID" });
  }

  if (
    !date ||
    !normalizedSeatNumber ||
    hasEmptyValue(normalizedFirstName, normalizedLastName, normalizedPhoneNumber)
  ) {
    return res.status(422).json({
      message: "Date, seat number, first name, last name and phone number are required",
    });
  }

  if (!isValidDateValue(date)) {
    return res.status(422).json({ message: "Invalid booking date" });
  }

  if (!isValidPhoneNumber(normalizedPhoneNumber)) {
    return res.status(422).json({ message: "Invalid phone number" });
  }

  if (!validPaymentMethods.has(paymentMethod)) {
    return res.status(422).json({ message: "Invalid payment method" });
  }

  const normalizedBookingDate = createNormalizedBookingDate(date);

  if (!normalizedBookingDate) {
    return res.status(422).json({ message: "Invalid booking date" });
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
  if (!Number.isFinite(Number(existingMovie.ticketPrice)) || Number(existingMovie.ticketPrice) <= 0) {
    return res.status(422).json({ message: "This movie does not have a valid ticket price yet" });
  }
  let existingBooking;

  try {
    existingBooking = await Bookings.findOne({
      movie,
      seatNumber: normalizedSeatNumber,
      date: normalizedBookingDate,
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
    const ticketCode = createTicketCode();
    const totalPrice = Number(existingMovie.ticketPrice);
    const qrCodeValue = JSON.stringify({
      ticketCode,
      movieId: existingMovie._id.toString(),
      movieTitle: existingMovie.title,
      bookingDate: normalizedBookingDate.toISOString(),
      seatNumber: normalizedSeatNumber,
      customerName: `${normalizedFirstName} ${normalizedLastName}`,
      phoneNumber: normalizedPhoneNumber,
      paymentMethod,
      totalPrice,
    });

    booking = new Bookings({
      movie,
      date: normalizedBookingDate,
      seatNumber: normalizedSeatNumber,
      customerFirstName: normalizedFirstName,
      customerLastName: normalizedLastName,
      phoneNumber: normalizedPhoneNumber,
      paymentMethod,
      paymentStatus: "paid",
      totalPrice,
      ticketCode,
      qrCodeValue,
      user,
    });
    existingUser.bookings.push(booking);
    existingMovie.bookings.push(booking);
    await existingUser.save({ session });
    await existingMovie.save({ session });
    await booking.save({ session });
    await session.commitTransaction();
    booking = await Bookings.findById(booking._id).populate("movie").populate("user");
  } catch (err) {
    await session.abortTransaction();

    if (err?.code === 11000) {
      return res.status(409).json({ message: "This seat is already booked for the selected date" });
    }

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

  if (!isValidDateValue(date)) {
    return res.status(422).json({ message: "Invalid booking date" });
  }

  const normalizedBookingDate = createNormalizedBookingDate(date);
  let bookings;

  try {
    bookings = await Bookings.find({
      movie: movieId,
      date: normalizedBookingDate,
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

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid booking ID" });
  }

  let booking;
  try {
    booking = await Bookings.findById(id).populate("movie").populate("user");
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

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid booking ID" });
  }

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

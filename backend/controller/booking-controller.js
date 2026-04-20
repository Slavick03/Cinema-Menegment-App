import crypto from "crypto";
import { prisma } from "../lib/prisma.js";
import { getStripeClient } from "../lib/stripe.js";
import { serializeBooking } from "../utils/serializers.js";

const hasEmptyValue = (...values) =>
  values.some((value) => typeof value !== "string" || value.trim() === "");

const validPaymentMethods = new Set(["apple_pay", "google_pay", "card"]);
const normalizePhoneNumber = (phoneNumber) => `${phoneNumber || ""}`.trim();
const isValidPhoneNumber = (phoneNumber) =>
  /^[0-9+\-\s()]{7,20}$/.test(phoneNumber);
const createTicketCode = () =>
  `TKT-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
const getStripeCurrency = () =>
  `${process.env.STRIPE_CURRENCY || "usd"}`.trim().toLowerCase();
const getStripePublishableKey = () =>
  `${process.env.STRIPE_PUBLISHABLE_KEY || ""}`.trim();
const toStripeAmount = (amount) => Math.round(Number(amount) * 100);

const includeBookingRelations = {
  movie: true,
  showtime: true,
  user: true,
};

const ensureAuthenticatedUserMatches = (authenticatedUserId, userId) =>
  authenticatedUserId && authenticatedUserId === userId;

const validateBookingPayload = async ({
  showtime,
  user,
  seatNumber,
  customerFirstName,
  customerLastName,
  phoneNumber,
  paymentMethod,
}) => {
  const normalizedSeatNumber = `${seatNumber || ""}`.trim().toUpperCase();
  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
  const normalizedFirstName = `${customerFirstName || ""}`.trim();
  const normalizedLastName = `${customerLastName || ""}`.trim();

  if (hasEmptyValue(showtime, user)) {
    return { status: 400, payload: { message: "Invalid showtime or user ID" } };
  }

  if (
    !normalizedSeatNumber ||
    hasEmptyValue(
      normalizedFirstName,
      normalizedLastName,
      normalizedPhoneNumber,
    )
  ) {
    return {
      status: 422,
      payload: {
        message:
          "Showtime, seat number, first name, last name and phone number are required",
      },
    };
  }

  if (!isValidPhoneNumber(normalizedPhoneNumber)) {
    return { status: 422, payload: { message: "Invalid phone number" } };
  }

  if (!validPaymentMethods.has(paymentMethod)) {
    return { status: 422, payload: { message: "Invalid payment method" } };
  }

  let existingMovie;
  let existingShowtime;
  let existingUser;

  try {
    [existingShowtime, existingUser] = await Promise.all([
      prisma.showtime.findUnique({
        where: { id: showtime },
        include: { movie: true },
      }),
      prisma.user.findUnique({ where: { id: user } }),
    ]);
  } catch (err) {
    return { status: 500, payload: { message: "Unable to validate booking" } };
  }

  if (!existingShowtime) {
    return { status: 404, payload: { message: "Showtime not found with given id" } };
  }

  if (!existingUser) {
    return { status: 404, payload: { message: "User not found with given ID " } };
  }

  existingMovie = existingShowtime.movie;

  if (
    !Number.isFinite(Number(existingShowtime.price)) ||
    Number(existingShowtime.price) <= 0
  ) {
    return {
      status: 422,
      payload: { message: "This showtime does not have a valid ticket price yet" },
    };
  }

  let existingBooking;

  try {
    existingBooking = await prisma.booking.findFirst({
      where: {
        showtimeId: showtime,
        seatNumber: normalizedSeatNumber,
      },
    });
  } catch (err) {
    return {
      status: 500,
      payload: { message: "Unable to validate seat availability" },
    };
  }

  if (existingBooking) {
    return {
      status: 409,
      payload: { message: "This seat is already booked for the selected showtime" },
    };
  }

  return {
    normalizedSeatNumber,
    normalizedPhoneNumber,
    normalizedFirstName,
    normalizedLastName,
    normalizedBookingDate: existingShowtime.startTime,
    existingMovie,
    existingShowtime,
    existingUser,
  };
};

const buildQrCodeValue = ({
  ticketCode,
  movie,
  showtime,
  bookingDate,
  seatNumber,
  customerName,
  phoneNumber,
  paymentMethod,
  totalPrice,
  stripePaymentIntentId,
}) =>
  JSON.stringify({
    ticketCode,
    movieId: movie.id,
    movieTitle: movie.title,
    showtimeId: showtime.id,
    showtimeHall: showtime.hall,
    bookingDate: bookingDate.toISOString(),
    seatNumber,
    customerName,
    phoneNumber,
    paymentMethod,
    totalPrice,
    stripePaymentIntentId,
  });

export const getStripeConfig = async (req, res, next) => {
  const publishableKey = getStripePublishableKey();

  if (!publishableKey) {
    return res.status(503).json({
      message:
        "Stripe is not configured yet. Add STRIPE_PUBLISHABLE_KEY and STRIPE_SECRET_KEY to the server .env",
    });
  }

  return res.status(200).json({
    publishableKey,
    currency: getStripeCurrency(),
  });
};

export const createPaymentIntent = async (req, res, next) => {
  const { user } = req.body;

  if (!ensureAuthenticatedUserMatches(req.userId, user)) {
    return res.status(403).json({ message: "You can only create a payment intent for your own account" });
  }

  const validationResult = await validateBookingPayload(req.body);

  if (validationResult.status) {
    return res.status(validationResult.status).json(validationResult.payload);
  }

  const { showtime, paymentMethod } = req.body;
  const {
    normalizedSeatNumber,
    normalizedPhoneNumber,
    normalizedFirstName,
    normalizedLastName,
    normalizedBookingDate,
    existingShowtime,
  } = validationResult;

  const amount = toStripeAmount(existingShowtime.price);

  if (!Number.isFinite(amount) || amount < 50) {
    return res.status(422).json({
      message: "Ticket price must be at least 0.50 in the selected Stripe currency",
    });
  }

  try {
    const stripe = getStripeClient();
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: getStripeCurrency(),
      payment_method_types: ["card"],
      metadata: {
        movieId: existingShowtime.movieId,
        showtimeId: showtime,
        userId: user,
        bookingDate: normalizedBookingDate.toISOString(),
        seatNumber: normalizedSeatNumber,
        customerFirstName: normalizedFirstName,
        customerLastName: normalizedLastName,
        phoneNumber: normalizedPhoneNumber,
        paymentMethod,
      },
    });

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err) {
    const isStripeConfigError =
      err instanceof Error && err.message === "Stripe secret key is missing";

    return res.status(isStripeConfigError ? 503 : 500).json({
      message: isStripeConfigError
        ? "Stripe is not configured yet. Add STRIPE_PUBLISHABLE_KEY and STRIPE_SECRET_KEY to the server .env"
        : "Unable to initialize Stripe payment",
    });
  }
};

export const newBooking = async (req, res, next) => {
  const { user } = req.body;

  if (!ensureAuthenticatedUserMatches(req.userId, user)) {
    return res.status(403).json({ message: "You can only create bookings for your own account" });
  }

  const validationResult = await validateBookingPayload(req.body);

  if (validationResult.status) {
    return res.status(validationResult.status).json(validationResult.payload);
  }

  const { showtime, paymentMethod, stripePaymentIntentId } = req.body;
  const {
    normalizedSeatNumber,
    normalizedPhoneNumber,
    normalizedFirstName,
    normalizedLastName,
    normalizedBookingDate,
    existingMovie,
    existingShowtime,
  } = validationResult;

  if (!stripePaymentIntentId || typeof stripePaymentIntentId !== "string") {
    return res.status(422).json({ message: "Stripe payment intent ID is required" });
  }

  try {
    const stripe = getStripeClient();
    const paymentIntent = await stripe.paymentIntents.retrieve(stripePaymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return res.status(422).json({ message: "Stripe payment has not been completed" });
    }
  } catch (err) {
    const isStripeConfigError =
      err instanceof Error && err.message === "Stripe secret key is missing";

    return res.status(isStripeConfigError ? 503 : 500).json({
      message: isStripeConfigError
        ? "Stripe is not configured yet. Add STRIPE_PUBLISHABLE_KEY and STRIPE_SECRET_KEY to the server .env"
        : "Unable to verify Stripe payment",
    });
  }

  let booking;

  try {
    const ticketCode = createTicketCode();
    const totalPrice = Number(existingShowtime.price);
    const qrCodeValue = buildQrCodeValue({
      ticketCode,
      movie: existingMovie,
      showtime: existingShowtime,
      bookingDate: normalizedBookingDate,
      seatNumber: normalizedSeatNumber,
      customerName: `${normalizedFirstName} ${normalizedLastName}`,
      phoneNumber: normalizedPhoneNumber,
      paymentMethod,
      totalPrice,
      stripePaymentIntentId,
    });

    booking = await prisma.booking.create({
      data: {
        movieId: existingMovie.id,
        showtimeId: showtime,
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
        userId: req.userId,
      },
      include: includeBookingRelations,
    });
  } catch (err) {
    if (err?.code === "P2002") {
      return res.status(409).json({
        message: "This seat is already booked for the selected showtime",
      });
    }

    return res.status(500).json({ message: "Unable to create a booking" });
  }

  return res.status(201).json({ booking: serializeBooking(booking) });
};

export const completePaymentBooking = async (req, res, next) => {
  const { paymentIntentId } = req.body;

  if (hasEmptyValue(paymentIntentId)) {
    return res.status(400).json({ message: "Stripe payment intent ID is required" });
  }

  let paymentIntent;

  try {
    const stripe = getStripeClient();
    paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (err) {
    const isStripeConfigError =
      err instanceof Error && err.message === "Stripe secret key is missing";

    return res.status(isStripeConfigError ? 503 : 500).json({
      message: isStripeConfigError
        ? "Stripe is not configured yet. Add STRIPE_PUBLISHABLE_KEY and STRIPE_SECRET_KEY to the server .env"
        : "Unable to verify Stripe payment",
    });
  }

  if (paymentIntent.status !== "succeeded") {
    return res.status(422).json({ message: "Stripe payment has not been completed" });
  }

  const metadata = paymentIntent.metadata || {};
  if (
    !metadata.showtimeId ||
    !metadata.userId ||
    !metadata.seatNumber ||
    !metadata.customerFirstName ||
    !metadata.customerLastName ||
    !metadata.phoneNumber
  ) {
    return res.status(422).json({ message: "Stripe session metadata is incomplete" });
  }

  if (!ensureAuthenticatedUserMatches(req.userId, metadata.userId)) {
    return res.status(403).json({ message: "You can only complete bookings for your own account" });
  }

  try {
    const existingBooking = await prisma.booking.findFirst({
      where: {
        showtimeId: metadata.showtimeId,
        userId: metadata.userId,
        seatNumber: metadata.seatNumber,
      },
      include: includeBookingRelations,
    });

    if (existingBooking) {
      return res.status(200).json({ booking: serializeBooking(existingBooking) });
    }
  } catch (err) {
    return res.status(500).json({ message: "Unable to validate completed booking" });
  }

  req.body = {
    showtime: metadata.showtimeId,
    user: metadata.userId,
    seatNumber: metadata.seatNumber,
    customerFirstName: metadata.customerFirstName,
    customerLastName: metadata.customerLastName,
    phoneNumber: metadata.phoneNumber,
    paymentMethod: metadata.paymentMethod || "card",
    stripePaymentIntentId: paymentIntentId,
  };

  return newBooking(req, res, next);
};

export const getBookedSeatsByShowtime = async (req, res, next) => {
  const { showtimeId } = req.params;

  if (hasEmptyValue(showtimeId)) {
    return res.status(400).json({ message: "Invalid showtime ID" });
  }
  let bookings;

  try {
    bookings = await prisma.booking.findMany({
      where: {
        showtimeId,
      },
      select: { seatNumber: true },
    });
  } catch (err) {
    return res.status(500).json({ message: "Unable to fetch booked seats" });
  }

  return res.status(200).json({
    bookedSeats: bookings.map((booking) => booking.seatNumber),
  });
};

export const getBookingById = async (req, res, next) => {
  const id = req.params.id;

  if (hasEmptyValue(id)) {
    return res.status(400).json({ message: "Invalid booking ID" });
  }

  let booking;
  try {
    booking = await prisma.booking.findUnique({
      where: { id },
      include: includeBookingRelations,
    });
  } catch (err) {
    return res.status(500).json({ message: "Unexpected Error" });
  }
  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  if (booking.userId !== req.userId) {
    return res.status(403).json({ message: "You are not allowed to view this booking" });
  }

  return res.status(200).json({ booking: serializeBooking(booking) });
};

export const deleteBooking = async (req, res, next) => {
  const id = req.params.id;

  if (hasEmptyValue(id)) {
    return res.status(400).json({ message: "Invalid booking ID" });
  }

  let existingBooking;
  try {
    existingBooking = await prisma.booking.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });
  } catch (err) {
    return res.status(500).json({ message: "Unable to validate booking" });
  }

  if (!existingBooking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  if (existingBooking.userId !== req.userId) {
    return res.status(403).json({ message: "You are not allowed to delete this booking" });
  }

  try {
    await prisma.booking.delete({
      where: { id },
    });
  } catch (err) {
    return res.status(500).json({ message: "Unable to delete booking" });
  }

  return res.status(200).json({ message: "Successfully Deleted" });
};

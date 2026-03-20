import test, { afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { newBooking } from "../controller/booking-controller.js";
import { addMovie } from "../controller/movie-controller.js";
import { login, signup } from "../controller/user-controller.js";
import Bookings from "../models/Bookings.js";
import Movie from "../models/Movie.js";
import User from "../models/User.js";

const createResponseMock = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.body = payload;
    return this;
  },
});

const createPopulateChain = (value) => ({
  populate() {
    return this;
  },
  then(resolve) {
    return Promise.resolve(resolve(value));
  },
  catch(reject) {
    return Promise.resolve().catch(reject);
  },
});

afterEach(() => {
  mock.restoreAll();
});

test("signup registers a new user", async () => {
  const res = createResponseMock();

  mock.method(User, "findOne", async () => null);
  mock.method(User.prototype, "save", async function saveUser() {
    return this;
  });

  await signup(
    {
      body: {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      },
    },
    res,
  );

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.user.name, "Test User");
  assert.equal(res.body.user.email, "test@example.com");
  assert.notEqual(res.body.user.password, "password123");
  assert.ok(res.body.id);
});

test("login logs in an existing user", async () => {
  const res = createResponseMock();
  const hashedPassword = bcrypt.hashSync("password123", 10);

  mock.method(User, "findOne", async () => ({
    _id: "507f1f77bcf86cd799439011",
    email: "test@example.com",
    password: hashedPassword,
  }));

  await login(
    {
      body: {
        email: "test@example.com",
        password: "password123",
      },
    },
    res,
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.message, "Login Successfull");
  assert.equal(res.body.id, "507f1f77bcf86cd799439011");
});

test("newBooking creates a booking", async () => {
  const res = createResponseMock();
  const movieId = new mongoose.Types.ObjectId();
  const userId = new mongoose.Types.ObjectId();
  const bookingId = new mongoose.Types.ObjectId();
  const bookingDate = new Date("2026-04-10T00:00:00.000Z");

  const userDocument = {
    _id: userId,
    bookings: [],
    async save() {
      return this;
    },
  };

  const movieDocument = {
    _id: movieId,
    title: "Interstellar",
    ticketPrice: 150,
    bookings: [],
    async save() {
      return this;
    },
  };

  const populatedBooking = {
    _id: bookingId,
    seatNumber: "A1",
    paymentMethod: "card",
    totalPrice: 150,
    customerFirstName: "Ion",
    customerLastName: "Popescu",
    phoneNumber: "+37369111222",
    movie: movieDocument,
    user: userDocument,
  };

  mock.method(Movie, "findById", async () => movieDocument);
  mock.method(User, "findById", async () => userDocument);
  mock.method(Bookings, "findOne", async () => null);
  mock.method(Bookings.prototype, "save", async function saveBooking() {
    this._id = bookingId;
    return this;
  });
  mock.method(Bookings, "findById", () => createPopulateChain(populatedBooking));
  mock.method(mongoose, "startSession", async () => ({
    startTransaction() {},
    async commitTransaction() {},
    async abortTransaction() {},
    endSession() {},
  }));

  await newBooking(
    {
      body: {
        movie: movieId.toString(),
        user: userId.toString(),
        date: "2026-04-10",
        seatNumber: "a1",
        customerFirstName: "Ion",
        customerLastName: "Popescu",
        phoneNumber: "+37369111222",
        paymentMethod: "card",
      },
    },
    res,
  );

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.booking._id.toString(), bookingId.toString());
  assert.equal(res.body.booking.seatNumber, "A1");
  assert.equal(res.body.booking.totalPrice, 150);
  assert.equal(res.body.booking.paymentMethod, "card");
  assert.equal(userDocument.bookings.length, 1);
  assert.equal(movieDocument.bookings.length, 1);
  assert.equal(
    Bookings.findOne.mock.calls[0].arguments[0].date.toISOString(),
    bookingDate.toISOString(),
  );
});

test("addMovie rejects client access to admin endpoint without admin token", async () => {
  process.env.SECRET_KEY = "test-secret-key";
  const res = createResponseMock();

  await addMovie(
    {
      headers: {},
      body: {
        title: "Dune",
        description: "Sci-fi",
        releaseDate: "2026-03-20",
        posterUrl: "https://example.com/poster.jpg",
        featured: true,
        actors: ["Timothee Chalamet"],
        ticketPrice: 120,
      },
    },
    res,
  );

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.message, "Token not found");
});

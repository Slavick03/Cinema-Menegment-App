import test, { afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { newBooking } from "../controller/booking-controller.js";
import { addMovie } from "../controller/movie-controller.js";
import { login, signup } from "../controller/user-controller.js";

const restoreCallbacks = [];

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

afterEach(() => {
  mock.restoreAll();

  while (restoreCallbacks.length) {
    restoreCallbacks.pop()();
  }
});

const stubMethod = (target, methodName, implementation) => {
  const originalMethod = target[methodName];
  const stub = mock.fn(implementation);
  target[methodName] = stub;
  restoreCallbacks.push(() => {
    target[methodName] = originalMethod;
  });
  return stub;
};

test("signup registers a new user", async () => {
  const res = createResponseMock();

  stubMethod(prisma.user, "findUnique", async () => null);
  stubMethod(prisma.user, "create", async ({ data }) => ({
    id: "user_123",
    ...data,
  }));

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
  assert.equal(res.body.id, "user_123");
  assert.equal(res.body.user._id, "user_123");
});

test("login logs in an existing user", async () => {
  const res = createResponseMock();
  const hashedPassword = bcrypt.hashSync("password123", 10);

  stubMethod(prisma.user, "findUnique", async () => ({
    id: "user_login_1",
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
  assert.equal(res.body.id, "user_login_1");
});

test("newBooking creates a booking", async () => {
  const res = createResponseMock();
  const movieId = "movie_1";
  const userId = "user_1";
  const bookingId = "booking_1";
  const bookingDate = new Date("2026-04-10T00:00:00.000Z");

  const movieDocument = {
    id: movieId,
    title: "Interstellar",
    ticketPrice: 150,
    description: "Space travel",
    actors: ["Matthew McConaughey"],
    releaseDate: "2014-11-07T00:00:00.000Z",
    posterUrl: "https://example.com/poster.jpg",
    featured: true,
    adminId: "admin_1",
  };

  const userDocument = {
    id: userId,
    name: "Ion",
    email: "ion@example.com",
    password: "hashed-password",
  };

  stubMethod(prisma.movie, "findUnique", async () => movieDocument);
  stubMethod(prisma.user, "findUnique", async () => userDocument);
  const findFirstStub = stubMethod(prisma.booking, "findFirst", async () => null);
  stubMethod(prisma.booking, "create", async ({ data }) => ({
    id: bookingId,
    ...data,
    createdAt: bookingDate,
    updatedAt: bookingDate,
    movie: movieDocument,
    user: userDocument,
  }));

  await newBooking(
    {
      body: {
        movie: movieId,
        user: userId,
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
  assert.equal(res.body.booking._id, bookingId);
  assert.equal(res.body.booking.seatNumber, "A1");
  assert.equal(res.body.booking.totalPrice, 150);
  assert.equal(res.body.booking.paymentMethod, "card");
  assert.equal(
    findFirstStub.mock.calls[0].arguments[0].where.date.toISOString(),
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

import test, { afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import {
  deleteAdminManagedBooking,
  deleteAdminManagedReview,
  getAdminById,
} from "../controller/admin-controller.js";
import { newBooking, reserveBooking } from "../controller/booking-controller.js";
import {
  addMovie,
  deleteMovieReview,
  getAllMovies,
} from "../controller/movie-controller.js";
import { __setStripeClientForTests } from "../lib/stripe.js";
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
  __setStripeClientForTests(null);

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
  process.env.SECRET_KEY = "test-secret-key";

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
  assert.equal("password" in res.body.user, false);
  assert.equal(res.body.id, "user_123");
  assert.equal(res.body.user._id, "user_123");
  assert.ok(res.body.token);
  assert.equal(
    jwt.verify(res.body.token, process.env.SECRET_KEY).id,
    "user_123",
  );
});

test("login logs in an existing user", async () => {
  const res = createResponseMock();
  const hashedPassword = bcrypt.hashSync("password123", 10);
  process.env.SECRET_KEY = "test-secret-key";

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
  assert.ok(res.body.token);
  assert.equal(
    jwt.verify(res.body.token, process.env.SECRET_KEY).id,
    "user_login_1",
  );
});

test("newBooking creates a booking", async () => {
  const res = createResponseMock();
  const movieId = "movie_1";
  const showtimeId = "showtime_1";
  const userId = "user_1";
  const bookingId = "booking_1";
  const bookingDate = new Date("2026-04-10T18:30:00.000Z");

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

  const showtimeDocument = {
    id: showtimeId,
    movieId,
    startTime: bookingDate,
    hall: "Hall 1",
    price: 150,
    totalSeats: 48,
    movie: movieDocument,
  };

  const userDocument = {
    id: userId,
    name: "Ion",
    email: "ion@example.com",
    password: "hashed-password",
  };

  stubMethod(prisma.showtime, "findUnique", async () => showtimeDocument);
  stubMethod(prisma.user, "findUnique", async () => userDocument);
  stubMethod(prisma.booking, "deleteMany", async () => ({ count: 0 }));
  const findFirstStub = stubMethod(prisma.booking, "findFirst", async () => null);
  stubMethod(prisma.booking, "create", async ({ data }) => ({
    id: bookingId,
    ...data,
    createdAt: bookingDate,
    updatedAt: bookingDate,
    movie: movieDocument,
    showtime: showtimeDocument,
    user: userDocument,
  }));
  __setStripeClientForTests({
    paymentIntents: {
      retrieve: async () => ({ status: "succeeded" }),
    },
  });

  await newBooking(
    {
      userId,
      body: {
        showtime: showtimeId,
        user: userId,
        seatNumber: "a1",
        customerFirstName: "Ion",
        customerLastName: "Popescu",
        phoneNumber: "+37369111222",
        paymentMethod: "card",
        stripePaymentIntentId: "pi_test_123",
      },
    },
    res,
  );

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.booking._id, bookingId);
  assert.equal(res.body.booking.seatNumber, "A1");
  assert.equal(res.body.booking.totalPrice, 150);
  assert.equal(res.body.booking.paymentMethod, "card");
  assert.equal(findFirstStub.mock.calls[0].arguments[0].where.showtimeId, showtimeId);
});

test("reserveBooking creates a reservation without payment", async () => {
  const res = createResponseMock();
  const movieId = "movie_2";
  const showtimeId = "showtime_2";
  const userId = "user_2";
  const bookingId = "booking_2";
  const bookingDate = new Date("2026-05-10T20:00:00.000Z");

  const movieDocument = {
    id: movieId,
    title: "Dune Part Two",
    ticketPrice: 180,
    description: "Sci-fi epic",
    actors: ["Timothee Chalamet"],
    releaseDate: "2024-03-01T00:00:00.000Z",
    posterUrl: "https://example.com/dune.jpg",
    featured: true,
    adminId: "admin_2",
  };

  const showtimeDocument = {
    id: showtimeId,
    movieId,
    startTime: bookingDate,
    hall: "Hall 2",
    price: 180,
    totalSeats: 64,
    movie: movieDocument,
  };

  const userDocument = {
    id: userId,
    name: "Maria",
    email: "maria@example.com",
    password: "hashed-password",
  };

  stubMethod(prisma.booking, "deleteMany", async () => ({ count: 0 }));
  stubMethod(prisma.showtime, "findUnique", async () => showtimeDocument);
  stubMethod(prisma.user, "findUnique", async () => userDocument);
  stubMethod(prisma.booking, "findFirst", async () => null);
  stubMethod(prisma.booking, "create", async ({ data }) => ({
    id: bookingId,
    ...data,
    createdAt: bookingDate,
    updatedAt: bookingDate,
    movie: movieDocument,
    showtime: showtimeDocument,
    user: userDocument,
  }));

  await reserveBooking(
    {
      userId,
      body: {
        showtime: showtimeId,
        user: userId,
        seatNumber: "b2",
        customerFirstName: "Maria",
        customerLastName: "Ionescu",
        phoneNumber: "+37368111222",
      },
    },
    res,
  );

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.booking._id, bookingId);
  assert.equal(res.body.booking.seatNumber, "B2");
  assert.equal(res.body.booking.paymentMethod, "reservation");
  assert.equal(res.body.booking.paymentStatus, "reserved");
  assert.ok(res.body.booking.reservationReleaseTime);
});

test("newBooking rejects booking creation for another user", async () => {
  const res = createResponseMock();

  await newBooking(
    {
      userId: "user_auth_1",
      body: {
        showtime: "showtime_1",
        user: "user_other_1",
        seatNumber: "a1",
        customerFirstName: "Ion",
        customerLastName: "Popescu",
        phoneNumber: "+37369111222",
        paymentMethod: "card",
        stripePaymentIntentId: "pi_test_123",
      },
    },
    res,
  );

  assert.equal(res.statusCode, 403);
  assert.equal(
    res.body.message,
    "You can only create bookings for your own account",
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
        showtimes: [
          {
            startTime: "2026-03-21T18:30",
            hall: "Hall 1",
            price: 120,
            totalSeats: 48,
          },
        ],
      },
    },
    res,
  );

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.message, "Token not found");
});

test("getAllMovies applies search and featured filters", async () => {
  const res = createResponseMock();
  const featuredMovieDate = new Date("2026-04-01T00:00:00.000Z");

  const findManyStub = stubMethod(prisma.movie, "findMany", async () => [
    {
      id: "movie_featured_1",
      title: "Dune: Part Two",
      description: "Sci-fi epic",
      actors: ["Timothee Chalamet"],
      releaseDate: featuredMovieDate,
      posterUrl: "https://example.com/dune.jpg",
      ticketPrice: 150,
      featured: true,
      adminId: "admin_1",
      showtimes: [],
    },
    {
      id: "movie_regular_1",
      title: "Dune Documentary",
      description: "Behind the scenes",
      actors: ["Zendaya"],
      releaseDate: featuredMovieDate,
      posterUrl: "https://example.com/doc.jpg",
      ticketPrice: 90,
      featured: false,
      adminId: "admin_1",
      showtimes: [],
    },
  ]);
  stubMethod(prisma.comment, "groupBy", async () => []);

  await getAllMovies(
    {
      query: {
        search: "dune",
        status: "featured",
      },
    },
    res,
  );

  assert.equal(res.statusCode, 200);
  assert.equal(findManyStub.mock.calls[0].arguments[0].where.title.contains, "dune");
  assert.equal(findManyStub.mock.calls[0].arguments[0].where.title.mode, "insensitive");
  assert.equal(res.body.movies.length, 1);
  assert.equal(res.body.movies[0].title, "Dune: Part Two");
});

test("getAllMovies sorts by rating descending", async () => {
  const res = createResponseMock();
  const releaseDate = new Date("2026-02-01T00:00:00.000Z");

  stubMethod(prisma.movie, "findMany", async () => [
    {
      id: "movie_1",
      title: "Alpha",
      description: "Alpha description",
      actors: ["Actor A"],
      releaseDate,
      posterUrl: "https://example.com/a.jpg",
      ticketPrice: 100,
      featured: false,
      adminId: "admin_1",
      showtimes: [],
    },
    {
      id: "movie_2",
      title: "Beta",
      description: "Beta description",
      actors: ["Actor B"],
      releaseDate,
      posterUrl: "https://example.com/b.jpg",
      ticketPrice: 120,
      featured: false,
      adminId: "admin_1",
      showtimes: [],
    },
  ]);
  stubMethod(prisma.comment, "groupBy", async () => [
    {
      movieId: "movie_1",
      _avg: { rating: 4.1 },
      _count: { rating: 5 },
    },
    {
      movieId: "movie_2",
      _avg: { rating: 4.8 },
      _count: { rating: 9 },
    },
  ]);

  await getAllMovies(
    {
      query: {
        sortBy: "rating",
        sortOrder: "desc",
      },
    },
    res,
  );

  assert.equal(res.statusCode, 200);
  assert.deepEqual(
    res.body.movies.map((movie) => movie.title),
    ["Beta", "Alpha"],
  );
});

test("getAdminById returns analytics for admin movies", async () => {
  process.env.SECRET_KEY = "test-secret-key";
  const res = createResponseMock();
  const token = jwt.sign({ id: "admin_analytics_1" }, process.env.SECRET_KEY);

  stubMethod(prisma.booking, "deleteMany", async () => ({ count: 0 }));
  stubMethod(prisma.admin, "findUnique", async () => ({
    id: "admin_analytics_1",
    email: "admin@example.com",
    password: "hashed-password",
    movies: [
      {
        id: "movie_analytics_1",
        title: "Arrival",
        description: "Sci-fi drama",
        actors: ["Amy Adams"],
        releaseDate: new Date("2026-04-01T00:00:00.000Z"),
        posterUrl: "https://example.com/arrival.jpg",
        ticketPrice: 120,
        featured: true,
        adminId: "admin_analytics_1",
        bookings: [
          {
            id: "booking_1",
            totalPrice: 120,
            date: new Date("2026-04-21T18:00:00.000Z"),
            seatNumber: "A1",
            customerFirstName: "Ion",
            customerLastName: "Popescu",
            phoneNumber: "+37369111222",
            paymentMethod: "card",
            paymentStatus: "paid",
            ticketCode: "TKT-1111",
            qrCodeValue: "qr-1",
            createdAt: new Date("2026-04-20T10:00:00.000Z"),
            updatedAt: new Date("2026-04-20T10:00:00.000Z"),
            movie: {
              id: "movie_analytics_1",
              title: "Arrival",
              description: "Sci-fi drama",
              actors: ["Amy Adams"],
              releaseDate: new Date("2026-04-01T00:00:00.000Z"),
              posterUrl: "https://example.com/arrival.jpg",
              ticketPrice: 120,
              featured: true,
              adminId: "admin_analytics_1",
            },
            showtime: {
              id: "showtime_1",
              startTime: new Date("2026-04-21T18:00:00.000Z"),
              hall: "Hall 1",
              price: 120,
              totalSeats: 10,
              createdAt: new Date("2026-04-01T10:00:00.000Z"),
              updatedAt: new Date("2026-04-01T10:00:00.000Z"),
            },
            user: {
              id: "user_1",
              name: "Ion",
              email: "ion@example.com",
              password: "hashed-password",
            },
          },
          {
            id: "booking_2",
            totalPrice: 120,
            date: new Date("2026-04-21T18:00:00.000Z"),
            seatNumber: "A2",
            customerFirstName: "Ana",
            customerLastName: "Popescu",
            phoneNumber: "+37369111333",
            paymentMethod: "card",
            paymentStatus: "paid",
            ticketCode: "TKT-2222",
            qrCodeValue: "qr-2",
            createdAt: new Date("2026-04-20T11:00:00.000Z"),
            updatedAt: new Date("2026-04-20T11:00:00.000Z"),
            movie: {
              id: "movie_analytics_1",
              title: "Arrival",
              description: "Sci-fi drama",
              actors: ["Amy Adams"],
              releaseDate: new Date("2026-04-01T00:00:00.000Z"),
              posterUrl: "https://example.com/arrival.jpg",
              ticketPrice: 120,
              featured: true,
              adminId: "admin_analytics_1",
            },
            showtime: {
              id: "showtime_1",
              startTime: new Date("2026-04-21T18:00:00.000Z"),
              hall: "Hall 1",
              price: 120,
              totalSeats: 10,
              createdAt: new Date("2026-04-01T10:00:00.000Z"),
              updatedAt: new Date("2026-04-01T10:00:00.000Z"),
            },
            user: {
              id: "user_2",
              name: "Ana",
              email: "ana@example.com",
              password: "hashed-password",
            },
          },
          {
            id: "booking_3",
            totalPrice: 120,
            date: new Date("2026-04-22T20:00:00.000Z"),
            seatNumber: "B1",
            customerFirstName: "Mihai",
            customerLastName: "Ionescu",
            phoneNumber: "+37369111444",
            paymentMethod: "card",
            paymentStatus: "paid",
            ticketCode: "TKT-3333",
            qrCodeValue: "qr-3",
            createdAt: new Date("2026-04-20T12:00:00.000Z"),
            updatedAt: new Date("2026-04-20T12:00:00.000Z"),
            movie: {
              id: "movie_analytics_1",
              title: "Arrival",
              description: "Sci-fi drama",
              actors: ["Amy Adams"],
              releaseDate: new Date("2026-04-01T00:00:00.000Z"),
              posterUrl: "https://example.com/arrival.jpg",
              ticketPrice: 120,
              featured: true,
              adminId: "admin_analytics_1",
            },
            showtime: {
              id: "showtime_2",
              startTime: new Date("2026-04-22T20:00:00.000Z"),
              hall: "Hall 2",
              price: 120,
              totalSeats: 20,
              createdAt: new Date("2026-04-01T10:00:00.000Z"),
              updatedAt: new Date("2026-04-01T10:00:00.000Z"),
            },
            user: {
              id: "user_3",
              name: "Mihai",
              email: "mihai@example.com",
              password: "hashed-password",
            },
          },
        ],
        comments: [
          {
            id: "comment_1",
            rating: 5,
            text: "Amazing movie",
            movieId: "movie_analytics_1",
            userId: "user_1",
            userName: "Ion",
            userEmail: "ion@example.com",
            movieTitle: "Arrival",
            createdAt: new Date("2026-04-20T10:00:00.000Z"),
            updatedAt: new Date("2026-04-20T10:00:00.000Z"),
            user: {
              id: "user_1",
              name: "Ion",
              email: "ion@example.com",
              password: "hashed-password",
            },
          },
          {
            id: "comment_2",
            rating: 4,
            text: "Very good",
            movieId: "movie_analytics_1",
            userId: "user_2",
            userName: "Ana",
            userEmail: "ana@example.com",
            movieTitle: "Arrival",
            createdAt: new Date("2026-04-20T11:00:00.000Z"),
            updatedAt: new Date("2026-04-20T11:00:00.000Z"),
            user: {
              id: "user_2",
              name: "Ana",
              email: "ana@example.com",
              password: "hashed-password",
            },
          },
        ],
        showtimes: [
          {
            id: "showtime_1",
            startTime: new Date("2026-04-21T18:00:00.000Z"),
            hall: "Hall 1",
            price: 120,
            totalSeats: 10,
            bookings: [
              { id: "showtime_booking_1", totalPrice: 120, paymentStatus: "paid" },
              { id: "showtime_booking_2", totalPrice: 120, paymentStatus: "paid" },
            ],
          },
          {
            id: "showtime_2",
            startTime: new Date("2026-04-22T20:00:00.000Z"),
            hall: "Hall 2",
            price: 120,
            totalSeats: 20,
            bookings: [{ id: "showtime_booking_3", totalPrice: 120, paymentStatus: "paid" }],
          },
        ],
      },
    ],
  }));

  await getAdminById(
    {
      params: {
        id: "admin_analytics_1",
      },
      headers: { authorization: `Bearer ${token}` },
    },
    res,
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.admin.analytics.totalMovies, 1);
  assert.equal(res.body.admin.analytics.totalBookings, 3);
  assert.equal(res.body.admin.analytics.totalRevenue, 360);
  assert.equal(res.body.admin.analytics.occupancyRate, 10);
  assert.equal(res.body.admin.analytics.averageRating, 4.5);
  assert.equal(res.body.admin.analytics.topMovie.title, "Arrival");
  assert.equal(res.body.admin.addedMovies[0].analytics.totalBookings, 3);
  assert.equal(res.body.admin.addedMovies[0].analytics.revenue, 360);
  assert.equal(res.body.admin.addedMovies[0].analytics.occupancyRate, 10);
  assert.equal(res.body.admin.addedMovies[0].analytics.averageRating, 4.5);
  assert.equal(res.body.admin.managedBookings.length, 3);
  assert.equal(res.body.admin.managedReviews.length, 2);
  assert.equal(
    res.body.admin.addedMovies[0].analytics.mostPopularShowtimes[0].bookingsCount,
    2,
  );
});

test("deleteAdminManagedBooking removes booking for admin movie", async () => {
  process.env.SECRET_KEY = "test-secret-key";
  const res = createResponseMock();
  const token = jwt.sign({ id: "admin_owner_1" }, process.env.SECRET_KEY);

  stubMethod(prisma.booking, "findUnique", async () => ({
    id: "booking_admin_1",
    movie: {
      adminId: "admin_owner_1",
    },
  }));
  const deleteStub = stubMethod(prisma.booking, "delete", async () => ({ id: "booking_admin_1" }));

  await deleteAdminManagedBooking(
    {
      params: { id: "booking_admin_1" },
      headers: { authorization: `Bearer ${token}` },
    },
    res,
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.message, "Booking deleted successfully");
  assert.equal(deleteStub.mock.calls[0].arguments[0].where.id, "booking_admin_1");
});

test("deleteAdminManagedReview removes review for admin movie", async () => {
  process.env.SECRET_KEY = "test-secret-key";
  const res = createResponseMock();
  const token = jwt.sign({ id: "admin_owner_1" }, process.env.SECRET_KEY);

  stubMethod(prisma.comment, "findUnique", async () => ({
    id: "review_admin_1",
    movie: {
      adminId: "admin_owner_1",
    },
  }));
  const deleteStub = stubMethod(prisma.comment, "delete", async () => ({ id: "review_admin_1" }));

  await deleteAdminManagedReview(
    {
      params: { id: "review_admin_1" },
      headers: { authorization: `Bearer ${token}` },
    },
    res,
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.message, "Review deleted successfully");
  assert.equal(deleteStub.mock.calls[0].arguments[0].where.id, "review_admin_1");
});

test("deleteMovieReview removes the current user's review", async () => {
  process.env.SECRET_KEY = "test-secret-key";
  const res = createResponseMock();
  const token = jwt.sign({ id: "user_review_1" }, process.env.SECRET_KEY);

  stubMethod(prisma.comment, "findUnique", async () => ({
    id: "review_1",
    movieId: "movie_1",
    userId: "user_review_1",
  }));
  stubMethod(prisma.comment, "delete", async () => ({ id: "review_1" }));
  stubMethod(prisma.comment, "findMany", async () => []);
  stubMethod(prisma.comment, "groupBy", async () => []);

  await deleteMovieReview(
    {
      params: {
        id: "movie_1",
        reviewId: "review_1",
      },
      headers: {
        authorization: `Bearer ${token}`,
      },
    },
    res,
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.message, "Review deleted successfully");
  assert.equal(res.body.comments.length, 0);
  assert.equal(res.body.averageRating, 0);
  assert.equal(res.body.ratingsCount, 0);
});

test("getAllMovies sorts by price ascending and forwards release date range", async () => {
  const res = createResponseMock();
  const releaseDate = new Date("2026-05-01T00:00:00.000Z");

  const findManyStub = stubMethod(prisma.movie, "findMany", async () => [
    {
      id: "movie_1",
      title: "Premium Seat",
      description: "Premium",
      actors: ["Actor A"],
      releaseDate,
      posterUrl: "https://example.com/premium.jpg",
      ticketPrice: 180,
      featured: false,
      adminId: "admin_1",
      showtimes: [],
    },
    {
      id: "movie_2",
      title: "Budget Seat",
      description: "Budget",
      actors: ["Actor B"],
      releaseDate,
      posterUrl: "https://example.com/budget.jpg",
      ticketPrice: 80,
      featured: false,
      adminId: "admin_1",
      showtimes: [],
    },
  ]);
  stubMethod(prisma.comment, "groupBy", async () => []);

  await getAllMovies(
    {
      query: {
        releaseDateFrom: "2026-05-01",
        releaseDateTo: "2026-05-31",
        sortBy: "price",
        sortOrder: "asc",
      },
    },
    res,
  );

  assert.equal(res.statusCode, 200);
  assert.equal(
    findManyStub.mock.calls[0].arguments[0].orderBy.ticketPrice,
    "asc",
  );
  assert.ok(findManyStub.mock.calls[0].arguments[0].where.releaseDate.gte instanceof Date);
  assert.ok(findManyStub.mock.calls[0].arguments[0].where.releaseDate.lte instanceof Date);
  assert.deepEqual(
    res.body.movies.map((movie) => movie.title),
    ["Budget Seat", "Premium Seat"],
  );
});

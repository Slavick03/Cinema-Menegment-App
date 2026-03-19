import express from "express";
import {
  deleteBooking,
  getBookedSeatsByMovieAndDate,
  getBookingById,
  newBooking,
} from "../controller/booking-controller.js";

const bookingsRouter = express.Router();

bookingsRouter.get("/movie/:movieId/seats", getBookedSeatsByMovieAndDate);
bookingsRouter.get("/:id", getBookingById);
bookingsRouter.post("/", newBooking);
bookingsRouter.delete("/:id", deleteBooking);
export default bookingsRouter;

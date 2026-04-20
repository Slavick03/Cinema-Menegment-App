import express from "express";
import { authenticateUser } from "../middleware/auth.js";
import {
  completePaymentBooking,
  createPaymentIntent,
  deleteBooking,
  getStripeConfig,
  getBookedSeatsByShowtime,
  getBookingById,
  newBooking,
} from "../controller/booking-controller.js";

const bookingsRouter = express.Router();

bookingsRouter.get("/payment/config", getStripeConfig);
bookingsRouter.get("/showtime/:showtimeId/seats", getBookedSeatsByShowtime);
bookingsRouter.post("/payment/intent", authenticateUser, createPaymentIntent);
bookingsRouter.post("/payment/complete", authenticateUser, completePaymentBooking);
bookingsRouter.get("/:id", authenticateUser, getBookingById);
bookingsRouter.post("/", authenticateUser, newBooking);
bookingsRouter.delete("/:id", authenticateUser, deleteBooking);
export default bookingsRouter;

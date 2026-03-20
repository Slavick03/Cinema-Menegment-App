import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  movie: {
    type: mongoose.Types.ObjectId,
    ref: "Movie",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  seatNumber: {
    type: String,
    required: true,
    trim: true,
  },
  customerFirstName: {
    type: String,
    required: true,
    trim: true,
  },
  customerLastName: {
    type: String,
    required: true,
    trim: true,
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true,
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ["apple_pay", "google_pay", "card"],
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ["pending", "paid"],
    default: "paid",
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  ticketCode: {
    type: String,
    required: true,
    trim: true,
  },
  qrCodeValue: {
    type: String,
    required: true,
    trim: true,
  },
  user: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: true,
  },
}, { timestamps: true });

bookingSchema.index({ movie: 1, date: 1, seatNumber: 1 }, { unique: true });

export default mongoose.model("Booking", bookingSchema);

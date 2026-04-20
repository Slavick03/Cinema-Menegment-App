import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { cleanupExpiredReservations } from "../utils/booking-lifecycle.js";
import { serializeBooking, serializeUser } from "../utils/serializers.js";

const hasEmptyValue = (...values) =>
  values.some((value) => typeof value !== "string" || value.trim() === "");

export const getAllUsers = async (req, res, next) => {
  let users;
  try {
    users = await prisma.user.findMany();
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch users" });
  }

  return res.status(200).json({ users: users.map(serializeUser) });
};

export const signup = async (req, res, next) => {
  const { name, email, password } = req.body;

  if (hasEmptyValue(name, email, password)) {
    return res.status(422).json({ message: "Invalid Inputs" });
  }

  let existingUser;
  try {
    existingUser = await prisma.user.findUnique({
      where: { email: email.trim() },
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to validate user" });
  }

  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  let user;
  try {
    user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim(),
        password: hashedPassword,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Unable to create user" });
  }

  let token;
  try {
    token = jwt.sign({ id: user.id }, process.env.SECRET_KEY, {
      expiresIn: "14d",
    });
  } catch (err) {
    return res.status(500).json({ message: "Authentication is not configured correctly" });
  }

  return res.status(201).json({ user: serializeUser(user), token, id: user.id });
};

export const singup = signup;

export const updateUser = async (req, res, next) => {
  const id = req.params.id;
  const { name, email, password } = req.body;

  if (req.userId !== id) {
    return res.status(403).json({ message: "You are not allowed to update this profile" });
  }

  if (hasEmptyValue(name, email, password)) {
    return res.status(422).json({ message: "Invalid Inputs" });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  let user;
  try {
    user = await prisma.user.update({
      where: { id },
      data: {
        name: name.trim(),
        email: email.trim(),
        password: hashedPassword,
      },
    });
  } catch (err) {
    if (err?.code === "P2025") {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(500).json({ message: "Unable to update user" });
  }

  return res.status(200).json({
    message: "Updated Successfully",
    user: serializeUser(user),
  });
};

export const deleteUser = async (req, res, next) => {
  const id = req.params.id;

  if (req.userId !== id) {
    return res.status(403).json({ message: "You are not allowed to delete this profile" });
  }

  try {
    await prisma.user.delete({
      where: { id },
    });
  } catch (err) {
    if (err?.code === "P2025") {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(500).json({ message: "Unable to delete user" });
  }

  return res.status(200).json({ message: "Deleted Successfully" });
};

export const login = async (req, res, next) => {
  const { email, password } = req.body;

  if (hasEmptyValue(email, password)) {
    return res.status(422).json({ message: "Invalid Inputs" });
  }

  let existingUser;
  try {
    existingUser = await prisma.user.findUnique({
      where: { email: email.trim() },
    });
  } catch (err) {
    return res.status(500).json({ message: "Unable to login" });
  }

  if (!existingUser) {
    return res.status(404).json({ message: "User not found" });
  }

  const isPasswordCorrect = bcrypt.compareSync(password, existingUser.password);

  if (!isPasswordCorrect) {
    return res.status(400).json({ message: "Incorrect Password" });
  }

  let token;
  try {
    token = jwt.sign({ id: existingUser.id }, process.env.SECRET_KEY, {
      expiresIn: "14d",
    });
  } catch (err) {
    return res.status(500).json({ message: "Authentication is not configured correctly" });
  }

  return res
    .status(200)
    .json({ message: "Login Successfull", token, id: existingUser.id });
};

export const getBookingsOfUser = async (req, res, next) => {
  const id = req.params.id;

  if (req.userId !== id) {
    return res.status(403).json({ message: "You are not allowed to view these bookings" });
  }

  let bookings;
  try {
    await cleanupExpiredReservations();
    bookings = await prisma.booking.findMany({
      where: { userId: id },
      include: { movie: true, showtime: true, user: true },
      orderBy: { createdAt: "desc" },
    });
  } catch (err) {
    return res.status(500).json({ message: "Unable to get bookings" });
  }

  return res.status(200).json({ bookings: bookings.map(serializeBooking) });
};

export const getUserById = async (req, res, next) => {
  const id = req.params.id;

  if (req.userId !== id) {
    return res.status(403).json({ message: "You are not allowed to view this profile" });
  }

  let user;
  try {
    user = await prisma.user.findUnique({
      where: { id },
    });
  } catch (err) {
    return res.status(500).json({ message: "Unable to fetch user" });
  }
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  return res.status(200).json({ user: serializeUser(user) });
};

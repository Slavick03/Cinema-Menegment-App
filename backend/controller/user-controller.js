import bcrypt from "bcryptjs";
import Bookings from "../models/Bookings.js";
import User from "../models/User.js";

const hasEmptyValue = (...values) =>
  values.some((value) => typeof value !== "string" || value.trim() === "");

export const getAllUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find();
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch users" });
  }

  return res.status(200).json({ users });
};

export const signup = async (req, res, next) => {
  const { name, email, password } = req.body;

  if (hasEmptyValue(name, email, password)) {
    return res.status(422).json({ message: "Invalid Inputs" });
  }

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email.trim() });
  } catch (err) {
    return res.status(500).json({ message: "Failed to validate user" });
  }

  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  let user;
  try {
    user = new User({
      name: name.trim(),
      email: email.trim(),
      password: hashedPassword,
    });
    user = await user.save();
  } catch (err) {
    return res.status(500).json({ message: "Unable to create user" });
  }

  return res.status(201).json({ user, id: user._id });
};

export const singup = signup;

export const updateUser = async (req, res, next) => {
  const id = req.params.id;
  const { name, email, password } = req.body;

  if (hasEmptyValue(name, email, password)) {
    return res.status(422).json({ message: "Invalid Inputs" });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  let user;
  try {
    user = await User.findByIdAndUpdate(id, {
      name: name.trim(),
      email: email.trim(),
      password: hashedPassword,
    }, {
      new: true,
    });
  } catch (errr) {
    return res.status(500).json({ message: "Unable to update user" });
  }
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.status(200).json({ message: "Updated Successfully", user });
};

export const deleteUser = async (req, res, next) => {
  const id = req.params.id;
  let user;
  try {
    user = await User.findByIdAndDelete(id);
  } catch (err) {
    return res.status(500).json({ message: "Unable to delete user" });
  }
  if (!user) {
    return res.status(404).json({ message: "User not found" });
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
    existingUser = await User.findOne({ email: email.trim() });
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

  return res
    .status(200)
    .json({ message: "Login Successfull", id: existingUser._id });
};

export const getBookingsOfUser = async (req, res, next) => {
  const id = req.params.id;
  let bookings;
  try {
    bookings = await Bookings.find({ user: id })
      .populate("movie")
      .populate("user");
  } catch (err) {
    return res.status(500).json({ message: "Unable to get bookings" });
  }

  return res.status(200).json({ bookings });
};

export const getUserById = async (req, res, next) => {
  const id = req.params.id;
  let user;
  try {
    user = await User.findById(id);
  } catch (err) {
    return res.status(500).json({ message: "Unable to fetch user" });
  }
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  return res.status(200).json({ user });
};

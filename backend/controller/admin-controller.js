import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { serializeAdmin, serializeMovie } from "../utils/serializers.js";

const hasEmptyValue = (...values) =>
  values.some((value) => typeof value !== "string" || value.trim() === "");

export const addAdmin = async (req, res, next) => {
  const { email, password } = req.body;

  if (hasEmptyValue(email, password)) {
    return res.status(422).json({ message: "Invalid Inputs" });
  }

  let existingAdmin;
  try {
    existingAdmin = await prisma.admin.findUnique({
      where: { email: email.trim() },
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to validate admin" });
  }

  if (existingAdmin) {
    return res.status(400).json({ message: "Admin already exists" });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  let admin;
  try {
    admin = await prisma.admin.create({
      data: {
        email: email.trim(),
        password: hashedPassword,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Unable to store admin" });
  }

  return res.status(201).json({ admin: serializeAdmin(admin) });
};

export const adminLogin = async (req, res, next) => {
  const { email, password } = req.body;

  if (hasEmptyValue(email, password)) {
    return res.status(422).json({ message: "Invalid Inputs" });
  }

  let existingAdmin;
  try {
    existingAdmin = await prisma.admin.findUnique({
      where: { email: email.trim() },
    });
  } catch (err) {
    return res.status(500).json({ message: "Unable to login admin" });
  }

  if (!existingAdmin) {
    return res.status(400).json({ message: "Admin not found" });
  }

  const isPasswordCorrect = bcrypt.compareSync(
    password,
    existingAdmin.password,
  );

  if (!isPasswordCorrect) {
    return res.status(400).json({ message: "Incorrect Password" });
  }

  const token = jwt.sign({ id: existingAdmin.id }, process.env.SECRET_KEY, {
    expiresIn: "14d",
  });

  return res
    .status(200)
    .json({ message: "Authentication Complete", token, id: existingAdmin.id });
};

export const getAdmins = async (req, res, next) => {
  let admins;
  try {
    admins = await prisma.admin.findMany();
  } catch (err) {
    return res.status(500).json({ message: "Internal Server Error" });
  }

  return res.status(200).json({ admins: admins.map(serializeAdmin) });
};

export const getAdminById = async (req, res, next) => {
  const id = req.params.id;

  let admin;
  try {
    admin = await prisma.admin.findUnique({
      where: { id },
      include: { movies: true },
    });
  } catch (err) {
    return res.status(500).json({ message: "Unable to fetch admin" });
  }

  if (!admin) {
    return res.status(404).json({ message: "Admin not found" });
  }

  return res.status(200).json({
    admin: {
      ...serializeAdmin(admin),
      addedMovies: admin.movies.map(serializeMovie),
    },
  });
};

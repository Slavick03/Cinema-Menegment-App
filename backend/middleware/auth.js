import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

const getBearerToken = (authHeader = "") => {
  if (typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
    return "";
  }

  return authHeader.split(" ")[1] || "";
};

export const verifyToken = (authHeader = "") => {
  const token = getBearerToken(authHeader);

  if (!token) {
    return { error: "Token not found" };
  }

  try {
    const payload = jwt.verify(token, process.env.SECRET_KEY);
    return { payload };
  } catch (err) {
    return { error: err.message };
  }
};

export const authenticateUser = (req, res, next) => {
  const { payload, error } = verifyToken(req.headers.authorization || "");

  if (error) {
    return res.status(401).json({ message: error });
  }

  req.userId = payload.id;
  return next();
};

export const authenticateAdmin = async (req, res, next) => {
  const { payload, error } = verifyToken(req.headers.authorization || "");

  if (error) {
    return res.status(401).json({ message: error });
  }

  let admin;
  try {
    admin = await prisma.admin.findUnique({
      where: { id: payload.id },
      select: { id: true },
    });
  } catch (err) {
    return res.status(500).json({ message: "Unable to validate admin" });
  }

  if (!admin) {
    return res.status(403).json({ message: "Only administrators can access this resource" });
  }

  req.adminId = admin.id;
  return next();
};

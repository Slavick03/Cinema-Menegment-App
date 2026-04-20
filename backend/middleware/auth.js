import jwt from "jsonwebtoken";

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

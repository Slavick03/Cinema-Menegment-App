import express from "express";
import { authenticateUser } from "../middleware/auth.js";
import {
  deleteUser,
  getAllUsers,
  getBookingsOfUser,
  getUserById,
  login,
  signup,
  updateUser,
} from "../controller/user-controller.js";

const userRouter = express.Router();

userRouter.get("/", getAllUsers);
userRouter.post("/signup", signup);
userRouter.post("/login", login);
userRouter.get("/bookings/:id", authenticateUser, getBookingsOfUser);
userRouter.get("/:id", authenticateUser, getUserById);
userRouter.put("/:id", authenticateUser, updateUser);
userRouter.delete("/:id", authenticateUser, deleteUser);

export default userRouter;

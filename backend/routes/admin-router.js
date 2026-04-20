import express from "express";
import {
  addAdmin,
  adminLogin,
  deleteAdminManagedBooking,
  deleteAdminManagedReview,
  getAdminById,
  getAdmins,
  updateHomeHeroSettings,
} from "../controller/admin-controller.js";

const adminRouter = express.Router();

adminRouter.post("/signup", addAdmin);
adminRouter.post("/login", adminLogin);
adminRouter.get("/", getAdmins);
adminRouter.put("/home-hero", updateHomeHeroSettings);
adminRouter.delete("/booking/:id", deleteAdminManagedBooking);
adminRouter.delete("/review/:id", deleteAdminManagedReview);
adminRouter.get("/:id", getAdminById);

export default adminRouter;

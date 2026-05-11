import express from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import {
  addAdmin,
  adminLogin,
  deleteAdminManagedBooking,
  deleteAdminManagedReview,
  getAdminById,
  getAdmins,
  updateHomeHeroSettings,
} from "../controller/admin-controller.js";
import {
  getThemeSettings,
  updateThemeSettings,
  uploadThemeFavicon,
  uploadThemeLogo,
} from "../controller/theme-controller.js";
import { authenticateAdmin } from "../middleware/auth.js";

const adminRouter = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const themeUploadDirectory = path.resolve(__dirname, "../uploads/theme");

const imageFileFilter = (req, file, callback) => {
  if (file.mimetype?.startsWith("image/")) {
    callback(null, true);
    return;
  }

  callback(new Error("Only image files can be uploaded"));
};

const themeUploadStorage = multer.diskStorage({
  destination: (req, file, callback) => {
    fs.mkdirSync(themeUploadDirectory, { recursive: true });
    callback(null, themeUploadDirectory);
  },
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname || "").toLowerCase();
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
    callback(null, safeName);
  },
});

const uploadThemeAsset = multer({
  storage: themeUploadStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

const uploadSingleThemeFile = (req, res, next) => {
  uploadThemeAsset.single("file")(req, res, (err) => {
    if (err) {
      return res.status(422).json({ message: err.message });
    }

    return next();
  });
};

adminRouter.post("/signup", addAdmin);
adminRouter.post("/login", adminLogin);
adminRouter.get("/", getAdmins);
adminRouter.get("/theme", authenticateAdmin, getThemeSettings);
adminRouter.put("/theme", authenticateAdmin, updateThemeSettings);
adminRouter.post(
  "/theme/upload-logo",
  authenticateAdmin,
  uploadSingleThemeFile,
  uploadThemeLogo,
);
adminRouter.post(
  "/theme/upload-favicon",
  authenticateAdmin,
  uploadSingleThemeFile,
  uploadThemeFavicon,
);
adminRouter.put("/home-hero", updateHomeHeroSettings);
adminRouter.delete("/booking/:id", deleteAdminManagedBooking);
adminRouter.delete("/review/:id", deleteAdminManagedReview);
adminRouter.get("/:id", getAdminById);

export default adminRouter;

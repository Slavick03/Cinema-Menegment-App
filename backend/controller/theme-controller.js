import { prisma } from "../lib/prisma.js";
import { serializeThemeSettings } from "../utils/serializers.js";

export const DEFAULT_THEME_SETTINGS = {
  _id: "default",
  key: "main",
  primaryColor: "#ff7a45",
  secondaryColor: "#6dd3ff",
  backgroundColor: "#0f1722",
  logoUrl: "",
  faviconUrl: "",
  fontFamily: "Manrope",
  companyName: "Cinema Lounge",
  updatedAt: null,
};

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;
const MAX_TEXT_LENGTH = 120;

const normalizeText = (value) =>
  typeof value === "string" ? value.trim() : undefined;

const getThemeRecord = async () => prisma.themeSettings.findUnique({
  where: { key: "main" },
});

const buildCreatePayload = (overrides = {}) => ({
  key: "main",
  primaryColor: DEFAULT_THEME_SETTINGS.primaryColor,
  secondaryColor: DEFAULT_THEME_SETTINGS.secondaryColor,
  backgroundColor: DEFAULT_THEME_SETTINGS.backgroundColor,
  logoUrl: DEFAULT_THEME_SETTINGS.logoUrl,
  faviconUrl: DEFAULT_THEME_SETTINGS.faviconUrl,
  fontFamily: DEFAULT_THEME_SETTINGS.fontFamily,
  companyName: DEFAULT_THEME_SETTINGS.companyName,
  ...overrides,
});

export const getThemeSettings = async (req, res, next) => {
  let settings;

  try {
    settings = await getThemeRecord();
  } catch (err) {
    return res.status(500).json({ message: "Unable to fetch theme settings" });
  }

  if (!settings) {
    return res.status(200).json({
      settings: DEFAULT_THEME_SETTINGS,
      isDefault: true,
    });
  }

  return res.status(200).json({
    settings: serializeThemeSettings(settings),
    isDefault: false,
  });
};

export const updateThemeSettings = async (req, res, next) => {
  const normalizedFields = {
    primaryColor: normalizeText(req.body.primaryColor),
    secondaryColor: normalizeText(req.body.secondaryColor),
    backgroundColor: normalizeText(req.body.backgroundColor),
    fontFamily: normalizeText(req.body.fontFamily),
    companyName: normalizeText(req.body.companyName),
  };

  const colorFields = [
    normalizedFields.primaryColor,
    normalizedFields.secondaryColor,
    normalizedFields.backgroundColor,
  ];

  if (colorFields.some((color) => typeof color === "string" && !HEX_COLOR_PATTERN.test(color))) {
    return res.status(422).json({ message: "Theme colors must be valid 6-digit hex values" });
  }

  if (
    [normalizedFields.fontFamily, normalizedFields.companyName].some(
      (value) => typeof value === "string" && (value.length === 0 || value.length > MAX_TEXT_LENGTH),
    )
  ) {
    return res.status(422).json({ message: "Company name and font family are required and must stay under 120 characters" });
  }

  const updatePayload = Object.entries(normalizedFields).reduce((payload, [key, value]) => {
    if (typeof value === "string") {
      payload[key] = value;
    }

    return payload;
  }, {});

  let settings;
  try {
    settings = await prisma.themeSettings.upsert({
      where: { key: "main" },
      create: buildCreatePayload(updatePayload),
      update: updatePayload,
    });
  } catch (err) {
    return res.status(500).json({ message: "Unable to update theme settings" });
  }

  return res.status(200).json({
    message: "Theme settings updated successfully",
    settings: serializeThemeSettings(settings),
  });
};

const updateThemeAsset = async (req, res, fieldName, successMessage) => {
  if (!req.file) {
    return res.status(422).json({ message: "Image file is required" });
  }

  const assetUrl = `/uploads/theme/${req.file.filename}`;

  let settings;
  try {
    settings = await prisma.themeSettings.upsert({
      where: { key: "main" },
      create: buildCreatePayload({ [fieldName]: assetUrl }),
      update: { [fieldName]: assetUrl },
    });
  } catch (err) {
    return res.status(500).json({ message: "Unable to update theme asset" });
  }

  return res.status(200).json({
    message: successMessage,
    settings: serializeThemeSettings(settings),
  });
};

export const uploadThemeLogo = async (req, res, next) =>
  updateThemeAsset(req, res, "logoUrl", "Theme logo uploaded successfully");

export const uploadThemeFavicon = async (req, res, next) =>
  updateThemeAsset(req, res, "faviconUrl", "Theme favicon uploaded successfully");

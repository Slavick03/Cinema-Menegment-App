import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  getAdminThemeSettings,
  updateThemeSettings,
  uploadThemeFavicon,
  uploadThemeLogo,
} from "../api-helpers/api-helpers";
import { useI18n } from "../i18n/LanguageContext";
import { themeActions } from "../store";
import { resolveAssetUrl } from "../utils/theme-utils";

const fontOptions = [
  "Manrope",
  "Space Grotesk",
  "Inter",
  "Arial",
  "Georgia",
  "Times New Roman",
];

const colorFields = [
  { key: "primaryColor", labelKey: "brandSettingsPrimaryColor" },
  { key: "secondaryColor", labelKey: "brandSettingsSecondaryColor" },
  { key: "backgroundColor", labelKey: "brandSettingsBackgroundColor" },
];

const BrandSettings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useI18n();
  const currentTheme = useSelector((state) => state.theme.settings);
  const [form, setForm] = useState(currentTheme);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    getAdminThemeSettings()
      .then((res) => {
        if (res?.settings) {
          setForm(res.settings);
          dispatch(themeActions.setTheme(res.settings));
        }
      })
      .catch((err) => setErrorMessage(err.message));
  }, [dispatch]);

  const handleFieldChange = (field) => (event) => {
    setStatusMessage("");
    setErrorMessage("");
    setForm((previousForm) => ({
      ...previousForm,
      [field]: event.target.value,
    }));
  };

  const syncTheme = (settings) => {
    setForm(settings);
    dispatch(themeActions.setTheme(settings));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMessage("");
    setErrorMessage("");

    try {
      const res = await updateThemeSettings(form);
      syncTheme(res.settings);
      setStatusMessage(t("brandSettingsSaved"));
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpload = (uploadCallback, setIsUploading) => async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setIsUploading(true);
    setStatusMessage("");
    setErrorMessage("");

    try {
      const res = await uploadCallback(file);
      syncTheme(res.settings);
      setStatusMessage(t("brandSettingsAssetUploaded"));
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Box width="min(1180px, calc(100% - 24px))" mx="auto">
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems={{ xs: "stretch", md: "center" }}
        flexDirection={{ xs: "column", md: "row" }}
        gap={2}
        mb={3}
      >
        <Box>
          <Typography
            variant="h3"
            sx={{
              fontFamily: "var(--theme-font-family)",
              fontSize: { xs: "2rem", md: "2.6rem" },
              fontWeight: 800,
            }}
          >
            {t("brandSettingsTitle")}
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.62)", mt: 0.75 }}>
            {t("brandSettingsDescription")}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<ArrowBackRoundedIcon />}
          onClick={() => navigate("/user-admin")}
          sx={{
            borderRadius: 999,
            borderColor: "rgba(255,255,255,0.18)",
            color: "white",
            px: 2.5,
            alignSelf: { xs: "flex-start", md: "center" },
            ":hover": {
              borderColor: "var(--theme-secondary-color)",
              bgcolor: "rgba(255,255,255,0.06)",
            },
          }}
        >
          {t("brandSettingsBackToProfile")}
        </Button>
      </Box>

      <Box display="grid" gridTemplateColumns={{ xs: "1fr", lg: "1.05fr 0.95fr" }} gap={3}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3 },
            borderRadius: 4,
            border: "1px solid rgba(255,255,255,0.08)",
            bgcolor: "rgba(11,20,31,0.84)",
            color: "white",
          }}
        >
          <Stack spacing={2.25}>
            <Typography variant="h5" fontWeight={800}>
              {t("brandSettingsIdentity")}
            </Typography>
            <TextField
              label={t("brandSettingsCompanyName")}
              value={form.companyName || ""}
              onChange={handleFieldChange("companyName")}
              fullWidth
              sx={textFieldSx}
            />
            <TextField
              select
              label={t("brandSettingsFontFamily")}
              value={form.fontFamily || "Manrope"}
              onChange={handleFieldChange("fontFamily")}
              fullWidth
              sx={textFieldSx}
            >
              {fontOptions.map((font) => (
                <MenuItem key={font} value={font}>
                  {font}
                </MenuItem>
              ))}
            </TextField>

            <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

            <Typography variant="h5" fontWeight={800}>
              {t("brandSettingsPalette")}
            </Typography>
            <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "repeat(3, 1fr)" }} gap={2}>
              {colorFields.map((field) => (
                <TextField
                  key={field.key}
                  label={t(field.labelKey)}
                  type="color"
                  value={form[field.key] || "#000000"}
                  onChange={handleFieldChange(field.key)}
                  fullWidth
                  sx={{
                    ...textFieldSx,
                    "& input": {
                      minHeight: 46,
                      cursor: "pointer",
                    },
                  }}
                />
              ))}
            </Box>

            <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

            <Typography variant="h5" fontWeight={800}>
              {t("brandSettingsAssets")}
            </Typography>
            <Box display="flex" gap={1.5} flexWrap="wrap">
              <Button
                component="label"
                variant="outlined"
                startIcon={<UploadFileRoundedIcon />}
                disabled={isUploadingLogo}
                sx={uploadButtonSx}
              >
                {isUploadingLogo
                  ? t("brandSettingsUploadingLogo")
                  : t("brandSettingsUploadLogo")}
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={handleUpload(uploadThemeLogo, setIsUploadingLogo)}
                />
              </Button>
              <Button
                component="label"
                variant="outlined"
                startIcon={<UploadFileRoundedIcon />}
                disabled={isUploadingFavicon}
                sx={uploadButtonSx}
              >
                {isUploadingFavicon
                  ? t("brandSettingsUploadingFavicon")
                  : t("brandSettingsUploadFavicon")}
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={handleUpload(uploadThemeFavicon, setIsUploadingFavicon)}
                />
              </Button>
            </Box>

            {statusMessage && (
              <Typography sx={{ color: "#9de8b3" }}>{statusMessage}</Typography>
            )}
            {errorMessage && (
              <Typography sx={{ color: "#ff9aa2" }}>{errorMessage}</Typography>
            )}

            <Button
              variant="contained"
              startIcon={<SaveRoundedIcon />}
              onClick={handleSave}
              disabled={isSaving}
              sx={{
                borderRadius: 999,
                bgcolor: "var(--theme-primary-color)",
                color: "#08111b",
                fontWeight: 900,
                alignSelf: "flex-start",
                px: 3,
                ":hover": {
                  bgcolor: "var(--theme-primary-color)",
                  filter: "brightness(1.08)",
                },
              }}
            >
              {isSaving ? t("brandSettingsSaving") : t("brandSettingsSave")}
            </Button>
          </Stack>
        </Paper>

        <Box
          sx={{
            minHeight: 420,
            borderRadius: 4,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)",
            bgcolor: form.backgroundColor,
            color: "white",
            fontFamily: `"${form.fontFamily}", sans-serif`,
          }}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            gap={2}
            p={2.25}
            sx={{
              bgcolor: "rgba(0,0,0,0.22)",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <Box display="flex" alignItems="center" gap={1.25} minWidth={0}>
              {form.logoUrl ? (
                <Box
                  component="img"
                  src={resolveAssetUrl(form.logoUrl)}
                  alt=""
                  sx={{
                    width: 44,
                    height: 44,
                    objectFit: "contain",
                    borderRadius: 2,
                    bgcolor: "rgba(255,255,255,0.08)",
                    p: 0.5,
                  }}
                />
              ) : (
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    bgcolor: form.primaryColor,
                  }}
                />
              )}
              <Typography fontWeight={900} noWrap>
                {form.companyName || t("brandSettingsCompanyFallback")}
              </Typography>
            </Box>
            {form.faviconUrl && (
              <Box
                component="img"
                src={resolveAssetUrl(form.faviconUrl)}
                alt=""
                sx={{ width: 28, height: 28, objectFit: "contain" }}
              />
            )}
          </Box>

          <Box p={{ xs: 2.5, md: 3 }} display="grid" gap={2.5}>
            <Typography variant="h4" fontWeight={900}>
              {t("brandSettingsPreview")}
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.72)", maxWidth: 480 }}>
              {t("brandSettingsPreviewDescription", {
                companyName:
                  form.companyName || t("brandSettingsPreviewCompanyFallback"),
              })}
            </Typography>
            <Box display="flex" gap={1.5} flexWrap="wrap">
              <Button
                variant="contained"
                sx={{
                  borderRadius: 999,
                  bgcolor: form.primaryColor,
                  color: "#08111b",
                  fontWeight: 900,
                  px: 3,
                  ":hover": { bgcolor: form.primaryColor, filter: "brightness(1.08)" },
                }}
              >
                {t("brandSettingsPrimaryAction")}
              </Button>
              <Button
                variant="outlined"
                sx={{
                  borderRadius: 999,
                  borderColor: form.secondaryColor,
                  color: form.secondaryColor,
                  fontWeight: 900,
                  px: 3,
                }}
              >
                {t("brandSettingsSecondaryAction")}
              </Button>
            </Box>
            <Box
              sx={{
                p: 2,
                borderRadius: 3,
                border: "1px solid rgba(255,255,255,0.1)",
                bgcolor: "rgba(255,255,255,0.06)",
              }}
            >
              <Typography fontWeight={900}>
                {t("brandSettingsPreviewCardTitle")}
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.62)", mt: 0.75 }}>
                {t("brandSettingsPreviewCardDescription")}
              </Typography>
              <Box
                sx={{
                  height: 8,
                  width: "56%",
                  mt: 2,
                  borderRadius: 999,
                  background: `linear-gradient(90deg, ${form.primaryColor}, ${form.secondaryColor})`,
                }}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

const textFieldSx = {
  "& .MuiInputBase-input": {
    color: "white",
  },
  "& .MuiInputLabel-root": {
    color: "rgba(255,255,255,0.68)",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "var(--theme-secondary-color)",
  },
  "& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(255,255,255,0.16)",
  },
  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(255,255,255,0.32)",
  },
  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "var(--theme-secondary-color)",
  },
  "& .MuiSvgIcon-root": {
    color: "rgba(255,255,255,0.72)",
  },
};

const uploadButtonSx = {
  borderRadius: 999,
  borderColor: "rgba(255,255,255,0.18)",
  color: "white",
  fontWeight: 800,
  px: 2.5,
  ":hover": {
    borderColor: "var(--theme-secondary-color)",
    bgcolor: "rgba(255,255,255,0.06)",
  },
};

export default BrandSettings;

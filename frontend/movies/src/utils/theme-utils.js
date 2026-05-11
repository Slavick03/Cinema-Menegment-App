import axios from "axios";

export const resolveAssetUrl = (url) => {
  if (!url) {
    return "";
  }

  if (/^https?:\/\//i.test(url) || url.startsWith("data:")) {
    return url;
  }

  const baseUrl = axios.defaults.baseURL || "";
  return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
};

export const applyThemeToDocument = (theme) => {
  if (!theme || typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  root.style.setProperty("--theme-primary-color", theme.primaryColor);
  root.style.setProperty("--theme-secondary-color", theme.secondaryColor);
  root.style.setProperty("--theme-background-color", theme.backgroundColor);
  root.style.setProperty("--accent", theme.primaryColor);
  root.style.setProperty("--accent-strong", theme.primaryColor);
  root.style.setProperty("--accent-cool", theme.secondaryColor);
  root.style.setProperty("--bg-main", theme.backgroundColor);
  root.style.setProperty("--theme-font-family", `"${theme.fontFamily}", sans-serif`);

  if (theme.companyName) {
    document.title = theme.companyName;
  }

  if (theme.faviconUrl) {
    const faviconUrl = resolveAssetUrl(theme.faviconUrl);
    let favicon = document.querySelector("link[rel='icon']");

    if (!favicon) {
      favicon = document.createElement("link");
      favicon.rel = "icon";
      document.head.appendChild(favicon);
    }

    favicon.href = faviconUrl;
  }
};

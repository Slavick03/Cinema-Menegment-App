import { configureStore, createSlice } from "@reduxjs/toolkit";

const defaultThemeSettings = {
  primaryColor: "#ff7a45",
  secondaryColor: "#6dd3ff",
  backgroundColor: "#0f1722",
  logoUrl: "",
  faviconUrl: "",
  fontFamily: "Manrope",
  companyName: "Cinema Lounge",
};

const userSclice = createSlice({
  name: "user",
  initialState: { isLoggedIn: false },
  reducers: {
    login(state) {
      state.isLoggedIn = true;
    },
    logout(state) {
      localStorage.removeItem("userId");
      localStorage.removeItem("token");
      state.isLoggedIn = false;
    },
  },
});

const adminSlice = createSlice({
  name: "auth",
  initialState: { isLoggedIn: false },
  reducers: {
    login(state) {
      state.isLoggedIn = true;
    },
    logout(state) {
      localStorage.removeItem("adminId");
      localStorage.removeItem("token");
      state.isLoggedIn = false;
    },
  },
});

const themeSlice = createSlice({
  name: "theme",
  initialState: {
    settings: defaultThemeSettings,
    isLoaded: false,
  },
  reducers: {
    setTheme(state, action) {
      state.settings = {
        ...state.settings,
        ...(action.payload || {}),
      };
      state.isLoaded = true;
    },
  },
});

export const userActions = userSclice.actions;
export const adminActions = adminSlice.actions;
export const themeActions = themeSlice.actions;
export const DEFAULT_THEME_SETTINGS = defaultThemeSettings;

export const store = configureStore({
  reducer: {
    user: userSclice.reducer,
    admin: adminSlice.reducer,
    theme: themeSlice.reducer,
  },
});

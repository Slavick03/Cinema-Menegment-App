import { useEffect } from "react";
import Header from "./components/Header";
import HomePage from "./components/HomePage";
import Movies from "./components/Movies/Movies";
import Admin from "./components/Auth/Admin";
import { Navigate, Route, Routes } from "react-router-dom";
import Auth from "./components/Auth/Auth";
import { useDispatch, useSelector } from "react-redux";
import { adminActions, themeActions, userActions } from "./store";
import Booking from "./components/Bookings/Booking";
import UserProfile from "./Profile/UserProfile";
import AddMovie from "./components/Movies/AddMovie";
import AdminProfile from "./Profile/AdminProfile";
import AdminAnalytics from "./Profile/AdminAnalytics";
import BrandSettings from "./Profile/BrandSettings";
import { getThemeSettings } from "./api-helpers/api-helpers";
import { applyThemeToDocument } from "./utils/theme-utils";
import "./App.css";


function App() {
  const dispatch = useDispatch();
  const isAdminLoggedIn = useSelector((state) => state.admin.isLoggedIn);
  const isUserLoggedIn = useSelector((state) => state.user.isLoggedIn);
  const themeSettings = useSelector((state) => state.theme.settings);

  useEffect(() => {
    if (localStorage.getItem("userId") && localStorage.getItem("token")) {
      dispatch(userActions.login());
    } else if (localStorage.getItem("adminId") && localStorage.getItem("token")) {
      dispatch(adminActions.login());
    }
  }, [dispatch]);

  useEffect(() => {
    getThemeSettings()
      .then((res) => {
        if (res?.settings) {
          dispatch(themeActions.setTheme(res.settings));
        }
      })
      .catch((err) => console.log(err.message));
  }, [dispatch]);

  useEffect(() => {
    applyThemeToDocument(themeSettings);
  }, [themeSettings]);

  return (
    <div className="app-shell">
      <Header />
      <section className="app-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/movies" element={<Movies />} />
          {!isUserLoggedIn && !isAdminLoggedIn && (
            <>
              <Route path="/admin" element={<Admin />} />
              <Route path="/auth" element={<Auth />} />
            </>
          )}
          {isUserLoggedIn && !isAdminLoggedIn && (
            <>
              <Route path="/booking/:id" element={<Booking />} />
              <Route path="/user" element={<UserProfile />} />
            </>
          )}
          {!isUserLoggedIn && isAdminLoggedIn && (
            <>
              <Route path="/add" element={<AddMovie />} />
              <Route path="/edit/:id" element={<AddMovie />} />
              <Route path="/user-admin" element={<AdminProfile />} />
              <Route path="/admin-analytics" element={<AdminAnalytics />} />
              <Route path="/brand-settings" element={<BrandSettings />} />
            </>
          )}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </section>
    </div>
  );
}

export default App;

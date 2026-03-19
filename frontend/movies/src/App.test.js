import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import App from "./App";
import { store } from "./store";

jest.mock("./components/Header", () => () => <div>Header</div>);
jest.mock("./components/HomePage", () => () => <div>Home Page</div>);
jest.mock("./components/Movies/Movies", () => () => <div>Movies Page</div>);
jest.mock("./components/Auth/Admin", () => () => <div>Admin Page</div>);
jest.mock("./components/Auth/Auth", () => () => <div>Auth Page</div>);
jest.mock("./components/Bookings/Booking", () => () => <div>Booking Page</div>);
jest.mock("./Profile/UserProfile", () => () => <div>User Profile</div>);
jest.mock("./components/Movies/AddMovie", () => () => <div>Add Movie</div>);
jest.mock("./Profile/AdminProfile", () => () => <div>Admin Profile</div>);

test("renders movies navigation", async () => {
  render(
    <MemoryRouter>
      <Provider store={store}>
        <App />
      </Provider>
    </MemoryRouter>
  );

  expect(await screen.findByText(/header/i)).toBeInTheDocument();
  expect(await screen.findByText(/home page/i)).toBeInTheDocument();
});

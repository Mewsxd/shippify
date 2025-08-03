import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./App.css";
import Layout from "./Layout";
import OrdersPage from "./pages/OrdersPage";
import AddCompany from "./pages/AddCompany";
import AddDriver from "./pages/AddDriver";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AddDelivery from "./pages/AddDelivery";
import AuthPage from "./AuthPage";
import Order from "./pages/Order";
import ProtectedRoute from "./util/ProtectedRoute";
import NotFoundPage from "./pages/NotFoundPage"; // Import NotFoundPage
import AllCompanies from "./pages/AllCompanies";
import AllDrivers from "./pages/AllDrivers";
import Company from "./pages/Company";
import Driver from "./pages/Driver";
import Settings from "./pages/Settings";

function App() {
  const queryClient = new QueryClient();

  const router = createBrowserRouter([
    {
      path: "/",
      element: (
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <OrdersPage /> },
        { path: "/order/:orderId", element: <Order /> },
        { path: "add-facilities", element: <AddCompany /> },
        { path: "facilities", element: <AllCompanies /> },
        { path: "facilities/:companyId", element: <Company /> },
        { path: "add-driver", element: <AddDriver /> },
        { path: "drivers", element: <AllDrivers /> },
        { path: "drivers/:driverId", element: <Driver /> },
        { path: "settings", element: <Settings /> },
        { path: "add-delivery", element: <AddDelivery /> },
      ],
    },
    { path: "/auth", element: <AuthPage /> },
    { path: "*", element: <NotFoundPage /> }, // Catch-all route
  ]);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export default App;

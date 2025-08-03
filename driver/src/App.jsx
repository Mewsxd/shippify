import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./App.css";
import Layout from "./Layout";
import OrdersPage from "./pages/OrdersPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AuthPage from "./AuthPage";
// import Order from "./pages/Order";
import ProtectedRoute from "./util/ProtectedRoute";
import NotFoundPage from "./pages/NotFoundPage";
import MyDeliveries from "./pages/MyDeliveries";
import UpdateOrderStatusPage from "./pages/UpdateOrderStatusPage";
import { MainContextProvider } from "./store/MainContext";

function App() {
  const queryClient = new QueryClient();

  const router = createBrowserRouter([
    {
      // Root path wrapped in ProtectedRoute to guard all child routes

      path: "/",
      element: (
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      ),
      children: [
        {
          // Default route (Orders listing)
          index: true,
          element: <OrdersPage />,
        },
        {
          // Order details by orderId
          path: "/order/:orderId",
          // element: <Order />,
          element: <UpdateOrderStatusPage />,
        },
        {
          // My Deliveries page
          path: "/my-deliveries",
          element: <MyDeliveries />,
        },
        {
          // Update delivery status page
          path: "/my-deliveries/:orderId",
          element: <UpdateOrderStatusPage />,
        },
      ],
    },
    {
      // Public auth route (login/signup)
      path: "/auth",
      element: <AuthPage />,
    },
    {
      // Fallback route for unknown paths
      path: "*",
      element: <NotFoundPage />,
    },
  ]);
  return (
    <MainContextProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </MainContextProvider>
  );
}

export default App;

import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./App.css";
import Layout from "./Layout";
import OrdersPage from "./pages/OrdersPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AuthPage from "./AuthPage";
import Order from "./pages/Order";
import ProtectedRoute from "./util/ProtectedRoute";
import NotFoundPage from "./pages/NotFoundPage"; // Import NotFoundPage
import MyDeliveries from "./pages/MyDeliveries";
import UpdateOrderStatusPage from "./pages/UpdateOrderStatusPage";
import { MainContextProvider } from "./store/MainContext";

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
        {
          index: true,
          element: <OrdersPage />,
        },
        {
          path: "/order/:orderId",
          element: <Order />,
        },
        {
          path: "/my-deliveries",
          element: <MyDeliveries />,
          // children: [{ path: ":orderId", element: <Order /> }],
        },
        { path: "/my-deliveries/:orderId", element: <UpdateOrderStatusPage /> },
        // {
        //   path: "add-delivery",
        //   element: <AddDelivery />,
        // },
      ],
    },
    { path: "/auth", element: <AuthPage /> },
    { path: "*", element: <NotFoundPage /> }, // Catch-all route
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

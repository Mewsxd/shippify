import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { checkAuth } from "../http/http";
import MainContext from "../store/MainContext";

const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();

  const {
    data: user,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["user"],
    queryFn: checkAuth,
    retry: false,
  });
  const { setUserData } = useContext(MainContext);

  useEffect(() => {
    // When the auth check is done
    if (!isFetching) {
      // If user is not authenticated, redirect to login page
      if (!user) {
        navigate("/auth");
      } else {
        // If user is authenticated, set user data in context
        setUserData(user);
      }
    }
  }, [isFetching, navigate, setUserData, user]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="p-6 font-semibold text-lg font-outfit">Loading...</div>
    );
  }

  // If authenticated, render the protected children components
  return children;
};

export default ProtectedRoute;

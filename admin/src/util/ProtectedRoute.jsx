import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { checkAuth } from "../http/http";

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

  useEffect(() => {
    if (!isFetching) {
      if (!user) {
        navigate("/auth");
      }
    }
  }, [isFetching, navigate, user]);

  if (isLoading) {
    return (
      <div className=" p-6 font-semibold text-lg font-outfit">Loading...</div>
    );
  }

  return children;
};

export default ProtectedRoute;

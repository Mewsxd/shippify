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
  // console.log("Loading?", isLoading);
  // console.log("Fetching?", isFetching);

  useEffect(() => {
    if (!isFetching) {
      if (!user) {
        // console.log("No user");
        navigate("/auth");
      } else {
        setUserData(user);
        // console.log("User", user);
      }
    }
  }, [isFetching, navigate, setUserData, user]);

  if (isLoading) {
    return (
      <div className=" p-6 font-semibold text-lg font-outfit">Loading...</div>
    );
  }

  return children;
};

export default ProtectedRoute;

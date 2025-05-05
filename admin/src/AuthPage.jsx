import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import amg2 from "./assets/amg7.svg";
import { FaSpinner } from "react-icons/fa";
import { login } from "./http/http";
import shippify_logo from "./assets/shippify-logo.png";

const AuthPage = () => {
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const mutation = useMutation({
    mutationFn: async () =>
      login({
        email: emailRef.current?.value || "",
        password: passwordRef.current?.value || "",
      }),
    onSuccess: () => {
      // Add 1-second delay before setting loading to false and navigating
      const timeout = setTimeout(() => {
        setLoading(false);
        navigate("/");
      }, 500);

      // Cleanup in case of component unmount
      return () => clearTimeout(timeout);
    },
    onError: (error) => {
      console.error("Login failed:", error);
      // alert(error.message);
      setLoading(false);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!emailRef.current?.value || !passwordRef.current?.value) return;
    setLoading(true);
    mutation.mutate();
  };

  return (
    <div className="w-full flex justify-center font-outfit items-center h-screen bg-black overflow-hidden">
      <div className="left flex items-center flex-1 justify-center w-full h-full relative">
        <img
          src={amg2}
          className="max-w-7xl h-screen object-cover opacity-50 block lg:hidden"
          alt="Dashboard Mockup"
        />
        <div className="absolute z-50 top-10 left-5 block lg:hidden">
          {/* <h1 className="text-4xl font-bold text-white drop-shadow-[0_4px_10px_rgba(255,255,255,0.6)]">
            Shippify - Admin
          </h1> */}
          <img
            src={shippify_logo}
            className="max-w-[200px] drop-shadow-[0_4px_10px_rgba(255,255,255,0.8)]"
            alt="logo"
          />
        </div>

        <form
          onSubmit={handleSubmit}
          className="form w-[290px] absolute z-50 sm:w-[320px] flex flex-col bg-white gap-2 p-4 rounded-xl shadow-sm"
        >
          <label className="input font-inter text-2xl text-third font-semibold px-1 py-2.5 outline-none rounded mx-auto">
            Sign In
          </label>

          <input
            type="email"
            placeholder="Email"
            ref={emailRef}
            className="input font-inter px-3 py-[10px] text-[#3F292B] outline-none border rounded-xl w-full"
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password"
            ref={passwordRef}
            className="input font-inter px-3 py-[10px] text-[#3F292B] outline-none border rounded-xl w-full"
            disabled={loading}
          />

          <button
            type="submit"
            className={`font-inter w-full px-3 py-[10px] outline-none border rounded-xl bg-third text-white flex items-center justify-center cursor-pointer gap-2 ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={loading}
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" />
                <span>Please wait...</span>
              </>
            ) : (
              "Log In"
            )}
          </button>

          {mutation.isError && (
            <p className="text-red-500 text-center mt-2">
              {mutation.error.message || "Something went wrong"}
            </p>
          )}
        </form>
      </div>

      <div className="right flex-[1.5] overflow-hidden relative hidden lg:block">
        <div className="absolute z-20 top-10 left-5">
          {/* <h1 className="text-4xl font-bold text-white drop-shadow-[0_4px_10px_rgba(255,255,255,0.6)]">
            Shippify - Admin
          </h1> */}
        </div>
        <img
          src={amg2}
          className="max-w-7xl h-screen object-cover brightness-60"
          alt="Dashboard Mockup"
        />

        <div className="absolute z-20 top-10 left-5">
          <img
            src={shippify_logo}
            className="max-w-[300px] drop-shadow-[0_4px_10px_rgba(255,255,255,0.7)]"
            alt="logo"
          />
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

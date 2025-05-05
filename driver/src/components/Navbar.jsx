import { useMutation } from "@tanstack/react-query";
import { LogOut, User, User2 } from "lucide-react";
import React, { useEffect, useRef } from "react";
import {
  BsLayoutSidebarInset,
  BsLayoutSidebarInsetReverse,
} from "react-icons/bs";
import { logout } from "../http/http";
import { useNavigate } from "react-router-dom";
import logo from "../assets/shippify-logo.png";
const Navbar = ({
  isSidebarOpen,
  setSidebarOpen,
  setProfileMenuOpen,
  isProfileMenuOpen,
}) => {
  const dropdownRef = useRef(null);
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setProfileMenuOpen]);
  //
  const toggleProfileMenu = () => setProfileMenuOpen(!isProfileMenuOpen);
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
  const navigate = useNavigate();

  const { mutate } = useMutation({
    mutationFn: logout,
  });
  const logoutHandler = () => {
    mutate();
    navigate("/auth");
  };

  return (
    <>
      <nav className="relative w-full bg-white font-outfit shadow-sm flex justify-between items-center p-2 sm:p-4">
        <div className="">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-hover text-third rounded-lg"
          >
            {isSidebarOpen ? (
              <BsLayoutSidebarInset size={24} />
            ) : (
              <BsLayoutSidebarInsetReverse size={24} />
            )}
          </button>
        </div>
        <img src={logo} className="w-24 md:hidden block" alt="logo" />

        <div className="relative">
          <button
            onClick={toggleProfileMenu}
            className="p-2 rounded-full text-whitetext bg-third text-primary"
          >
            <User size={24} />
          </button>
          {isProfileMenuOpen && (
            <div className="absolute cursor-pointer z-50 right-0 mt-2 p-2 w-48 border border-gray-200 rounded-lg shadow-lg text-whitetext bg-secondary">
              <div className=" relative">
                {/* <button className="w-full text-left px-4 py-2 flex items-center text- rounded-lg hover:bg-gray-300">
                  <User2 size={16} className="mr-2 " /> Profile
                </button> */}
              </div>
              <button
                onClick={logoutHandler}
                className="w-full text-left px-4 py-2 cursor-pointer flex items-center text-whitetext rounded-lg"
              >
                <LogOut size={16} className="mr-2" /> Logout
              </button>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;

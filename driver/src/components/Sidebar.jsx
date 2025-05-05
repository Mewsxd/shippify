import { Bike, Building2, House, Package } from "lucide-react";
import React from "react";
import {
  BsLayoutSidebarInset,
  BsLayoutSidebarInsetReverse,
} from "react-icons/bs";
import { Link, useLocation } from "react-router-dom";
import logo from "../assets/shippify-logo.png";

const Sidebar = ({ isSidebarOpen, setSidebarOpen }) => {
  const location = useLocation();

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
  const closeSidebarOnMobile = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };
  return (
    <>
      <aside
        className={`fixed font-outfit md:relative transition-all duration-300 h-dvh bg-gray-100 shadow-md z-40 ${
          isSidebarOpen ? "min-w-80" : "w-0"
        } overflow-hidden `}
      >
        <div className="h-[56.2px] sm:h-[72px] p-2 sm:p-4 flex gap-4 justify-start items-center">
          <button
            onClick={toggleSidebar}
            className="p-2  text-third rounded-lg md:hidden"
          >
            {isSidebarOpen ? (
              <BsLayoutSidebarInset size={24} />
            ) : (
              <BsLayoutSidebarInsetReverse size={24} />
            )}
          </button>
          <img className="h-18  md:block hidden" src={logo} />
        </div>
        <ul className="my-1 px-4">
          <Link
            onClick={closeSidebarOnMobile}
            to={"/"}
            // className=" block w-full text-md font-medium text-gray-700 hover:bg-gray-300 p-3 rounded-lg cursor-pointer transition"
            className={`block w-full text-md mb-1 font-medium p-3 rounded-lg cursor-pointer transition ${
              location.pathname === "/"
                ? "bg-gray-300 text-black"
                : "text-gray-700 hover:bg-gray-300"
            }`}
          >
            <span className="flex gap-2 items-center">
              <House className="text-text1 h-6 w-6" />
              Dashboard
            </span>
          </Link>
          <Link
            to={"my-deliveries"}
            onClick={closeSidebarOnMobile}
            // className=" block w-full text-md font-medium text-gray-700 hover:bg-gray-300 p-3 rounded-lg cursor-pointer transition"
            className={`block w-full text-md font-medium p-3 rounded-lg cursor-pointer transition ${
              location.pathname === "/my-deliveries"
                ? "bg-gray-300 text-black"
                : "text-gray-700 hover:bg-gray-300"
            }`}
          >
            <span className="flex gap-2 items-center">
              <Package className="text-text1 h-6 w-6" />
              My Deliveries
            </span>
          </Link>
        </ul>
      </aside>
    </>
  );
};

export default Sidebar;

import { Bike, Building2, House, Package } from "lucide-react";
import React from "react";
import shippify_logo from "../assets/shippify-logo.png";
import {
  BsLayoutSidebarInset,
  BsLayoutSidebarInsetReverse,
} from "react-icons/bs";
import { LuPlus } from "react-icons/lu";
import { Link, useLocation } from "react-router-dom";

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
        className={`fixed font-outfit md:relative transition-all duration-300 h-full bg-gray-100 shadow-md z-40 ${
          isSidebarOpen ? "min-w-80" : "w-0"
        } overflow-hidden `}
      >
        <div className="h-[72px] p-4 flex gap-4 justify-start items-center">
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
          {/* <h2 className="text-2xl font-bold text-third md:block hidden"> */}
          <img className=" h-14  md:block hidden" src={shippify_logo} />
          {/* </h2> */}
        </div>
        <ul className="my-1 px-4">
          <Link
            onClick={closeSidebarOnMobile}
            to={"/"}
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
            to={"facilities"}
            onClick={closeSidebarOnMobile}
            className={`block w-full text-md mb-1 font-medium p-3 rounded-lg cursor-pointer transition ${
              location.pathname === "/facilities"
                ? "bg-gray-300 text-black"
                : "text-gray-700 hover:bg-gray-300"
            }`}
          >
            <span className="flex gap-2 items-center">
              <Building2 className="text-text1 h-6 w-6" />
              Our Facilities
            </span>
          </Link>
          <Link
            to={"add-facilities"}
            onClick={closeSidebarOnMobile}
            className={`block w-full text-md mb-1 font-medium p-3 rounded-lg cursor-pointer transition ${
              location.pathname === "/add-facilities"
                ? "bg-gray-300 text-black"
                : "text-gray-700 hover:bg-gray-300"
            }`}
          >
            <span className="flex gap-2 items-center">
              <LuPlus ing2 className="text-text1 h-6 w-6" />
              Add Facilities
            </span>
          </Link>

          <Link
            to={"drivers"}
            onClick={closeSidebarOnMobile}
            className={`block w-full text-md mb-1 font-medium p-3 rounded-lg cursor-pointer transition ${
              location.pathname === "/drivers"
                ? "bg-gray-300 text-black"
                : "text-gray-700 hover:bg-gray-300"
            }`}
          >
            <span className="flex gap-2 items-center">
              <Bike className="text-text1 h-6 w-6" />
              Our Drivers
            </span>
          </Link>
          <Link
            to={"add-driver"}
            onClick={closeSidebarOnMobile}
            className={`block w-full text-md mb-1 font-medium p-3 rounded-lg cursor-pointer transition ${
              location.pathname === "/add-driver"
                ? "bg-gray-300 text-black"
                : "text-gray-700 hover:bg-gray-300"
            }`}
          >
            <span className="flex gap-2 items-center">
              <LuPlus className="text-text1 h-6 w-6" />
              Add Driver
            </span>
          </Link>
          <Link
            to={"add-delivery"}
            onClick={closeSidebarOnMobile}
            className={`block w-full text-md mb-1 font-medium p-3 rounded-lg cursor-pointer transition ${
              location.pathname === "/add-delivery"
                ? "bg-gray-300 text-black"
                : "text-gray-700 hover:bg-gray-300"
            }`}
          >
            <span className="flex gap-2 items-center">
              <Package className="text-text1 h-6 w-6" />
              Add Delivery
            </span>
          </Link>
        </ul>
      </aside>
    </>
  );
};

export default Sidebar;

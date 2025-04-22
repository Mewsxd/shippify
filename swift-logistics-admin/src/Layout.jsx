import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";

const Layout = () => {
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(() => {
    if (window.innerWidth < 768) {
      return false;
    } else {
      return true;
    }
  });
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
  return (
    <div className="flex h-dvh ">
      <Sidebar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 md:hidden"
          onClick={toggleSidebar}
        />
      )}
      <div className="flex-1 flex flex-col">
        <Navbar
          isSidebarOpen={isSidebarOpen}
          setSidebarOpen={setSidebarOpen}
          setProfileMenuOpen={setProfileMenuOpen}
          isProfileMenuOpen={isProfileMenuOpen}
        />
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;

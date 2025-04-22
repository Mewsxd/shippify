import React from "react";

const ToggleButton = ({ isActive, setIsActive }) => {
  const handleCheckboxChange = () => {
    setIsActive(!isActive);
  };

  return (
    <>
      <label className="flex cursor-pointer select-none items-center w-fit">
        <div className="relative">
          <input
            type="checkbox"
            checked={isActive}
            onChange={handleCheckboxChange}
            className="sr-only"
          />
          <div
            className={`block h-8 w-14 rounded-full transition ${
              isActive ? "bg-third" : "bg-gray-300"
            }`}
          ></div>
          <div
            className={`dot absolute top-1 h-6 w-6 rounded-full bg-white transition transform ${
              isActive ? "translate-x-7" : "translate-x-1"
            }`}
          ></div>
        </div>
        <span className="ml-2 text-gray-700">
          {isActive ? "Active" : "Inactive"}
        </span>
      </label>
    </>
  );
};

export default ToggleButton;

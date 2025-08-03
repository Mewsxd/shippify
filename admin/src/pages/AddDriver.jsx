/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { createDriver } from "../http/http";
import { FiEye, FiEyeOff } from "react-icons/fi";

const schema = yup.object().shape({
  name: yup.string().required("Driver Name is required"),
  phone: yup
    .number()
    // .matches(/^(?:\d{10}|\d{5}-\d{6})$/, "Invalid Phone Number")
    .required("Phone is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

const AddDriver = () => {
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
      setImageFile(file);
    }
  };

  const onSubmit = async (data) => {
    const formData = { ...data, role: "driver" };
    await mutateAsync(formData);
    reset();
    setImage(null);
    setImageFile(null);
  };

  const { mutateAsync, isPending } = useMutation({
    mutationFn: createDriver,
    mutationKey: ["driver-creation"],
    onSuccess: () => {
      alert("Driver added succesfully");
    },
    onError: (error) => {
      alert(
        error.message ||
          "An error occured while adding the driver, please try again!"
      );
    },
  });
  return (
    <>
      <div className="text-2xl font-bold px-6 pt-6 text-third font-outfit">
        Add Driver
      </div>
      <div className="border h-full border-gray-200 overflow-y-scroll custom-scrollbar rounded-lg shadow-md bg-white m-2 sm:m-4 font-outfit">
        <div className="max-w-2xl sm:m-8 m-3">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            autoComplete="off"
          >
            <div>
              <div className="mb-6">
                <input
                  type="file"
                  id="imageUpload"
                  className="hidden"
                  onChange={handleImageChange}
                  accept="image/*"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 text-text1 ">Driver Name</label>
              <input
                {...register("name")}
                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
              />
              <p className="text-red-500 text-sm">{errors.name?.message}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-text1">Phone Number</label>
                <input
                  type="number"
                  {...register("phone")}
                  className="no-arrows w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
                />
                <p className="text-red-500 text-sm">{errors.phone?.message}</p>
              </div>
              <div>
                <label className="block mb-1 text-text1">Email</label>
                <input
                  autoComplete="off"
                  {...register("email")}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
                />
                <p className="text-red-500 text-sm">{errors.email?.message}</p>
              </div>
            </div>
            <div className="relative">
              <label className="block mb-1 text-text1">Password</label>
              <input
                autoComplete="new-password"
                type={showPassword ? "text" : "password"}
                {...register("password")}
                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0 pr-10"
                placeholder="******"
              />
              {/* Eye Icon */}
              <div
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-12 -translate-y-1/2 cursor-pointer text-gray-500"
              >
                {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </div>
              {/* Error Message */}
              <p className="text-red-500 text-sm">{errors.password?.message}</p>
            </div>
            <div className="flex justify-between items-center mt-6">
              <button
                type="button"
                className="border text-text1 px-4 py-2 rounded-lg hover:bg-gray-200 cursor-pointer"
                onClick={() => reset()}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="bg-third text-white px-6 py-2 rounded-lg cursor-pointer"
              >
                {isPending ? "Confirming..." : "Confirm"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddDriver;

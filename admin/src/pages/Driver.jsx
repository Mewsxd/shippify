import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { deleteDriver, getDriverById, updateDriver } from "../http/http";
import { useNavigate, useParams } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";

const schema = yup.object().shape({
  name: yup.string().required("Company name is required"),
  phone: yup.string().required("Phone number is required"),
  email: yup
    .string()
    .email("Invalid email format")
    .required("Email is required"),
  password: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  notes: yup.string(),
});
const Driver = () => {
  const { driverId } = useParams();
  const [isEditable, setIsEditable] = useState(false);
  const [originalData, setOriginalData] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const { data, isLoading, isError } = useQuery({
    queryFn: () => getDriverById(driverId),
    queryKey: [`driver-${driverId}`],
    enabled: !!driverId,
  });

  // Prefill form data once data is available
  useEffect(() => {
    if (data) {
      reset(data); // Prefill form fields
      setOriginalData(data); // Store original data for cancel functionality
    }
  }, [data, reset]);

  const { mutate, isPending } = useMutation({
    mutationFn: updateDriver,
    mutationKey: ["update-driver"],
    onSuccess: () => {
      alert("Driver updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["all-drivers"] });
      setIsEditable(false); // Disable editing after successful submission
    },
    onError: () => {
      alert("Error occurred while updating your driver, please try again!");
    },
  });

  const { mutate: deleteDriverMutate, isPending: deleteDriverPending } =
    useMutation({
      mutationFn: deleteDriver,
      mutationKey: ["update-delivery"],
      onSuccess: () => {
        alert("Driver deleted successfully!");
        queryClient.invalidateQueries({ queryKey: ["all-deliveries"] });
        navigate("/");
      },
      onError: () => {
        alert("Error occurred while deleting your driver, please try again!");
      },
    });

  const onSubmit = async (formData) => {
    // console.log("Driver Data:", formData);
    // delete formData.id;

    mutate({ data: formData, id: driverId });
  };

  const handleEdit = () => {
    setIsEditable(true);
  };

  const handleCancel = () => {
    reset(originalData); // Reset form to original data
    setIsEditable(false); // Exit edit mode
  };

  if (isLoading)
    return (
      <div className=" flex justify-center mt-4 font-outfit">Loading...</div>
    );
  if (isError)
    return (
      <div className=" flex justify-center mt-4 font-outfit">
        <p>Could not fetch the detail for delivery, please try again!</p>
      </div>
    );

  const inputStyle = isEditable
    ? "w-full p-2 border border-gray-200 rounded-lg bg-white focus:ring-purple-500 focus:ring-2 outline-0"
    : "w-full p-2 border border-gray-50 rounded-lg bg-gray-50";

  const confirmDelete = () => {
    deleteDriverMutate(driverId);
  };

  return (
    <>
      <div className="text-2xl font-bold px-6 pt-6 text-third relative font-outfit">
        Driver Details
      </div>
      <div className="border h-full font-outfit overflow-y-scroll border-gray-200 rounded-lg shadow-md bg-white sm:m-4 m-2">
        <div className="max-w-2xl sm:p-6 p-3">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-4 space-y-3 w-full"
          >
            <div>
              <label className="block mb-1 text-text1">Driver Name</label>
              <input
                {...register("name")}
                className={inputStyle}
                disabled={!isEditable}
              />
              <p className="text-red-500">{errors.name?.message}</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-text1">Phone Number</label>
                <input
                  {...register("phone")}
                  className={inputStyle}
                  disabled={!isEditable}
                />
                <p className="text-red-500">{errors.phone?.message}</p>
              </div>
              <div>
                <label className="block mb-1 text-text1">Email</label>
                <input
                  {...register("email")}
                  className={inputStyle}
                  disabled={!isEditable}
                />
                <p className="text-red-500">{errors.email?.message}</p>
              </div>
            </div>
            <div className="relative">
              <label className="block mb-1 text-text1">Password</label>
              <input
                autoComplete="new-password"
                type={showPassword ? "text" : "password"}
                {...register("password")}
                className={inputStyle}
                disabled={!isEditable}
                placeholder="******"
              />
              {/* Eye Icon */}
              <div
                onClick={() => isEditable && setShowPassword((prev) => !prev)}
                className={`absolute right-3 top-12  -translate-y-1/2 cursor-pointer ${
                  isEditable
                    ? "text-gray-500"
                    : "text-gray-300 cursor-not-allowed"
                }`}
              >
                {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </div>
              {/* Error Message */}
              <p className="text-red-500 text-sm">{errors.password?.message}</p>
            </div>

            <div className="w-full flex justify-between items-center mt-8">
              {!isEditable ? (
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="py-2 px-6 bg-third text-white rounded-lg cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteModal(true);
                    }}
                    className="py-2 px-6 bg-red-600 text-white rounded-lg cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              ) : (
                <div className="flex justify-between w-full gap-4">
                  <div className="flex gap-4">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={handleCancel}
                      className="w-fit border text-text1 px-4 py-2 rounded-lg hover:bg-gray-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-fit py-2 px-6 bg-third text-white rounded-lg"
                  >
                    {isPending ? "Updating..." : "Update"}
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
      {showDeleteModal && (
        <div className="fixed z-50 font-outfit inset-0 flex items-center justify-center bg-black/40 ">
          <div className="bg-white sm:max-w-[350px] max-w-[300px] p-4 m-2 rounded-lg shadow-lg">
            <p className="text-lg font-semibold">
              Are you sure you want to delete?
            </p>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteDriverPending}
                className="px-4 py-2 mr-2 bg-gray-300 rounded-md cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteDriverPending}
                className="px-4 py-2 bg-red-600 text-white rounded-md cursor-pointer"
              >
                {deleteDriverPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Driver;

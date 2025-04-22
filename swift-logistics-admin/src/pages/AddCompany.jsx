import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation } from "@tanstack/react-query";
import { createCompany } from "../http/http";

const schema = yup.object().shape({
  name: yup.string().required("Company Name is required"),
  address: yup.string().required("Address is required"),
  contactPersonName: yup.string().required("Contact person name is required"),
  state: yup.string().required("State is required"),
  zipCode: yup
    .string()
    // .matches(/^\d{5}$/, "Invalid PIN Code (5 digits required)")
    .required("PIN Code is required"),
  contactPersonPhone: yup
    .string()
    // .matches(
    //   // /^\d{10}$|^\d{5}-\d{6}$/,
    //   "Invalid Phone Number"
    // )
    .required("Phone is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
});

const AddCompany = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  const { mutateAsync, isError, error } = useMutation({
    mutationFn: createCompany,
    mutationKey: ["company-creation"],
    onSuccess: () => {
      alert("Successfully added facility!");
    },
    onError: () => {
      alert("An error occured while adding facility, please try again!");
    },
  });

  // const onSubmit = async (data) => {
  //   data.address = `${data.address}, ${data.city}, ${data.state}, ${data.country}, ${data.zipCode}`;
  const onSubmit = async (data) => {
    data.address = `${data.address}, ${data.state}, ${data.zipCode}`;
    delete data.city;
    delete data.zipCode;

    try {
      await mutateAsync(data);
      // alert("Company Added Successfully");
      reset();
    } catch (err) {
      console.error("Error creating company:", err);
      // alert(`An error occurred: ${err.message || "Unknown error"}`);
    }
  };
  return (
    <>
      <div className=" text-2xl font-bold px-6 pt-6 text-third font-outfit">
        Add Facilities
      </div>
      <div className="border h-full border-gray-200 overflow-y-scroll custom-scrollbar rounded-lg shadow-md bg-white sm:m-4 m-2 font-outfit">
        <div className="max-w-2xl sm:m-8 m-3">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block mb-1 text-text1">Facility Name</label>
              <input
                {...register("name")}
                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 outline-0 focus:ring-purple-500"
              />
              <p className="text-red-500 text-sm">{errors.name?.message}</p>
            </div>

            <div>
              <label className=" mb-1 block text-text1">Facility Address</label>
              <input
                {...register("address")}
                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 outline-0 focus:ring-purple-500"
              />
              <p className="text-red-500 text-sm">{errors.address?.message}</p>
            </div>

            <div>
              <label className=" mb-1 block text-text1">
                Contact Person Name
              </label>
              <input
                {...register("contactPersonName")}
                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 outline-0 focus:ring-purple-500"
              />
              <p className="text-red-500 text-sm">
                {errors.contactPersonName?.message}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-text1">State</label>
                <input
                  {...register("state")}
                  className="w-full p-2 border border-gray-200 outline-0 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-red-500 text-sm">{errors.state?.message}</p>
              </div>

              <div>
                <label className="block mb-1 text-text1">Zip Code</label>
                <input
                  {...register("zipCode")}
                  className="w-full p-2 border border-gray-200 outline-0 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-red-500 text-sm">
                  {errors.zipCode?.message}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-text1">Phone Number</label>
                <input
                  {...register("contactPersonPhone")}
                  className="w-full p-2 border border-gray-200 outline-0 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder=""
                />
                <p className="text-red-500 text-sm">
                  {errors.contactPersonPhone?.message}
                </p>
              </div>

              <div>
                <label className="block mb-1 text-text1">Email</label>
                <input
                  {...register("email")}
                  className="w-full p-2 border border-gray-200 outline-0 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-red-500 text-sm">{errors.email?.message}</p>
              </div>
            </div>

            <div className="flex justify-between mt-10">
              <button
                type="button"
                className="border text-text1 px-4 py-2 rounded-lg hover:bg-gray-200 transition-all cursor-pointer"
                onClick={() => reset()}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-third hover:shadow-lg transition-all text-white px-6 py-2 rounded-lg cursor-pointer"
              >
                Confirm
              </button>
            </div>

            {isError && (
              <p className="text-red-500 mt-2">
                {error?.message || "An unexpected error occurred"}
              </p>
            )}
          </form>
        </div>
      </div>
    </>
  );
};

export default AddCompany;

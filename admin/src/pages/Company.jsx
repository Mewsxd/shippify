import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { deleteCompany, getCompanyById, updateCompany } from "../http/http";
import { useNavigate, useParams } from "react-router-dom";

const schema = yup.object().shape({
  name: yup.string().required("Company name is required"),
  contactPersonName: yup.string().required("Contact person is required"),
  address: yup.string().required("Company address is required"),
  contactPersonPhone: yup.string().required("Phone number is required"),
  email: yup
    .string()
    .email("Invalid email format")
    .required("Email is required"),
  deliveryTypeDescription: yup.string().when("deliveryType", {
    is: "Others",
    then: (schema) =>
      schema.required("Specify delivery type").min(1, "Specify delivery type"),
    otherwise: (schema) => schema.notRequired(),
  }),
  notes: yup.string(),
});
const Company = () => {
  const { companyId } = useParams();
  const [isEditable, setIsEditable] = useState(false);
  const [originalData, setOriginalData] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const { data, isLoading, isError } = useQuery({
    queryFn: () => getCompanyById(companyId),
    queryKey: [`company-${companyId}`],
    enabled: !!companyId,
  });

  // Prefill form data once data is available
  useEffect(() => {
    if (data) {
      reset(data); // Prefill form fields
      setOriginalData(data); // Store original data for cancel functionality
    }
  }, [data, reset]);

  const { mutate, isPending } = useMutation({
    mutationFn: updateCompany,
    mutationKey: ["update-company"],
    onSuccess: () => {
      alert("Company updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["all-companies"] });
      setIsEditable(false); // Disable editing after successful submission
    },
    onError: () => {
      alert("Error occurred while updating company details, please try again!");
    },
  });

  const { mutate: deleteCompanyMutate, isPending: deleteCompanyPending } =
    useMutation({
      mutationFn: deleteCompany,
      mutationKey: ["delete-company"],
      onSuccess: () => {
        alert("Company deleted successfully!");
        queryClient.invalidateQueries({ queryKey: ["all-companies"] });
        navigate("/");
      },
      onError: () => {
        alert("Error occurred while deleting company, please try again!");
      },
    });
  const onSubmit = async (formData) => {
    // console.log("Company Data:", formData);
    // delete formData.id;

    mutate({ data: formData, id: companyId });
  };

  const handleEdit = () => {
    setIsEditable(true);
  };

  const handleCancel = () => {
    reset(originalData); // Reset form to original data
    setIsEditable(false); // Exit edit mode
  };

  const deliveryType = watch("deliveryType");

  // Clear deliveryTypeDescription when type is not "Others"
  useEffect(() => {
    if (deliveryType !== "Others") {
      setValue("deliveryTypeDescription", "");
    }
  }, [deliveryType, setValue]);

  if (isLoading)
    return (
      <div className=" flex justify-center mt-4 font-outfit">Loading...</div>
    );
  if (isError)
    return (
      <div className=" flex justify-center mt-4 font-outfit">
        <p>Could not fetch the detail for company, please try again!</p>
      </div>
    );

  const inputStyle = isEditable
    ? "w-full p-2 border border-gray-200 rounded-lg bg-white focus:ring-purple-500 focus:ring-2 outline-0"
    : "w-full p-2 border border-gray-50 rounded-lg bg-gray-50";

  const confirmDelete = () => {
    deleteCompanyMutate(companyId);
  };

  return (
    <>
      <div className="text-2xl font-bold px-6 pt-6 text-third relative font-outfit">
        Details
      </div>
      <div className="border h-full font-outfit overflow-y-scroll border-gray-200 rounded-lg shadow-md bg-white sm:m-4 m-2">
        <div className="max-w-2xl p-3 sm:p-6 ">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-4 space-y-3 w-full"
          >
            <div>
              <label className="block mb-1 text-text1">Facility Name</label>
              <input
                {...register("name")}
                className={inputStyle}
                disabled={!isEditable}
              />
              <p className="text-red-500">{errors.name?.message}</p>
            </div>

            <div>
              <label className="block mb-1 text-text1">Contact Person</label>
              <input
                {...register("contactPersonName")}
                className={inputStyle}
                disabled={!isEditable}
              />
              <p className="text-red-500">
                {errors.contactPersonName?.message}
              </p>
            </div>

            <div>
              <label className="block mb-1 text-text1">Facility Address</label>
              <input
                {...register("address")}
                className={inputStyle}
                disabled={!isEditable}
              />
              <p className="text-red-500">{errors.address?.message}</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-text1">Phone Number</label>
                <input
                  {...register("contactPersonPhone")}
                  className={inputStyle}
                  disabled={!isEditable}
                />
                <p className="text-red-500">
                  {errors.contactPersonPhone?.message}
                </p>
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

            {/* <div>
              <label className="block mb-1 text-text1">Delivery Type</label>
              <select
                {...register("deliveryType")}
                className={inputStyle}
                disabled={!isEditable}
              >
                <option value="">Select a type</option>
                <option value="Box">Box</option>
                <option value="Container">Container</option>
                <option value="Others">Others</option>
              </select>
              <p className="text-red-500">{errors.deliveryType?.message}</p>
              {watch("deliveryType") === "Others" && (
                <input
                  {...register("deliveryTypeDescription")}
                  className={inputStyle}
                  placeholder="Specify Delivery Type"
                  disabled={!isEditable}
                />
              )}
            </div> */}

            {/* <div>
              <label className="block mb-1 text-text1">Quantity</label>
              <input
                type="number"
                {...register("quantity")}
                className={inputStyle}
                disabled={!isEditable}
              />
              <p className="text-red-500">{errors.quantity?.message}</p>
            </div> */}

            {/* <div>
              <label className="block mb-1 text-text1">Delivery Status</label>
              <select
                {...register("deliveryStatus")}
                className={inputStyle}
                disabled={!isEditable}
              >
                <option value="">Select status</option>
                <option value="unavailable">Unavailable</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
              <p className="text-red-500">{errors.deliveryStatus?.message}</p>
            </div> */}
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
                disabled={deleteCompanyPending}
                className="px-4 py-2 mr-2 bg-gray-300 rounded-md cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteCompanyPending}
                className="px-4 py-2 bg-red-600 text-white rounded-md cursor-pointer"
              >
                {deleteCompanyPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Company;

import { useMutation, useQuery } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { createDelivery, getDeliveryById } from "../http/http";
import { useParams } from "react-router-dom";

const schema = yup.object().shape({
  name: yup.string().required("Company name is required"),
  contactPersonName: yup.string().required("Contact person is required"),
  address: yup.string().required("Company address is required"),
  contactPersonPhone: yup.string().required("Phone number is required"),
  email: yup
    .string()
    .email("Invalid email format")
    .required("Email is required"),
  deliveryType: yup.string().required("Delivery type is required"),
  deliveryTypeDescription: yup.string().when("deliveryType", {
    is: "Others",
    then: (schema) =>
      schema.required("Specify delivery type").min(1, "Specify delivery type"),
    otherwise: (schema) => schema.notRequired(),
  }),
  quantity: yup
    .number()
    .typeError("Please fill out the field")
    .positive()
    .integer()
    .required("Please fill out the field"),
  deliveryStatus: yup.string().required("Delivery status is required"),
  notes: yup.string(),
});

const Order = () => {
  const { orderId } = useParams();
  const [isEditable, setIsEditable] = useState(false);
  const [originalData, setOriginalData] = useState(null);

  const {
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const { data, isLoading, isError, error } = useQuery({
    queryFn: () => getDeliveryById(orderId),
    queryKey: [`order-${orderId}`],
    enabled: !!orderId,
  });

  useEffect(() => {
    if (data) {
      reset(data);
      setOriginalData(data);
    }
  }, [data, reset]);

  const { mutate } = useMutation({
    mutationFn: createDelivery,
    mutationKey: ["create-delivery"],
    onSuccess: () => {
      alert("Delivery updated successfully!");
      setIsEditable(false);
    },
    onError: () => {
      alert("Error occurred while updating your delivery, please try again!");
    },
  });

  const deliveryType = watch("deliveryType");

  useEffect(() => {
    if (deliveryType !== "Others") {
      setValue("deliveryTypeDescription", "");
    }
  }, [deliveryType, setValue]);

  if (isLoading)
    return (
      <div className=" p-6 font-semibold text-lg text-center font-outfit">
        Loading...
      </div>
    );
  if (isError)
    return (
      <div className=" p-6 font-semibold text-lg text-center font-outfit">
        Error: {error.message}
      </div>
    );

  const inputStyle = isEditable
    ? "w-full p-2 border border-gray-200 rounded-lg bg-white focus:ring-purple-500 focus:ring-2 outline-0"
    : "w-full p-2 border-0 rounded-lg bg-gray-50";
  return (
    <>
      <div className="text-2xl font-bold px-6 pt-6 text-third relative font-outfit">
        Delivery details
      </div>
      <div className="border h-full overflow-y-scroll custom-scrollbar font-outfit border-gray-200 rounded-lg shadow-md bg-white m-2 not-only:sm:m-4">
        <div className="max-w-2xl sm:p-6 p-3">
          <p className="font-semibold text-text1 break-words">
            #{data.orderSerial}
          </p>
          <form className="mt-4 space-y-3 w-full">
            <div>
              <label className="block mb-1 text-text1">Facility Name</label>
              <p className="w-full p-2 border border-none rounded-lg bg-gray-50">
                {data?.name}
              </p>
            </div>

            <div>
              <label className="block mb-1 text-text1">Contact Person</label>
              <p className="w-full p-2 border border-none rounded-lg bg-gray-50">
                {data?.contactPersonName}
              </p>
            </div>

            <div>
              <label className="block mb-1 text-text1">Facility Address</label>
              <p className="w-full p-2 border border-none rounded-lg bg-gray-50">
                {data?.address}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-text1">Phone Number</label>
                <p className="w-full p-2 border border-none rounded-lg bg-gray-50">
                  {data?.contactPersonPhone}
                </p>
              </div>
              <div>
                <label className="block mb-1 text-text1">Email</label>
                <p className="w-full p-2 border border-none rounded-lg bg-gray-50">
                  {data?.email}
                </p>
              </div>
            </div>

            {data?.boxQuantity > 0 && (
              <div className=" grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-text1">Box Quantity</label>
                  <p className="w-full p-2 border border-none rounded-lg bg-gray-50">
                    {data?.boxQuantity}
                  </p>
                </div>
                <div />
              </div>
            )}

            {data?.bagQuantity > 0 && (
              <div className=" grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-text1">Bag Quantity</label>
                  <p className="w-full p-2 border border-none rounded-lg bg-gray-50">
                    {data?.bagQuantity}
                  </p>
                </div>
                <div />
              </div>
            )}
            {data?.toteQuantity > 0 && (
              <div className=" grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-text1">Tote Quantity</label>
                  <p className="w-full p-2 border border-none rounded-lg bg-gray-50">
                    {data?.toteQuantity}
                  </p>
                </div>
                <div />
              </div>
            )}
            {data?.envelopeQuantity > 0 && (
              <div className=" grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-text1">
                    Envelope Quantity
                  </label>
                  <p className="w-full p-2 border border-none rounded-lg bg-gray-50">
                    {data?.envelopeQuantity}
                  </p>
                </div>
                <div />
              </div>
            )}

            {data?.othersDescription !== null && (
              <div className=" grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-text1">
                    Specify Delivery Type
                  </label>
                  <p className="w-full p-2 border border-none rounded-lg bg-gray-50">
                    {data?.othersDescription}
                  </p>
                </div>
                <div />
              </div>
            )}
            {data?.othersQuantity > 0 && (
              <div className=" grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-text1">
                    Others Quantity
                  </label>
                  <p className="w-full p-2 border border-none rounded-lg bg-gray-50">
                    {data?.othersQuantity}
                  </p>
                </div>
                <div />
              </div>
            )}

            <div>
              <label className="block mb-1 text-text1">Delivery Status</label>
              <p className="w-full p-2 border border-none rounded-lg bg-gray-50">
                {data?.deliveryStatus}
              </p>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Order;

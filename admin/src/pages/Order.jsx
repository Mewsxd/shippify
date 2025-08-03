import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  deleteDelivery,
  getDeliveryById,
  SERVER_URL,
  updateDelivery,
} from "../http/http";
import { useNavigate, useParams } from "react-router-dom";

const schema = yup
  .object()
  .shape({
    name: yup.string().required("Company name is required"),
    contactPersonName: yup.string().required("Contact person is required"),
    address: yup.string().required("Company address is required"),
    contactPersonPhone: yup.string().required("Phone number is required"),
    email: yup
      .string()
      .email("Invalid email format")
      .required("Email is required"),
    deliveryType: yup.string(),
    boxQuantity: yup
      .number()
      .transform((value) =>
        isNaN(value) || value === null || value === "" ? undefined : value
      )
      .when("deliveryType", {
        is: "Box",
        then: (schema) =>
          schema
            .required("Please fill out the field")
            .typeError("Please enter a valid number")
            .positive("Value must be positive"),
        otherwise: (schema) => schema.notRequired(),
      }),
    bagQuantity: yup
      .number()
      .transform((value) =>
        isNaN(value) || value === null || value === "" ? undefined : value
      )
      .when("deliveryType", {
        is: "Bag",
        then: (schema) =>
          schema
            .required("Please fill out the field")
            .typeError("Please enter a valid number")
            .positive("Value must be positive"),
        otherwise: (schema) => schema.notRequired(),
      }),
    toteQuantity: yup
      .number()
      .transform((value) =>
        isNaN(value) || value === null || value === "" ? undefined : value
      )
      .when("deliveryType", {
        is: "Tote",
        then: (schema) =>
          schema
            .required("Please fill out the field")
            .typeError("Please enter a valid number")
            .positive("Value must be positive"),
        otherwise: (schema) => schema.notRequired(),
      }),
    envelopeQuantity: yup
      .number()
      .transform((value) =>
        isNaN(value) || value === null || value === "" ? undefined : value
      )
      .when("deliveryType", {
        is: "Envelope",
        then: (schema) =>
          schema
            .required("Please fill out the field")
            .typeError("Please enter a valid number")
            .positive("Value must be positive"),
        otherwise: (schema) => schema.notRequired(),
      }),
    othersQuantity: yup
      .number()
      .transform((value) =>
        isNaN(value) || value === null || value === "" ? undefined : value
      )
      .when("deliveryType", {
        is: "Others",
        then: (schema) =>
          schema
            .required("Please fill out the field")
            .typeError("Please enter a valid number")
            .positive("Value must be positive"),
        otherwise: (schema) => schema.notRequired(),
      }),
    deliveryRecipientName: yup.string().when("deliveryStatus", {
      is: "completed",
      then: (schema) => schema.required("Recipient name is required"),
      otherwise: (schema) => schema.notRequired(),
    }),
    othersDescription: yup.string().when("deliveryType", {
      is: "Others",
      then: (schema) => schema.required("Please fill out the field"),
      otherwise: (schema) => schema.notRequired(),
    }),
    deliveryStatus: yup.string().required("Delivery status is required"),
    unavailabilityReason: yup.string().when("deliveryStatus", {
      is: "unavailable",
      then: (schema) =>
        schema.required("Reason for unavailability is required"),
      otherwise: (schema) => schema.notRequired(),
    }),
  })
  .test(
    "deliveryType-required-if-no-quantity",
    "Delivery type is required if no quantity field has a value above 0",
    function (values) {
      const {
        deliveryType,
        boxQuantity,
        bagQuantity,
        toteQuantity,
        envelopeQuantity,
        othersQuantity,
      } = values || {};
      const quantities = [
        Number(boxQuantity) || 0,
        Number(bagQuantity) || 0,
        Number(toteQuantity) || 0,
        Number(envelopeQuantity) || 0,
        Number(othersQuantity) || 0,
      ];
      if (
        !quantities.some((q) => q > 0) &&
        (!deliveryType || deliveryType === "")
      ) {
        return this.createError({
          path: "deliveryType",
          message:
            "Delivery type is required if no quantity field has a value above 0",
        });
      }
      return true;
    }
  )
  .test(
    "others-pair",
    "Both Others Quantity and Description must be provided if either one is filled",
    function (values) {
      if (values.deliveryType === "Others") {
        const { othersQuantity, othersDescription } = values;
        if (
          (othersQuantity && !othersDescription) ||
          (!othersQuantity && othersDescription)
        ) {
          return this.createError({
            message: "Both Others Quantity and Description must be provided",
          });
        }
      }
      return true;
    }
  )
  .test("conditional-validations", null, function (values) {
    return true;
  })
  .test(
    "others-pair-specific",
    "Both Others Quantity and Description must be provided if either one is filled",
    function (values) {
      if (values.deliveryType === "Others") {
        const { othersQuantity, othersDescription } = values;
        const qtyProvided =
          typeof othersQuantity === "number" && othersQuantity > 0;
        const descProvided =
          othersDescription && othersDescription.trim() !== "";
        if ((descProvided && !qtyProvided) || (qtyProvided && !descProvided)) {
          return this.createError({
            message: "Both Others Quantity and Description must be provided",
            path: !qtyProvided ? "othersQuantity" : "othersDescription",
          });
        }
      }
      return true;
    }
  );

const Order = () => {
  const [isInitiallyPending, setIsInitiallyPending] = useState();
  const { orderId } = useParams();
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
    queryFn: () => getDeliveryById(orderId),
    queryKey: [`order-${orderId}`],
    enabled: !!orderId,
  });

  useEffect(() => {
    if (data) {
      if (
        data.deliveryStatus === "pending" ||
        data.deliveryStatus === "unavailable"
      ) {
        setIsInitiallyPending(true);
      } else {
        setIsInitiallyPending(false);
      }
      reset(data);
      setOriginalData(data);
    }
  }, [data, reset]);

  const { mutate, isPending } = useMutation({
    mutationFn: updateDelivery,
    mutationKey: ["update-delivery"],
    onSuccess: () => {
      alert("Delivery updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["all-deliveries"] });
      queryClient.invalidateQueries({
        queryKey: [`order-${orderId}`],
      });
      setIsEditable(false);
    },
    onError: () => {
      alert("Error occurred while updating your delivery, please try again!");
    },
  });

  const { mutate: deleteDeliveryMutate, isPending: deleteDeliveryPending } =
    useMutation({
      mutationFn: deleteDelivery,
      mutationKey: ["update-delivery"],
      onSuccess: () => {
        alert("Delivery deleted successfully!");
        queryClient.invalidateQueries({ queryKey: ["all-deliveries"] });
        queryClient.removeQueries([{ queryKey: `order-${orderId}` }]);
        navigate("/");
      },
      onError: () => {
        alert("Error occurred while updating your delivery, please try again!");
      },
    });

  const normalizeNumber = (value) => (value ? Number(value) || 0 : 0);

  const onSubmit = async (formData) => {
    formData.bagQuantity = normalizeNumber(formData.bagQuantity);
    formData.boxQuantity = normalizeNumber(formData.boxQuantity);
    formData.envelopeQuantity = normalizeNumber(formData.envelopeQuantity);
    formData.toteQuantity = normalizeNumber(formData.toteQuantity);
    formData.othersQuantity = normalizeNumber(formData.othersQuantity);

    if (formData.othersDescription && formData.othersQuantity === 0) {
      alert("Please provide a valid quantity for the other delivery type.");
      return;
    }

    if (!formData.othersDescription && formData.othersQuantity > 0) {
      alert("Please provide a valid description for the other delivery type.");
      return;
    }

    mutate({ data: formData, id: orderId });
  };

  const handleEdit = () => {
    setIsEditable(true);
  };

  const handleCancel = () => {
    reset(originalData);
    setIsEditable(false);
  };

  const deliveryType = watch("deliveryType");
  const deliveryStatus = watch("deliveryStatus");

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
        <p>Could not fetch the detail for delivery, please try again!</p>
      </div>
    );

  const inputStyle = isEditable
    ? "w-full p-2 border no-arrows border-gray-200 rounded-lg bg-white focus:ring-purple-500 focus:ring-2 outline-0"
    : "w-full p-2 border border-gray-50 rounded-lg bg-gray-50";

  const confirmDelete = () => {
    deleteDeliveryMutate(orderId);
  };
  const selectedDeliveryType = watch("deliveryType");
  const boxQuantityValue = watch("boxQuantity");
  const bagQuantityValue = watch("bagQuantity");
  const toteQuantityValue = watch("toteQuantity");
  const envelopeQuantityValue = watch("envelopeQuantity");
  const othersQuantityValue = watch("othersQuantity");
  return (
    <>
      <div className="text-2xl font-bold px-6 pt-6 text-third relative font-outfit">
        View Delivery
      </div>
      <div className="border h-full font-outfit overflow-y-scroll border-gray-200 rounded-lg shadow-md bg-white sm:m-4 m-2">
        <div className="max-w-2xl p-3 sm:p-6">
          <p className="font-semibold text-text1 break-words">
            #{data.orderSerial}
          </p>
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
              <label className="block mb-1 text-text1">Faciltiy Address</label>
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

            <div className="space-y-3">
              {isEditable && (
                <>
                  <label className="block mb-1 text-text1">Delivery Type</label>
                  <select
                    {...register("deliveryType")}
                    disabled={!isEditable}
                    className={inputStyle}
                  >
                    <option value="">Select a type</option>
                    <option value="Box">Box</option>
                    <option value="Bag">Bag</option>
                    <option value="Tote">Tote</option>
                    <option value="Envelope">Envelope</option>
                    <option value="Others">Others</option>
                  </select>
                </>
              )}
              <p className="text-red-500">{errors.deliveryType?.message}</p>

              {!selectedDeliveryType && (
                <>
                  {boxQuantityValue > 0 && (
                    <div className="grid sm:grid-cols-2 gap-4 items-end">
                      <div className="">
                        <label className="block mb-1 text-text1">
                          Box Quantity
                        </label>
                        <input
                          {...register("boxQuantity")}
                          type="number"
                          min="1"
                          disabled={!isEditable}
                          className={inputStyle}
                          placeholder="Enter number of boxes"
                        />
                      </div>
                      <div></div>
                    </div>
                  )}
                  {bagQuantityValue > 0 && (
                    <div className="grid sm:grid-cols-2 gap-4 items-end">
                      <div className="">
                        <label className="block mb-1 text-text1">
                          Bag Quantity
                        </label>
                        <input
                          {...register("bagQuantity")}
                          type="number"
                          min="1"
                          disabled={!isEditable}
                          className={inputStyle}
                          placeholder="Enter number of Bags"
                        />
                      </div>
                      <div></div>
                    </div>
                  )}
                  {toteQuantityValue > 0 && (
                    <div className="grid sm:grid-cols-2 gap-4 items-end">
                      <div className="">
                        <label className="block mb-1 text-text1">
                          Tote Quantity
                        </label>
                        <input
                          {...register("toteQuantity")}
                          type="number"
                          min="1"
                          disabled={!isEditable}
                          className={inputStyle}
                          placeholder="Enter number of totes"
                        />
                      </div>
                    </div>
                  )}
                  {envelopeQuantityValue > 0 && (
                    <div className="grid sm:grid-cols-2 gap-4 items-end">
                      <div className="">
                        <label className="block mb-1 text-text1">
                          Envelope Quantity
                        </label>
                        <input
                          {...register("envelopeQuantity")}
                          type="number"
                          min="1"
                          disabled={!isEditable}
                          className={inputStyle}
                          placeholder="Enter number of totes"
                        />
                      </div>
                    </div>
                  )}
                  {othersQuantityValue > 0 && (
                    <>
                      <div className="grid sm:grid-cols-2 gap-4 items-end">
                        <div className="">
                          <label className="block mb-1 text-text1">
                            Specify Delivery Type
                          </label>
                          <input
                            type="text"
                            {...register("othersDescription")}
                            disabled={!isEditable}
                            className={inputStyle}
                            placeholder="Specify Delivery Type"
                          />
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4 items-end">
                        <div className="">
                          <label className="block mb-1 text-text1">
                            Quantity
                          </label>
                          <input
                            {...register("othersQuantity")}
                            type="number"
                            min="1"
                            disabled={!isEditable}
                            className={inputStyle}
                            placeholder="Enter Quantity"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {selectedDeliveryType === "Box" && (
                <>
                  <div className="grid sm:grid-cols-2 gap-4 items-end">
                    <div className="">
                      <label className="block mb-1 text-text1">
                        Box Quantity
                      </label>
                      <input
                        {...register("boxQuantity")}
                        type="number"
                        min="1"
                        disabled={!isEditable}
                        className={inputStyle}
                        placeholder="Enter number of boxes"
                      />
                    </div>
                  </div>
                  {bagQuantityValue > 0 && (
                    <div className="grid sm:grid-cols-2 gap-4 items-end">
                      <div className="">
                        <label className="block mb-1 text-text1">
                          Bag Quantity
                        </label>
                        <input
                          {...register("bagQuantity")}
                          type="number"
                          min="1"
                          disabled={!isEditable}
                          className={inputStyle}
                          placeholder="Enter number of Bags"
                        />
                      </div>
                      <div></div>
                    </div>
                  )}
                  {toteQuantityValue > 0 && (
                    <div className="grid sm:grid-cols-2 gap-4 items-end">
                      <div className="">
                        <label className="block mb-1 text-text1">
                          Tote Quantity
                        </label>
                        <input
                          {...register("toteQuantity")}
                          type="number"
                          min="1"
                          disabled={!isEditable}
                          className={inputStyle}
                          placeholder="Enter number of totes"
                        />
                      </div>
                    </div>
                  )}
                  {envelopeQuantityValue > 0 && (
                    <div className="grid sm:grid-cols-2 gap-4 items-end">
                      <div className="">
                        <label className="block mb-1 text-text1">
                          Envelope Quantity
                        </label>
                        <input
                          {...register("envelopeQuantity")}
                          type="number"
                          min="1"
                          disabled={!isEditable}
                          className={inputStyle}
                          placeholder="Enter number of totes"
                        />
                      </div>
                    </div>
                  )}
                  {othersQuantityValue > 0 && (
                    <>
                      <div className="grid sm:grid-cols-2 gap-4 items-end">
                        <div className="">
                          <label className="block mb-1 text-text1">
                            Specify Delivery Type
                          </label>
                          <input
                            type="text"
                            {...register("othersDescription")}
                            disabled={!isEditable}
                            className={inputStyle}
                            placeholder="Specify Delivery Type"
                          />
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4 items-end">
                        <div className="">
                          <label className="block mb-1 text-text1">
                            Quantity
                          </label>
                          <input
                            {...register("othersQuantity")}
                            type="number"
                            min="1"
                            disabled={!isEditable}
                            className={inputStyle}
                            placeholder="Enter Quantity"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {selectedDeliveryType === "Bag" && (
                <>
                  <div className="grid sm:grid-cols-2 gap-4 items-end">
                    <div className="">
                      <label className="block mb-1 text-text1">
                        Bag Quantity
                      </label>
                      <input
                        {...register("bagQuantity")}
                        type="number"
                        min="1"
                        disabled={!isEditable}
                        className={inputStyle}
                        placeholder="Enter number of Bags"
                      />
                    </div>
                    <div></div>
                  </div>
                  {boxQuantityValue > 0 && (
                    <div className="grid sm:grid-cols-2 gap-4 items-end">
                      <div className="">
                        <label className="block mb-1 text-text1">
                          Box Quantity
                        </label>
                        <input
                          {...register("boxQuantity")}
                          type="number"
                          min="1"
                          disabled={!isEditable}
                          className={inputStyle}
                          placeholder="Enter number of boxes"
                        />
                      </div>
                      <div></div>
                    </div>
                  )}
                  {toteQuantityValue > 0 && (
                    <div className="grid sm:grid-cols-2 gap-4 items-end">
                      <div className="">
                        <label className="block mb-1 text-text1">
                          Tote Quantity
                        </label>
                        <input
                          {...register("toteQuantity")}
                          type="number"
                          min="1"
                          disabled={!isEditable}
                          className={inputStyle}
                          placeholder="Enter number of totes"
                        />
                      </div>
                    </div>
                  )}
                  {envelopeQuantityValue > 0 && (
                    <div className="grid sm:grid-cols-2 gap-4 items-end">
                      <div className="">
                        <label className="block mb-1 text-text1">
                          Envelope Quantity
                        </label>
                        <input
                          {...register("envelopeQuantity")}
                          type="number"
                          min="1"
                          disabled={!isEditable}
                          className={inputStyle}
                          placeholder="Enter number of totes"
                        />
                      </div>
                    </div>
                  )}
                  {othersQuantityValue > 0 && (
                    <>
                      <div className="grid sm:grid-cols-2 gap-4 items-end">
                        <div className="">
                          <label className="block mb-1 text-text1">
                            Specify Delivery Type
                          </label>
                          <input
                            type="text"
                            {...register("othersDescription")}
                            disabled={!isEditable}
                            className={inputStyle}
                            placeholder="Specify Delivery Type"
                          />
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4 items-end">
                        <div className="">
                          <label className="block mb-1 text-text1">
                            Quantity
                          </label>
                          <input
                            {...register("othersQuantity")}
                            type="number"
                            min="1"
                            disabled={!isEditable}
                            className={inputStyle}
                            placeholder="Enter Quantity"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {selectedDeliveryType === "Tote" && (
                <>
                  <div className="grid sm:grid-cols-2 gap-4 items-end">
                    <div className="">
                      <label className="block mb-1 text-text1">
                        Tote Quantity
                      </label>
                      <input
                        {...register("toteQuantity")}
                        type="number"
                        min="1"
                        disabled={!isEditable}
                        className={inputStyle}
                        placeholder="Enter number of totes"
                      />
                    </div>
                  </div>
                  {boxQuantityValue > 0 && (
                    <div className="grid sm:grid-cols-2 gap-4 items-end">
                      <div className="">
                        <label className="block mb-1 text-text1">
                          Box Quantity
                        </label>
                        <input
                          {...register("boxQuantity")}
                          type="number"
                          min="1"
                          disabled={!isEditable}
                          className={inputStyle}
                          placeholder="Enter number of boxes"
                        />
                      </div>
                      <div></div>
                    </div>
                  )}
                  {bagQuantityValue > 0 && (
                    <div className="grid sm:grid-cols-2 gap-4 items-end">
                      <div className="">
                        <label className="block mb-1 text-text1">
                          Bag Quantity
                        </label>
                        <input
                          {...register("bagQuantity")}
                          type="number"
                          min="1"
                          disabled={!isEditable}
                          className={inputStyle}
                          placeholder="Enter number of Bags"
                        />
                      </div>
                    </div>
                  )}
                  {envelopeQuantityValue > 0 && (
                    <div className="grid sm:grid-cols-2 gap-4 items-end">
                      <div className="">
                        <label className="block mb-1 text-text1">
                          Envelope Quantity
                        </label>
                        <input
                          {...register("envelopeQuantity")}
                          type="number"
                          min="1"
                          disabled={!isEditable}
                          className={inputStyle}
                          placeholder="Enter number of totes"
                        />
                      </div>
                    </div>
                  )}
                  {othersQuantityValue > 0 && (
                    <>
                      <div className="grid sm:grid-cols-2 gap-4 items-end">
                        <div className="">
                          <label className="block mb-1 text-text1">
                            Specify Delivery Type
                          </label>
                          <input
                            type="text"
                            {...register("othersDescription")}
                            disabled={!isEditable}
                            className={inputStyle}
                            placeholder="Specify Delivery Type"
                          />
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4 items-end">
                        <div className="">
                          <label className="block mb-1 text-text1">
                            Quantity
                          </label>
                          <input
                            {...register("othersQuantity")}
                            type="number"
                            min="1"
                            disabled={!isEditable}
                            className={inputStyle}
                            placeholder="Enter Quantity"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {selectedDeliveryType === "Envelope" && (
                <>
                  <div className="grid sm:grid-cols-2 gap-4 items-end">
                    <div className="">
                      <label className="block mb-1 text-text1">
                        Envelope Quantity
                      </label>
                      <input
                        {...register("envelopeQuantity")}
                        type="number"
                        min="1"
                        disabled={!isEditable}
                        className={inputStyle}
                        placeholder="Enter number of envelopes"
                      />
                    </div>
                    <div></div>
                  </div>
                  {boxQuantityValue > 0 && (
                    <div className="grid sm:grid-cols-2 gap-4 items-end">
                      <div className="">
                        <label className="block mb-1 text-text1">
                          Box Quantity
                        </label>
                        <input
                          {...register("boxQuantity")}
                          type="number"
                          min="1"
                          disabled={!isEditable}
                          className={inputStyle}
                          placeholder="Enter number of boxes"
                        />
                      </div>
                      <div></div>
                    </div>
                  )}
                  {bagQuantityValue > 0 && (
                    <div className="grid sm:grid-cols-2 gap-4 items-end">
                      <div className="">
                        <label className="block mb-1 text-text1">
                          Bag Quantity
                        </label>
                        <input
                          {...register("bagQuantity")}
                          type="number"
                          min="1"
                          disabled={!isEditable}
                          className={inputStyle}
                          placeholder="Enter number of Bags"
                        />
                      </div>
                    </div>
                  )}
                  {toteQuantityValue > 0 && (
                    <div className="grid sm:grid-cols-2 gap-4 items-end">
                      <div className="">
                        <label className="block mb-1 text-text1">
                          Tote Quantity
                        </label>
                        <input
                          {...register("toteQuantity")}
                          type="number"
                          min="1"
                          disabled={!isEditable}
                          className={inputStyle}
                          placeholder="Enter number of totes"
                        />
                      </div>
                    </div>
                  )}
                  {othersQuantityValue > 0 && (
                    <>
                      <div className="grid sm:grid-cols-2 gap-4 items-end">
                        <div className="">
                          <label className="block mb-1 text-text1">
                            Specify Delivery Type
                          </label>
                          <input
                            type="text"
                            {...register("othersDescription")}
                            disabled={!isEditable}
                            className={inputStyle}
                            placeholder="Specify Delivery Type"
                          />
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4 items-end">
                        <div className="">
                          <label className="block mb-1 text-text1">
                            Quantity
                          </label>
                          <input
                            {...register("othersQuantity")}
                            type="number"
                            min="1"
                            disabled={!isEditable}
                            className={inputStyle}
                            placeholder="Enter Quantity"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {selectedDeliveryType === "Others" && (
                <>
                  {boxQuantityValue > 0 && (
                    <div className="grid sm:grid-cols-2 gap-4 items-end">
                      <div className="">
                        <label className="block mb-1 text-text1">
                          Box Quantity
                        </label>
                        <input
                          {...register("boxQuantity")}
                          type="number"
                          min="1"
                          disabled={!isEditable}
                          className={inputStyle}
                          placeholder="Enter number of boxes"
                        />
                      </div>
                      <div></div>
                    </div>
                  )}

                  {bagQuantityValue > 0 && (
                    <div className="grid sm:grid-cols-2 gap-4 items-end">
                      <div className="">
                        <label className="block mb-1 text-text1">
                          Bag Quantity
                        </label>
                        <input
                          {...register("bagQuantity")}
                          type="number"
                          min="1"
                          disabled={!isEditable}
                          className={inputStyle}
                          placeholder="Enter number of Bags"
                        />
                      </div>
                    </div>
                  )}

                  {toteQuantityValue > 0 && (
                    <div className="grid sm:grid-cols-2 gap-4 items-end">
                      <div className="">
                        <label className="block mb-1 text-text1">
                          Tote Quantity
                        </label>
                        <input
                          {...register("toteQuantity")}
                          type="number"
                          min="1"
                          disabled={!isEditable}
                          className={inputStyle}
                          placeholder="Enter number of totes"
                        />
                      </div>
                    </div>
                  )}
                  {envelopeQuantityValue > 0 && (
                    <div className="grid sm:grid-cols-2 gap-4 items-end">
                      <div className="">
                        <label className="block mb-1 text-text1">
                          Envelope Quantity
                        </label>
                        <input
                          {...register("envelopeQuantity")}
                          type="number"
                          min="1"
                          disabled={!isEditable}
                          className={inputStyle}
                          placeholder="Enter number of totes"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-4 items-end">
                    <div className="">
                      <label className="block mb-1 text-text1">
                        Specify Delivery Type
                      </label>
                      <input
                        type="text"
                        {...register("othersDescription")}
                        disabled={!isEditable}
                        className={inputStyle}
                        placeholder="Specify Delivery Type"
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4 items-end">
                    <div className="">
                      <label className="block mb-1 text-text1">Quantity</label>
                      <input
                        {...register("othersQuantity")}
                        type="number"
                        min="1"
                        disabled={!isEditable}
                        className={inputStyle}
                        placeholder="Enter Quantity"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div>
              <label className="block mb-1 text-text1">Delivery Status</label>
              <label className="block mb-1">
                {deliveryStatus === "pending"
                  ? "Pending"
                  : deliveryStatus === "completed"
                  ? "Completed"
                  : "Unavailable"}
              </label>
            </div>

            {deliveryStatus === "unavailable" && (
              <div className="w-full flex flex-col gap-2 mt-2">
                {isEditable ? (
                  <textarea
                    {...register("unavailabilityReason")}
                    className="border border-gray-300 w-full p-2 rounded-lg"
                    placeholder="Reason for unavailability"
                  ></textarea>
                ) : (
                  <>
                    <label className="block mb-1 text-text1">
                      Reason for unavailability
                    </label>

                    <p className="w-full p-2 border border-none rounded-lg bg-gray-50">
                      {data?.unavailabilityReason || "No information"}
                    </p>
                  </>
                )}
                <p className="text-red-500">
                  {errors.unavailabilityReason?.message}
                </p>
              </div>
            )}

            {deliveryStatus === "completed" && (
              <>
                <div>
                  {isInitiallyPending && (
                    <>
                      <label className="block mb-1 text-text1">
                        Recipient name
                      </label>
                      <input
                        {...register("deliveryRecipientName")}
                        className="w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
                      />
                      <p className="text-red-500">
                        {errors.deliveryRecipientName?.message}
                      </p>
                    </>
                  )}

                  {!isInitiallyPending && deliveryStatus === "completed" && (
                    <>
                      <div>
                        <label className="block mb-1 text-text1">
                          Recipient name
                        </label>
                        <p className="w-full p-2 border border-none rounded-lg bg-gray-50">
                          {data?.deliveryRecipientName}
                        </p>
                      </div>

                      <div className="w-full flex sm:flex-row flex-col mt-4 items-start justify-start gap-4 sm:gap-6">
                        {
                          <div className="">
                            <label className="block mb-1 text-text1">
                              Proof Of Delivery
                            </label>
                            <div className="space-y-4">
                              {data.podImages.map((podImage) => {
                                return (
                                  <img
                                    src={`${SERVER_URL}${podImage}`}
                                    alt="Uploaded"
                                    style={{
                                      display: "block",
                                      border: "1px solid black",
                                      width: "150px",
                                      minHeight: "50px",
                                      maxHeight: "150px",
                                      objectFit: "contain",
                                    }}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        }
                        {
                          <div className="">
                            <label className="block mb-1 text-text1">
                              Signature
                            </label>
                            <img
                              src={`${SERVER_URL}${data.signatureImage}`}
                              alt="my signature"
                              style={{
                                display: "block",
                                border: "1px solid black",
                                width: "150px",
                                minHeight: "50px", // Minimum height
                                maxHeight: "150px", // Maximum height
                                objectFit: "contain", // Ensure it scales properly without distortion
                              }}
                            />
                          </div>
                        }
                      </div>
                    </>
                  )}
                </div>
              </>
            )}

            <div className="w-full flex justify-between items-center mt-8">
              {isInitiallyPending &&
              deliveryStatus !== "completed" &&
              !isEditable ? (
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
                <>
                  {isInitiallyPending && (
                    <div className=" w-full flex justify-between">
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="w-fit border text-text1 px-4 py-2 rounded-lg hover:bg-gray-200 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isPending}
                        className="w-fit py-2 px-6 bg-third text-white rounded-lg"
                      >
                        {isPending ? "Updating..." : "Update"}
                      </button>
                    </div>
                  )}
                </>
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
                disabled={deleteDeliveryPending}
                className="px-4 py-2 mr-2 bg-gray-300 rounded-md cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteDeliveryPending}
                className="px-4 py-2 bg-red-600 text-white rounded-md cursor-pointer"
              >
                {deleteDeliveryPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Order;

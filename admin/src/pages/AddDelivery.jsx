import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { createDelivery, getAllCompanies } from "../http/http";
import { LuPlus } from "react-icons/lu";
import { Link } from "react-router-dom";
import { Tooltip } from "react-tooltip";

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
    // Remove required here. We'll enforce it conditionally in a test below.
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
    othersDescription: yup.string().when("deliveryType", {
      is: "Others",
      then: (schema) => schema.required("Please fill out the field"),
      otherwise: (schema) => schema.notRequired(),
    }),
  })
  // Enforce: if none of the quantity fields has a value > 0, then deliveryType is required.
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
  // First test for (othersQuantity, othersDescription) pair
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
  // Keep this test for any further interdependent validations
  .test("conditional-validations", null, function (values) {
    return true;
  })
  // Second test for (othersQuantity, othersDescription) pair targeting specific path
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

const AddDelivery = () => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [deliveries, setDeliveries] = useState([]);
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

  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryFn: getAllCompanies,
    queryKey: ["all-deliveries"],
  });

  useEffect(() => {
    if (data) {
      setCompanies(data);
    }
  }, [data]);

  const handleCompanyChange = (e) => {
    const companyName = e.target.value;
    setSelectedCompany(companyName);

    const company = companies.find((c) => c.name === companyName);
    if (company) {
      Object.keys(company).forEach((key) => setValue(key, company[key]));
    } else {
      reset();
    }
  };

  const { mutate, isPending } = useMutation({
    mutationFn: createDelivery,
    mutationKey: ["create-delivery"],
    onSuccess: () => {
      alert("Delivery added successfully!");
      queryClient.invalidateQueries({ queryKey: ["all-deliveries"] });
      setSelectedCompany("");
      reset();
    },
    onError: () => {
      alert("Error occured while confirming your delivery, please try again!");
    },
  });

  const onSubmit = async (data) => {
    if (othersDescriptionValue && othersQuantityValue === "") {
      alert("Please provide a valid quantity for the specified delivery type.");
    }
    data.companyId = data.id;
    delete data.id;
    delete data.createdAt;
    delete data.deliveryType;

    mutate(data);
  };

  const saveDeliveryHandler = (data) => {
    setDeliveries([...deliveries, data]);
    // Save delivery to database
  };
  const selectedDeliveryType = watch("deliveryType");
  const boxQuantityValue = watch("boxQuantity");
  const bagQuantityValue = watch("bagQuantity");
  const toteQuantityValue = watch("toteQuantity");
  const envelopeQuantityValue = watch("envelopeQuantity");
  const othersQuantityValue = watch("othersQuantity");
  const othersDescriptionValue = watch("othersDescription");
  return (
    <>
      <div className=" text-2xl font-bold px-6 pt-6 text-third relative font-outfit">
        Add Delivery
      </div>
      <div className="border h-full font-outfit overflow-y-scroll custom-scrollbar border-gray-200 rounded-lg shadow-md bg-white sm:m-4 m-2">
        <div className="max-w-3xl sm:p-6 p-3">
          <div className="flex items-end gap-4">
            <div className="flex-col gap-4 items-start">
              <label className="block font-medium mb-1 text-text1 text-left">
                Facilities
              </label>
              <select
                className=" w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
                value={selectedCompany}
                onChange={handleCompanyChange}
              >
                <option value="">Select a facility</option>
                {companies.map((company, index) => (
                  <option key={index} value={company.name}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            <Link
              data-tooltip-id="my-tooltip"
              data-tooltip-content="Add Facility"
              to={"/add-facilities"}
              className="flex py-2 px-2 items-center bg-third text-white rounded-lg gap-2"
            >
              <Tooltip id="my-tooltip" />
              <LuPlus className="text-white h-6 w-6" />
            </Link>
          </div>
          {selectedCompany && (
            <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-3">
              <div>
                <label className="block mb-1 text-text1">Facility Name</label>
                <input
                  {...register("name")}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
                />
                <p className="text-red-500">{errors.name?.message}</p>
              </div>

              <div>
                <label className="block mb-1 text-text1">Contact Person</label>
                <input
                  {...register("contactPersonName")}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
                />
                <p className="text-red-500">
                  {errors.contactPersonName?.message}
                </p>
              </div>

              <div>
                <label className="block mb-1 text-text1">
                  Facility Address
                </label>
                <input
                  {...register("address")}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
                />
                <p className="text-red-500">{errors.address?.message}</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-text1">Phone Number</label>
                  <input
                    {...register("contactPersonPhone")}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
                  />
                  <p className="text-red-500">
                    {errors.contactPersonPhone?.message}
                  </p>
                </div>
                <div>
                  <label className="block mb-1 text-text1">Email</label>
                  <input
                    {...register("email")}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
                  />
                  <p className="text-red-500">{errors.email?.message}</p>
                </div>
              </div>

              {/* //////// */}

              <div>
                <label className="block mb-1 text-text1">Delivery Type</label>
                <select
                  {...register("deliveryType")}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
                >
                  <option value="">Select a type</option>
                  <option value="Box">Box</option>
                  <option value="Bag">Bag</option>
                  <option value="Tote">Tote</option>
                  <option value="Envelope">Envelope</option>
                  <option value="Others">Others</option>
                </select>
                <p className="text-red-500">{errors.deliveryType?.message}</p>

                {selectedDeliveryType === "" && (
                  <>
                    {boxQuantityValue > 0 && (
                      <div className="grid grid-cols-2 gap-4 items-end">
                        <div className="mt-4">
                          <label className="block mb-1 text-text1">
                            Number of Boxes
                          </label>
                          <input
                            {...register("boxQuantity")}
                            type="number"
                            min="1"
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
                            placeholder="Enter number of boxes"
                          />
                        </div>
                        <div></div>
                      </div>
                    )}
                    {bagQuantityValue > 0 && (
                      <div className="grid grid-cols-2 gap-4 items-end">
                        <div className="mt-4">
                          <label className="block mb-1 text-text1">
                            Number of Bags
                          </label>
                          <input
                            {...register("bagQuantity")}
                            type="number"
                            min="1"
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
                            placeholder="Enter number of Bags"
                          />
                        </div>
                        <div></div>
                      </div>
                    )}
                    {toteQuantityValue > 0 && (
                      <div className="grid grid-cols-2 gap-4 items-end">
                        <div className="mt-4">
                          <label className="block mb-1 text-text1">
                            Number of Totes
                          </label>
                          <input
                            {...register("toteQuantity")}
                            type="number"
                            min="1"
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
                            placeholder="Enter number of totes"
                          />
                        </div>
                      </div>
                    )}
                    {envelopeQuantityValue > 0 && (
                      <div className="grid grid-cols-2 gap-4 items-end">
                        <div className="mt-4">
                          <label className="block mb-1 text-text1">
                            Number of Envelopes
                          </label>
                          <input
                            {...register("envelopeQuantity")}
                            type="number"
                            min="1"
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
                            placeholder="Enter number of totes"
                          />
                        </div>
                      </div>
                    )}
                    {othersQuantityValue > 0 && (
                      <>
                        <div className="grid grid-cols-2 gap-4 items-end">
                          <div className="mt-4">
                            <label className="block mb-1 text-text1">
                              Specify Delivery Type
                            </label>
                            <input
                              type="text"
                              {...register("othersDescription")}
                              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
                              placeholder="Specify Delivery Type"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 items-end">
                          <div className="mt-4">
                            <label className="block mb-1 text-text1">
                              Quantity
                            </label>
                            <input
                              {...register("othersQuantity")}
                              type="number"
                              min="1"
                              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
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
                    <div className="grid grid-cols-2 gap-4 items-end">
                      <div className="mt-4">
                        <label className="block mb-1 text-text1">
                          Number of Boxes
                        </label>
                        <input
                          {...register("boxQuantity")}
                          type="number"
                          min="1"
                          className="w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
                          placeholder="Enter number of boxes"
                        />
                      </div>
                      <div></div>
                    </div>
                    {bagQuantityValue > 0 && (
                      <div className="grid grid-cols-2 gap-4 items-end">
                        <div className="mt-4">
                          <label className="block mb-1 text-text1">
                            Number of Bags
                          </label>
                          <input
                            {...register("bagQuantity")}
                            type="number"
                            min="1"
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
                            placeholder="Enter number of Bags"
                          />
                        </div>
                        <div></div>
                      </div>
                    )}
                    {toteQuantityValue > 0 && (
                      <div className="grid grid-cols-2 gap-4 items-end">
                        <div className="mt-4">
                          <label className="block mb-1 text-text1">
                            Number of Totes
                          </label>
                          <input
                            {...register("toteQuantity")}
                            type="number"
                            min="1"
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
                            placeholder="Enter number of totes"
                          />
                        </div>
                      </div>
                    )}
                    {envelopeQuantityValue > 0 && (
                      <div className="grid grid-cols-2 gap-4 items-end">
                        <div className="mt-4">
                          <label className="block mb-1 text-text1">
                            Number of Envelopes
                          </label>
                          <input
                            {...register("envelopeQuantity")}
                            type="number"
                            min="1"
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
                            placeholder="Enter number of totes"
                          />
                        </div>
                      </div>
                    )}
                    {othersQuantityValue > 0 && (
                      <>
                        <div className="grid grid-cols-2 gap-4 items-end">
                          <div className="mt-4">
                            <label className="block mb-1 text-text1">
                              Specify Delivery Type
                            </label>
                            <input
                              type="text"
                              {...register("othersDescription")}
                              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
                              placeholder="Specify Delivery Type"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 items-end">
                          <div className="mt-4">
                            <label className="block mb-1 text-text1">
                              Quantity
                            </label>
                            <input
                              {...register("othersQuantity")}
                              type="number"
                              min="1"
                              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
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
                    <div className="grid grid-cols-2 gap-4 items-end">
                      <div className="mt-4">
                        <label className="block mb-1 text-text1">
                          Number of Bags
                        </label>
                        <input
                          {...register("bagQuantity")}
                          type="number"
                          min="1"
                          className="w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
                          placeholder="Enter number of Bags"
                        />
                      </div>
                      <div></div>
                    </div>
                    {boxQuantityValue && (
                      <div className="grid grid-cols-2 gap-4 items-end">
                        <div className="mt-4">
                          <label className="block mb-1 text-text1">
                            Number of Boxes
                          </label>
                          <input
                            {...register("boxQuantity")}
                            type="number"
                            min="1"
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
                            placeholder="Enter number of boxes"
                          />
                        </div>
                        <div></div>
                      </div>
                    )}
                    {toteQuantityValue > 0 && (
                      <div className="grid grid-cols-2 gap-4 items-end">
                        <div className="mt-4">
                          <label className="block mb-1 text-text1">
                            Number of Totes
                          </label>
                          <input
                            {...register("toteQuantity")}
                            type="number"
                            min="1"
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
                            placeholder="Enter number of totes"
                          />
                        </div>
                      </div>
                    )}
                    {envelopeQuantityValue > 0 && (
                      <div className="grid grid-cols-2 gap-4 items-end">
                        <div className="mt-4">
                          <label className="block mb-1 text-text1">
                            Number of Envelopes
                          </label>
                          <input
                            {...register("envelopeQuantity")}
                            type="number"
                            min="1"
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
                            placeholder="Enter number of totes"
                          />
                        </div>
                      </div>
                    )}
                    {othersQuantityValue > 0 && (
                      <>
                        <div className="grid grid-cols-2 gap-4 items-end">
                          <div className="mt-4">
                            <label className="block mb-1 text-text1">
                              Specify Delivery Type
                            </label>
                            <input
                              type="text"
                              {...register("othersDescription")}
                              // value={storeDeliveryDescription}
                              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
                              placeholder="Specify Delivery Type"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 items-end">
                          <div className="mt-4">
                            <label className="block mb-1 text-text1">
                              Quantity
                            </label>
                            <input
                              {...register("othersQuantity")}
                              type="number"
                              min="1"
                              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
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
                    <div className="grid grid-cols-2 gap-4 items-end">
                      <div className="mt-4">
                        <label className="block mb-1 text-text1">
                          Number of Totes
                        </label>
                        <input
                          {...register("toteQuantity")}
                          type="number"
                          min="1"
                          className="w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
                          placeholder="Enter number of totes"
                        />
                      </div>
                    </div>
                    {boxQuantityValue > 0 && (
                      <div className="grid grid-cols-2 gap-4 items-end">
                        <div className="mt-4">
                          <label className="block mb-1 text-text1">
                            Number of Boxes
                          </label>
                          <input
                            {...register("boxQuantity")}
                            type="number"
                            min="1"
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
                            placeholder="Enter number of boxes"
                          />
                        </div>
                        <div></div>
                      </div>
                    )}
                    {bagQuantityValue > 0 && (
                      <div className="grid grid-cols-2 gap-4 items-end">
                        <div className="mt-4">
                          <label className="block mb-1 text-text1">
                            Number of Bags
                          </label>
                          <input
                            {...register("bagQuantity")}
                            type="number"
                            min="1"
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
                            placeholder="Enter number of Bags"
                          />
                        </div>
                      </div>
                    )}
                    {envelopeQuantityValue > 0 && (
                      <div className="grid grid-cols-2 gap-4 items-end">
                        <div className="mt-4">
                          <label className="block mb-1 text-text1">
                            Number of Envelopes
                          </label>
                          <input
                            {...register("envelopeQuantity")}
                            type="number"
                            min="1"
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
                            placeholder="Enter number of totes"
                          />
                        </div>
                      </div>
                    )}
                    {othersQuantityValue > 0 && (
                      <>
                        <div className="grid grid-cols-2 gap-4 items-end">
                          <div className="mt-4">
                            <label className="block mb-1 text-text1">
                              Specify Delivery Type
                            </label>
                            <input
                              type="text"
                              {...register("othersDescription")}
                              // value={storeDeliveryDescription}
                              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
                              placeholder="Specify Delivery Type"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 items-end">
                          <div className="mt-4">
                            <label className="block mb-1 text-text1">
                              Quantity
                            </label>
                            <input
                              {...register("othersQuantity")}
                              type="number"
                              min="1"
                              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
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
                    <div className="grid grid-cols-2 gap-4 items-end">
                      <div className="mt-4">
                        <label className="block mb-1 text-text1">
                          Number of Envelopes
                        </label>
                        <input
                          {...register("envelopeQuantity")}
                          type="number"
                          min="1"
                          className="w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
                          placeholder="Enter number of envelopes"
                        />
                      </div>
                      <div></div>
                    </div>
                    {boxQuantityValue > 0 && (
                      <div className="grid grid-cols-2 gap-4 items-end">
                        <div className="mt-4">
                          <label className="block mb-1 text-text1">
                            Number of Boxes
                          </label>
                          <input
                            {...register("boxQuantity")}
                            type="number"
                            min="1"
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
                            placeholder="Enter number of boxes"
                          />
                        </div>
                        <div></div>
                      </div>
                    )}
                    {bagQuantityValue > 0 && (
                      <div className="grid grid-cols-2 gap-4 items-end">
                        <div className="mt-4">
                          <label className="block mb-1 text-text1">
                            Number of Bags
                          </label>
                          <input
                            {...register("bagQuantity")}
                            type="number"
                            min="1"
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
                            placeholder="Enter number of Bags"
                          />
                        </div>
                      </div>
                    )}
                    {toteQuantityValue > 0 && (
                      <div className="grid grid-cols-2 gap-4 items-end">
                        <div className="mt-4">
                          <label className="block mb-1 text-text1">
                            Number of Totes
                          </label>
                          <input
                            {...register("toteQuantity")}
                            type="number"
                            min="1"
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
                            placeholder="Enter number of totes"
                          />
                        </div>
                      </div>
                    )}
                    {othersQuantityValue > 0 && (
                      <>
                        <div className="grid grid-cols-2 gap-4 items-end">
                          <div className="mt-4">
                            <label className="block mb-1 text-text1">
                              Specify Delivery Type
                            </label>
                            <input
                              type="text"
                              {...register("othersDescription")}
                              // value={storeDeliveryDescription}
                              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
                              placeholder="Specify Delivery Type"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 items-end">
                          <div className="mt-4">
                            <label className="block mb-1 text-text1">
                              Quantity
                            </label>
                            <input
                              {...register("othersQuantity")}
                              type="number"
                              min="1"
                              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
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
                      <div className="grid grid-cols-2 gap-4 items-end">
                        <div className="mt-4">
                          <label className="block mb-1 text-text1">
                            Number of Boxes
                          </label>
                          <input
                            {...register("boxQuantity")}
                            type="number"
                            min="1"
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
                            placeholder="Enter number of boxes"
                          />
                        </div>
                        <div></div>
                      </div>
                    )}

                    {bagQuantityValue > 0 && (
                      <div className="grid grid-cols-2 gap-4 items-end">
                        <div className="mt-4">
                          <label className="block mb-1 text-text1">
                            Number of Bags
                          </label>
                          <input
                            {...register("bagQuantity")}
                            type="number"
                            min="1"
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
                            placeholder="Enter number of Bags"
                          />
                        </div>
                      </div>
                    )}

                    {toteQuantityValue > 0 && (
                      <div className="grid grid-cols-2 gap-4 items-end">
                        <div className="mt-4">
                          <label className="block mb-1 text-text1">
                            Number of Totes
                          </label>
                          <input
                            {...register("toteQuantity")}
                            type="number"
                            min="1"
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
                            placeholder="Enter number of totes"
                          />
                        </div>
                      </div>
                    )}
                    {envelopeQuantityValue > 0 && (
                      <div className="grid grid-cols-2 gap-4 items-end">
                        <div className="mt-4">
                          <label className="block mb-1 text-text1">
                            Number of Envelopes
                          </label>
                          <input
                            {...register("envelopeQuantity")}
                            type="number"
                            min="1"
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
                            placeholder="Enter number of totes"
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 items-end">
                      <div className="mt-4">
                        <label className="block mb-1 text-text1">
                          Specify Delivery Type
                        </label>
                        <input
                          type="text"
                          {...register("othersDescription")}
                          // value={storeDeliveryDescription}
                          className="w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
                          placeholder="Specify Delivery Type"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 items-end">
                      <div className="mt-4">
                        <label className="block mb-1 text-text1">
                          Quantity
                        </label>
                        <input
                          {...register("othersQuantity")}
                          type="number"
                          min="1"
                          className="w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
                          placeholder="Enter Quantity"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
              {/* ///////////// */}

              {/* <div>
                <label className="block mb-1 text-text1">Delivery Type</label>
                <select
                  {...register("deliveryType")}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
                >
                  <option value="">Select a type</option>
                  <option value="Box">Box</option>
                  <option value="Bag">Bag</option>
                  <option value="Others">Others</option>
                </select>
                <p className="text-red-500">{errors.deliveryType?.message}</p>
                {watch("deliveryType") === "Others" && (
                  <input
                    {...register("deliveryTypeDescription")}
                    className="w-full p-2 border my-4 border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
                    placeholder="Specify Delivery Type"
                  />
                )}
              </div> */}

              {/* <div>
                <label className="block mb-1 text-text1">Quantity</label>
                <input
                  type="number"
                  {...register("quantity")}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
                />
                <p className="text-red-500">{errors.quantity?.message}</p>
              </div> */}

              {/* <div>
                <label className="block mb-1 text-gray-700">Total Cost</label>
                <input
                  type="number"
                  {...register("totalCost")}
                  className="w-full p-2 border border-gray-200 rounded-lg"
                />
                <p className="text-red-500">{errors.totalCost?.message}</p>
              </div> */}

              <button
                type="submit"
                disabled={isPending}
                className="mt-8 py-2 px-6 bg-third cursor-pointer text-white rounded-lg w-fit"
              >
                {isPending ? "Confirming..." : "Confirm Delivery"}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default AddDelivery;

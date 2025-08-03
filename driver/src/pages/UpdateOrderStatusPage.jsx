import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { getDeliveryById, SERVER_URL, updateDelivery } from "../http/http";
import { useNavigate, useParams } from "react-router-dom";
import SignaturePad from "../components/SignaturePad";
import { RxCross1 } from "react-icons/rx";
import MainContext from "../store/MainContext";

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
    othersDescription: yup.string().when("deliveryType", {
      is: "Others",
      then: (schema) => schema.required("Please fill out the field"),
      otherwise: (schema) => schema.notRequired(),
    }),
    recipientName: yup.string().when("deliveryStatus", {
      is: "completed",
      then: (schema) => schema.required("Recipient name is required"),
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
const UpdateOrderStatusPage = () => {
  const { orderId } = useParams();
  const [isEditable, setIsEditable] = useState(false);
  const [originalData, setOriginalData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [signatureImage, setSignatureImage] = useState(null);
  const [podImage, setPodImage] = useState([]);
  const [isInitiallyPending, setIsInitiallyPending] = useState();
  const [imageURL, setImageURL] = useState(null);
  const [preview, setPreview] = useState(null);
  const navigate = useNavigate();
  const { userData } = useContext(MainContext);
  const podImageRef = useRef(null);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryFn: () => getDeliveryById(orderId),
    queryKey: [`order-${orderId}`],
    enabled: !!orderId,
  });

  const deliveryStatus = watch("deliveryStatus");

  const reason = watch("reason");
  const handleComplete = () => {
    if (deliveryStatus === "unavailable" && reason) {
      setIsComplete(true);
    }
  };

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

  useEffect(() => {
    if (deliveryStatus === "unavailable") {
      setPreview(null);
      setPodImage([]);
      setSignatureImage(null);
      setImageURL(null);
    }
  }, [deliveryStatus, reset]);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (data) => updateDelivery(data),
    onSuccess: () => {
      setPreview(null);
      setImageURL(null);
      setIsEditable(false);
      queryClient.removeQueries([{ queryKey: `order-${orderId}` }]);
      queryClient.invalidateQueries([{ queryKey: "all-user-deliveries" }]);
      queryClient.invalidateQueries(["all-pending-deliveries"]);
      if (deliveryStatus === "unavailable") {
        navigate("/");
      }
      return alert("Updated successfully");
    },
    onError: () => {
      return alert("Update failed");
    },
  });
  const onSubmit = async (formData) => {
    const submitData = new FormData();

    if (formData.deliveryStatus === "completed") {
      if (!signatureImage || podImage.length < 1) {
        return alert("Please upload Proof of delivery and Signature");
      }
      submitData.append("signatureImage", signatureImage, "signature.png");

      podImage.forEach((image, index) => {
        submitData.append("podImage", image, `podImage${index + 1}.png`);
      });
    }

    if (formData.deliveryStatus === "unavailable") {
      submitData.append("unavailabilityReason", formData.unavailabilityReason);
    }
    if (["completed", "unavailable"].includes(formData.deliveryStatus)) {
      submitData.append("orderSerial", data.orderSerial);
      submitData.append("driverId", userData.id);
      submitData.append("deliveryStatus", formData.deliveryStatus);
      submitData.append("email", formData.email);
      submitData.append("deliveryRecipientName", formData.recipientName);
      await mutateAsync({ data: submitData, id: orderId });
    }
  };

  const handleEdit = () => setIsEditable(true);

  const handleCancel = () => {
    reset(originalData);
    setIsEditable(false);
    setPodImage([]);
    setSignatureImage(null);
    setImageURL(false);
    setPreview(false);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleConfirmModal = (dataUrl) => {
    if (dataUrl) {
      setValue("signature", "SampleSignature");
      setShowModal(false);
    } else {
      alert("Please provide a signature before confirming.");
    }
  };
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

  const handleImageUpload = (e) => {
    let files = Array.from(e.target.files);
    if (files.length > 4 || files.length + podImage?.length > 4) {
      alert("You can upload a maximum of 4 images.");
      podImageRef.current.value = "";

      return;
    }
    files = [...podImage, ...files];
    setValue("file", files);
    setPodImage(files);

    const readers = files.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then((base64Images) => {
      setPreview(base64Images);
    });
  };

  const handleImageCancel = (index) => {
    const newPodImage = [...podImage];
    newPodImage.splice(index, 1);
    setPodImage(newPodImage);

    const newPreview = [...preview];
    newPreview.splice(index, 1);
    setPreview(newPreview);

    setValue("file", newPodImage);
  };
  const handleCaptureSignature = () => {
    setShowModal(true);
  };

  const inputStyle =
    "w-full p-2 border border-gray-200 rounded-lg bg-white focus:ring-purple-500 focus:ring-2 outline-0";

  return (
    <>
      <div className="text-2xl font-bold px-3 pb-2 sm:pb-0 sm:px-6 pt-6 text-third relative font-outfit">
        Update Delivery
      </div>
      <div className="border h-full overflow-y-scroll custom-scrollbar font-outfit border-gray-200 rounded-lg shadow-md bg-white sm:m-4 m-2">
        <div className="max-w-2xl sm:p-6 p-3">
          <p className="font-semibold text-text1 break-words">
            #{data.orderSerial}
          </p>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-4 space-y-3 w-full"
            encType="multipart/form-data"
          >
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              {isEditable ? (
                <select {...register("deliveryStatus")} className={inputStyle}>
                  <option value="">Select status</option>
                  <option value="unavailable">Unavailable</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              ) : (
                <p className="w-full p-2 border border-none rounded-lg bg-gray-50">
                  {data?.deliveryStatus === "unavailable" && "Unavailable"}
                  {data?.deliveryStatus === "pending" && "Pending"}
                  {data?.deliveryStatus === "completed" && "Completed"}
                </p>
              )}
              <p className="text-red-500">{errors.deliveryStatus?.message}</p>
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

            {isInitiallyPending && deliveryStatus === "completed" && (
              <>
                <div className="w-full flex sm:flex-row flex-col gap-2 mt-2">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    ref={podImageRef}
                    disabled={preview?.length >= 4}
                    className="w-1/2 py-2 px-4 border border-dashed border-gray-300 rounded"
                  />

                  <button
                    type="button"
                    onClick={handleCaptureSignature}
                    className="w-1/2 sm:w-auto py-2 px-4 border text-text1 rounded"
                  >
                    Take Signature
                  </button>
                </div>
                <div className="">
                  <label className="block mb-1 text-text1">
                    Recipient name
                  </label>
                  <input
                    {...register("recipientName")}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-purple-500 focus:ring-2 outline-0"
                  />
                  <p className="text-red-500">
                    {errors.recipientName?.message}
                  </p>
                </div>
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
                        {data.podImages.map((podImage, index) => {
                          return (
                            <img
                              key={index}
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
                      <label className="block mb-1 text-text1">Signature</label>
                      <img
                        src={`${SERVER_URL}${data.signatureImage}`}
                        alt="my signature"
                        style={{
                          display: "block",
                          border: "1px solid black",
                          width: "150px",
                          minHeight: "50px",
                          maxHeight: "150px",
                          objectFit: "contain",
                        }}
                      />
                    </div>
                  }
                </div>
              </>
            )}
            <div className="w-full flex mt-4 items-start justify-start gap-4 sm:gap-6">
              {preview && (
                <div className="">
                  <label className="block mb-1 text-text1">
                    Proof Of Delivery
                  </label>
                  <div className="flex flex-col items-center gap-2">
                    {preview.map((src, index) => (
                      <div
                        key={index}
                        className="relative"
                        style={{ width: "150px" }}
                      >
                        <button
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                          onClick={() => handleImageCancel(index)}
                          type="button"
                        >
                          ✕
                        </button>
                        <img
                          src={src}
                          alt={`Uploaded ${index + 1}`}
                          style={{
                            display: "block",
                            border: "1px solid black",
                            width: "150px",
                            minHeight: "50px",
                            maxHeight: "150px",
                            objectFit: "contain",
                            marginBottom: "8px",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {imageURL && (
                <div className="">
                  <label className="block mb-1 text-text1">Signature</label>
                  <img
                    src={imageURL}
                    alt="my signature"
                    style={{
                      display: "block",
                      border: "1px solid black",
                      width: "150px",
                      minHeight: "50px",
                      maxHeight: "150px",
                      objectFit: "contain",
                    }}
                  />
                </div>
              )}
            </div>

            {showModal && (
              <div className="fixed inset-0 h-dvh bg-black/40 flex justify-center items-center z-50">
                <div className="max-w-[95%]  bg-white p-6 rounded-lg shadow-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold">Capture Signature</h2>
                    <button
                      onClick={handleCloseModal}
                      className="text-xl text-gray-600 hover:text-gray-900"
                    >
                      <RxCross1 />
                    </button>
                  </div>

                  <div className="w-full h-[70%]">
                    <SignaturePad
                      setSignatureImage={setSignatureImage}
                      handleConfirmModal={handleConfirmModal}
                      imageURL={imageURL}
                      setImageURL={setImageURL}
                    />
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <div className="py-4 px-6  text-white rounded hover:bg-opacity-90"></div>
                  </div>
                </div>
              </div>
            )}

            <div className="w-full flex justify-between items-center mt-8">
              {isInitiallyPending &&
              deliveryStatus !== "completed" &&
              !isEditable ? (
                <button
                  type="button"
                  onClick={handleEdit}
                  className="py-2 px-6 bg-third text-white rounded-lg cursor-pointer"
                >
                  Update shipment status
                </button>
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
                        onClick={handleComplete}
                        disabled={isPending}
                        className="w-fit py-2 px-6 bg-third text-white rounded-lg cursor-pointer"
                      >
                        {isPending ? "Updating..." : "Complete"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default UpdateOrderStatusPage;

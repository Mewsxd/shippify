import { Request, Response } from "express";
import { db } from "../config/firebase";
import catchAsync from "../utils/catchAsync";
import fs from "fs";
import path from "path";
import { sendEmail } from "../config/sendEmail";
import generateOrderSerial from "../config/generateOrderSerial";
import { paginateCollection } from "../utils/firestorePagination";
import { DocumentData, Query } from "firebase-admin/firestore";
import {
  getAbsoluteFilePath,
  getDeliveryFolder,
  getPublicPath,
} from "../config/storagePath";

// Create a new delivery and send email confirmation
export const createDelivery = catchAsync(
  async (req: Request, res: Response) => {
    let {
      companyId,
      bagQuantity,
      boxQuantity,
      envelopeQuantity,
      toteQuantity,
      othersQuantity,
      othersDescription,
      name,
      address,
      contactPersonName,
      contactPersonPhone,
      email,
    } = req.body;

    // Ensure numeric values for quantities
    bagQuantity = Number(bagQuantity) || 0;
    boxQuantity = Number(boxQuantity) || 0;
    envelopeQuantity = Number(envelopeQuantity) || 0;
    toteQuantity = Number(toteQuantity) || 0;
    othersQuantity = Number(othersQuantity) || 0;
    // If OthersQuantity > 0, othersDescription is required
    if (
      othersQuantity > 0 &&
      (!othersDescription || othersDescription.trim() === "")
    ) {
      return res.status(400).json({
        success: false,
        message:
          "othersDescription is required when othersQuantity is greater than 0",
      });
    }

    // Normalize othersDescription (convert empty string to null)
    othersDescription =
      othersDescription && othersDescription.trim() !== ""
        ? othersDescription
        : null;

    const orderSerial = await generateOrderSerial();
    const newDelivery = {
      companyId,
      driverId: null,
      bagQuantity,
      boxQuantity,
      envelopeQuantity,
      toteQuantity,
      othersQuantity,
      othersDescription,
      orderSerial,
      deliveryStatus: "pending", // Default status
      isAssigned: false,
      name,
      address,
      contactPersonName,
      contactPersonPhone,
      podImage: null,
      signatureImage: null,
      unavailabilityReason: null,
      deliveryRecipientName: null,
      email,
      createdAt: new Date(),
    };

    const deliveryRef = await db.collection("deliveries").add(newDelivery);
    const recipients = [
      email,
      // "info@pharmahealth.net",
      // "avihendeles@gmail.com",
    ];

    const emailBody = `
  <div class="container">
    <h2>Delivery Confirmation</h2>
    <p>Hello <strong>${contactPersonName}</strong>,</p>
    <p>Your delivery has been successfully created. Below are the details of your delivery:</p>
    <div class="details">
      <p><strong>Order Number:</strong> ${orderSerial}</p>
      ${
        bagQuantity
          ? `<p><strong>Bag Quantity:</strong> ${bagQuantity}</p>`
          : ""
      }
      ${
        boxQuantity
          ? `<p><strong>Box Quantity:</strong> ${boxQuantity}</p>`
          : ""
      }
      ${
        envelopeQuantity
          ? `<p><strong>Envelope Quantity:</strong> ${envelopeQuantity}</p>`
          : ""
      }
      ${
        toteQuantity
          ? `<p><strong>Tote Quantity:</strong> ${toteQuantity}</p>`
          : ""
      }
      ${
        othersQuantity && othersDescription
          ? `<p><strong>Description:</strong> ${othersDescription}</p>`
          : ""
      }
      ${
        othersQuantity
          ? `<p><strong>Quantity:</strong> ${othersQuantity}</p>`
          : ""
      }
    
      <p><strong>Address:</strong> ${address}</p>
      <p><strong>Contact Person:</strong> ${contactPersonName}</p>
      <p><strong>Contact Phone:</strong> ${contactPersonPhone}</p>
    </div>

    <div class="footer">
      <p>If you have any questions, feel free to contact us at 
         <a href="mailto:info@pharmahealth.net">info@pharmahealth.net</a>.
      </p>
      <p>&copy; 2025 PharmaHealth. All rights reserved.</p>
    </div>
  </div>
`;

    sendEmail(
      recipients.join(","),
      "From PharmaHealth: Delivery Confirmed",
      emailBody
    ).catch((error) => console.error("Failed to send email:", error));
    res.status(201).json({
      success: true,
      message: "Delivery created",
      deliveryId: deliveryRef.id,
    });
  }
);

export const getDeliveryById = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Delivery ID is required" });
    }

    const deliveryRef = db.collection("deliveries").doc(id);
    const deliverySnapshot = await deliveryRef.get();

    if (!deliverySnapshot.exists) {
      return res
        .status(404)
        .json({ success: false, message: "Delivery not found" });
    }

    const delivery = {
      id: deliverySnapshot.id,
      ...deliverySnapshot.data(),
    };

    res.status(200).json({ success: true, delivery });
  }
);

// Paginated fetch of deliveries with optional filters
export const getDeliveries = catchAsync(async (req: Request, res: Response) => {
  const { cursor = null, orderSerial, deliveryStatus } = req.query;
  const pageSize = 10;

  const whereList: any = [];

  if (orderSerial) {
    whereList.push(["orderSerial", "==", orderSerial]);
  }
  if (deliveryStatus) {
    whereList.push(["deliveryStatus", "==", deliveryStatus]);
  }

  // Perform paginated query using utility function
  const result = await paginateCollection(db, {
    collection: "deliveries",
    pageSize,
    orderBy: ["createdAt", "desc"],
    cursor: cursor as string,
    where: whereList,
    fetchingUnassignedDeliveries: false,
  });

  // Prepare count query using same filters
  let countSnap: Query<DocumentData> = db.collection("deliveries");

  if (deliveryStatus) {
    countSnap = countSnap.where("deliveryStatus", "==", deliveryStatus);
  }
  if (orderSerial) {
    countSnap = countSnap.where("orderSerial", "==", orderSerial);
  }
  const countSnapRes = await countSnap.count().get(); // Get total matching documents
  const totalCount = countSnapRes.data().count;

  // Respond with paginated results and count
  res.status(200).json({
    success: true,
    deliveries: result.items,
    nextCursor: result.nextCursor,
    hasNextPage: result.hasNextPage,
    totalCount,
  });
});

export const getUnAssignedDeliveries = catchAsync(
  async (req: Request, res: Response) => {
    const { cursor = null, orderSerial } = req.query;
    const pageSize = 10;

    // Build the where conditions
    const whereList: any = [
      // ["isAssigned", "==", false],
      // ["deliveryStatus", "!=", "completed"],
      ["deliveryStatus", "!=", "completed"],
    ];

    if (orderSerial) {
      whereList.push(["orderSerial", "==", orderSerial]);
    }
    console.log(whereList);
    const result = await paginateCollection(db, {
      collection: "deliveries",
      pageSize,
      orderBy: ["createdAt", "desc", "deliveryStatus"],
      cursor: cursor as string,
      where: whereList,
      fetchingUnassignedDeliveries: true,
    });

    const countSnap = await db
      .collection("deliveries")
      // .where("isAssigned", "==", false)
      // .where("deliveryStatus", "!=", "completed")
      .where("deliveryStatus", "==", "pending")
      .count()
      .get();
    const totalCount = countSnap.data().count;

    res.status(200).json({
      success: true,
      deliveries: result.items,
      nextCursor: result.nextCursor,
      hasNextPage: result.hasNextPage,
      totalCount,
    });
  }
);

export const updateDelivery = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData: any = { updatedAt: new Date() };

    // Allowed fields for update
    const allowedFields = new Set([
      "orderSerial",
      "companyId",
      "driverId",
      "deliveryStatus",
      "isAssigned",
      "name",
      "address",
      "contactPersonName",
      "contactPersonPhone",
      "email",
      "unavailabilityReason",
      "bagQuantity",
      "boxQuantity",
      "envelopeQuantity",
      "toteQuantity",
      "deliveryRecipientName",
      "othersQuantity",
      "othersDescription", // Included since it's related to othersQuantity
    ]);

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });
    // console.log(req.body);
    // console.log(updateData);

    // if (updateData.hasOwnProperty("isAssigned")) {
    //   updateData.isAssigned = Boolean(updateData.isAssigned);
    // }

    // Set othersDescription to null if othersQuantity is 0
    if (
      updateData.hasOwnProperty("othersQuantity") &&
      updateData.othersQuantity === 0
    ) {
      updateData.othersDescription = null;
    }

    //if the delivery is assigned and the status is not completed, set the status to pending
    if (updateData.isAssigned && req.body["deliveryStatus"] !== "completed") {
      updateData["deliveryStatus"] = "pending";
      updateData["unavailabilityReason"] = null;
    }

    // If deliveryStatus is "unavailable", ensure unavailabilityReason is provided
    if (
      req.body["deliveryStatus"] === "unavailable" &&
      "unavailabilityReason" === null
    ) {
      return res.status(400).json({
        success: false,
        message: "Must include reason for unavailability",
      });
    }

    // Check if delivery exists
    const deliveryRef = db.collection("deliveries").doc(id);
    const deliverySnapshot = await deliveryRef.get();

    if (!deliverySnapshot.exists) {
      return res.status(404).json({
        success: false,
        message: "Delivery not found",
      });
    }

    // Ensure itemDescription is set correctly
    if (updateData.othersQuantity > 0 && !updateData.othersDescription) {
      return res.status(400).json({
        success: false,
        message: "Others description is required for 'Other'",
      });
    }

    // 👉 Handle file uploads
    const files = req?.files as any;
    const filePaths: any = {};
    // const basePath = path.join(__dirname, `../../public/delivery/${id}/`);
    const basePath = getDeliveryFolder(id);

    if (!fs.existsSync(basePath)) {
      fs.mkdirSync(basePath, { recursive: true });
    }

    // 👉 Handle signatureImage
    let signatureImage: string = "";
    if (files?.signatureImage) {
      const signatureFileName = files.signatureImage[0].originalname;
      // const signatureFilePath = path.join(basePath, signatureFileName);
      const deliveryFolder = getDeliveryFolder(id);
      const signatureFilePath = path.join(deliveryFolder, signatureFileName);

      // ❌ Delete existing file if exists
      if (fs.existsSync(signatureFilePath)) {
        fs.unlinkSync(signatureFilePath);
      }

      // ✅ Save new file
      fs.writeFileSync(signatureFilePath, files.signatureImage[0].buffer);

      signatureImage = getPublicPath(id, signatureFileName);
      filePaths.signatureImage = signatureImage;
    }
    let podImages: string[] = [];
    if (files?.podImage && Array.isArray(files.podImage)) {
      //@ts-ignore
      files.podImage.forEach((file, index) => {
        const fileName = `podImage${index + 1}.png`; // 👈 desired filename
        const deliveryFolder = getDeliveryFolder(id);
        // const filePath = path.join(basePath, fileName);
        const filePath = path.join(deliveryFolder, fileName);

        fs.writeFileSync(filePath, file.buffer);
        // podImages.push(`/public/delivery/${id}/${fileName}`);
        podImages.push(getPublicPath(id, fileName));
      });

      filePaths.podImages = podImages;
    }

    // 👉 Merge file paths into updateData
    Object.assign(updateData, filePaths);

    // 👉 Update delivery in Firestore
    await deliveryRef.update(updateData);

    if (req.body["deliveryStatus"] === "unavailable") {
      try {
        await db.collection("deliveries").doc(id).update({
          isAssigned: false,
          driverId: null,
        });
      } catch (error) {
        console.error(
          `Failed to update isAssigned for delivery ${req.body["id"]}:`,
          error
        );
        throw new Error(`Failed to update for delivery`);
      }

      const recipients = [
        req.body["email"],
        // "info@pharmahealth.net",
        // "avihendeles@gmail.com",
      ];

      sendEmail(
        recipients.join(","),
        "From PharmaHealth: Delivery failed",
        `<div class="container">
          <h2>Delivery Status Update</h2>
          <p>
            We regret to inform you that your delivery has been marked as 
            <strong style="color: red;">Unavailable</strong>.
          </p>
    
          <div class="details">
            <p><strong>Order Number:</strong> ${req.body["orderSerial"]}</p>
            <p><strong>Reason for Unavailability:</strong> ${req.body["unavailabilityReason"]}</p>
          </div>
    
          <div class="footer">
            <p>
              If you have any questions or need further assistance, please contact us at
              <a href="mailto:info@pharmahealth.net">info@pharmahealth.net</a>.
            </p>
            <p>&copy; 2025 PharmaHealth. All rights reserved.</p>
          </div>
        </div>`
      ).catch((error) => console.error("Failed to send email:", error));
    }

    if (req.body["deliveryStatus"] === "completed") {
      const attachments = [];
      if (signatureImage) {
        attachments.push(getAbsoluteFilePath(signatureImage));
      }

      if (podImages.length > 0) {
        attachments.push(...podImages.map(getAbsoluteFilePath));
      }

      const deliveryDoc = (
        await db.collection("deliveries").doc(id).get()
      ).data();

      const driverDoc = await db
        .collection("users")
        .doc(req.body["driverId"])
        .get();
      const driverName = driverDoc.data()?.name || "Unavailable";
      const emailBody = `
  <div class="container">
    <h2>Delivery Completed</h2>
    <p>Hello <strong>${deliveryDoc?.contactPersonName}</strong>,</p>
    <p>This is to confirm that the delivery to <strong>${
      deliveryDoc?.name
    }</strong> has been successfully completed. Below are the details of your delivery:</p>
    
    <div class="details">
      <p><strong>Order Number:</strong> ${deliveryDoc?.orderSerial}</p>
      ${
        deliveryDoc?.bagQuantity
          ? `<p><strong>Bag Quantity:</strong> ${deliveryDoc?.bagQuantity}</p>`
          : ""
      }
      ${
        deliveryDoc?.boxQuantity
          ? `<p><strong>Box Quantity:</strong> ${deliveryDoc?.boxQuantity}</p>`
          : ""
      }
      ${
        deliveryDoc?.envelopeQuantity
          ? `<p><strong>Envelope Quantity:</strong> ${deliveryDoc?.envelopeQuantity}</p>`
          : ""
      }
      ${
        deliveryDoc?.toteQuantity
          ? `<p><strong>Tote Quantity:</strong> ${deliveryDoc?.toteQuantity}</p>`
          : ""
      }
      ${
        deliveryDoc?.othersQuantity && deliveryDoc?.othersDescription
          ? `<p><strong>Description:</strong> ${deliveryDoc?.othersDescription}</p>`
          : ""
      }
      ${
        deliveryDoc?.othersQuantity
          ? `<p><strong>Quantity:</strong> ${deliveryDoc?.othersQuantity}</p>`
          : ""
      }
    
      <p><strong>Address:</strong> ${deliveryDoc?.address}</p>
      <p><strong>Contact Person:</strong> ${deliveryDoc?.contactPersonName}</p>
      <p><strong>Contact Phone:</strong> ${deliveryDoc?.contactPersonPhone}</p>
      <p><strong>Driver name:</strong> ${driverName}</p>

    </div>

    <div class="footer">
      <p>If you have any questions, feel free to contact us at 
        <a href="mailto:info@pharmahealth.net">info@pharmahealth.net</a>.
      </p>
      <p>&copy; 2025 PharmaHealth. All rights reserved.</p>
    </div>
  </div>
`;

      const recipients = [
        req.body["email"],
        // "info@pharmahealth.net",
        // "avihendeles@gmail.com",
      ];
      if (attachments.length > 0) {
        sendEmail(
          recipients.join(","),
          "From PharmaHealth: Delivery completed",
          emailBody,
          attachments
        ).catch((error) => console.error("Failed to send email:", error));
      }
    }

    res.status(200).json({
      success: true,
      message: "Delivery updated successfully",
      filePaths,
    });
  }
);

export async function getDeliveriesByUser(userId: string) {
  // Fetch all deliveries assigned to this user (driver) and sort by `updatedAt` in descending order
  const snapshot = await db
    .collection("deliveries")
    .where("driverId", "==", userId)
    .orderBy("createdAt", "desc") // <-- Sort by updatedAt in descending order
    .get();

  const deliveries = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return deliveries;
}

export const getDeliveriesByUserController = catchAsync(
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { cursor = null, orderSerial, deliveryStatus } = req.query;
    const pageSize = 10;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required" });
    }

    const whereList: any = [
      ["driverId", "==", userId],
      ["deliveryStatus", "==", "completed"],
    ];

    if (orderSerial) {
      whereList.push(["orderSerial", "==", orderSerial]);
    }
    // if (deliveryStatus) {
    //   whereList.push(["deliveryStatus", "==", deliveryStatus]);
    // }
    const result = await paginateCollection(db, {
      collection: "deliveries",
      pageSize,
      orderBy: ["updatedAt", "desc"],
      cursor: cursor as string,
      where: whereList,
      fetchingUnassignedDeliveries: false,
    });

    let countSnap = db.collection("deliveries").where("driverId", "==", userId);
    if (deliveryStatus) {
      countSnap = countSnap.where("deliveryStatus", "==", deliveryStatus);
    }
    if (orderSerial) {
      countSnap = countSnap.where("orderSerial", "==", orderSerial);
    }
    countSnap = countSnap.orderBy("createdAt", "desc");
    // .orderBy("createdAt", "desc") // <-- Sort by updatedAt in descending order
    const countSnapRes = await countSnap.count().get();
    const totalCount = countSnapRes.data().count;

    res.status(200).json({
      success: true,
      deliveries: result.items,
      nextCursor: result.nextCursor,
      hasNextPage: result.hasNextPage,
      totalCount,
    });
  }
);

export const deleteDelivery = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const deliveryRef = db.collection("deliveries").doc(id);
    const deliverySnapshot = await deliveryRef.get();

    if (!deliverySnapshot.exists) {
      return res
        .status(404)
        .json({ success: false, message: "Delivery not found" });
    }

    await deliveryRef.delete();

    res
      .status(200)
      .json({ success: true, message: "Delivery deleted successfully" });
  }
);

export const getUserDeliveryData = catchAsync(
  async (req: Request, res: Response) => {
    const { orderSerial } = req.params;
    if (!orderSerial) {
      return res.status(400).json({
        status: "fail",
        message: "Order serial is required",
      });
    }
    const deliverySnapshot = await db
      .collection("deliveries")
      .where("orderSerial", "==", orderSerial)
      .get();

    if (deliverySnapshot.empty) {
      return res.status(400).json({
        status: "fail",
        message: "Order serial is invalid",
      });
    }

    // Extract data from the snapshot
    let deliveryData = deliverySnapshot.docs.map((doc) => ({
      id: doc.id, // optional: include Firestore doc ID
      ...doc.data(),
    }));
    let driverData;

    //@ts-ignore
    if (deliveryData[0].driverId) {
      driverData =
        //@ts-ignore
        await db.collection("users").doc(deliveryData[0].driverId).get();
      driverData = driverData.data();
    }
    if (driverData) {
      driverData.driverName = driverData.name;
      driverData.driverEmail = driverData.email;
      driverData.driverPhone = driverData.phone;

      delete driverData.name;
      delete driverData.email;
      delete driverData.phone;
      delete driverData.password;
      delete driverData.isActive;
      delete driverData.createdAt;
      delete driverData.role;
    }
    const res1 = {
      ...driverData,
      ...deliveryData[0],
    };

    res.status(200).json({
      data: res1,
    });
  }
);

// async function setIsActiveStatus(userId: string) {
//   const deliveries = await getDeliveriesByUser(userId);
// const pendingDeliveries = deliveries.filter((delivery) => {
//   // console.log(delivery);

//   //@ts-ignore
//   return delivery.deliveryStatus === "pending";
// });
//   if (pendingDeliveries.length > 0) {
//     db.collection("users")
//       .doc(userId)
//       .update({
//         isActive: true,
//       })
//       .then(() => {
//         // Optional: Handle success (this runs asynchronously)
//         console.log("Driver activation initiated.");
//       })
//       .catch((error) => {
//         // Optional: Handle error (this runs asynchronously)
//         console.error("Error initiating driver activation:", error);
//       });
//   } else {
//     db.collection("users")
//       .doc(userId)
//       .update({
//         isActive: false,
//       })
//       .then(() => {
//         // Optional: Handle success (this runs asynchronously)
//         console.log("Driver activation initiated.");
//       })
//       .catch((error) => {
//         // Optional: Handle error (this runs asynchronously)
//         console.error("Error initiating driver activation:", error);
//       });
//   }
// }

// setIsActiveStatus("zOTwzEueSsn2yOZCos8b");

import { Request, Response } from "express";
import { db } from "../config/firebase";
import catchAsync from "../utils/catchAsync";
import fs from "fs";
import path from "path";
import { sendEmail } from "../config/sendEmail";
import generateOrderSerial from "../config/generateOrderSerial";
import { paginateCollection } from "../utils/firestorePagination";
import { DocumentData, Query } from "firebase-admin/firestore";

const normalizeNumber = (value: any): number => {
  return value ? Number(value) || 0 : 0;
};

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
    const recipients = [email];

    const emailBody = `
  <div class="container">
    <h2>Delivery Confirmation</h2>
    <p>Dear <strong>${contactPersonName}</strong>,</p>
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
        <a href="mailto:info@shippify.net">info@shippify.net</a>.
      </p>
      <p>&copy; 2025 Shippify. All rights reserved.</p>
    </div>
  </div>
`;

    sendEmail(
      recipients.join(","),
      "From Shippify: Delivery Confirmed",
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

// export const getDeliveries = catchAsync(async (req: Request, res: Response) => {
//   const snapshot = await db
//     .collection("deliveries")
//     .orderBy("createdAt", "desc") // Sort by createdAt in descending order (latest first)
//     .get();

//   const deliveries = snapshot.docs.map((doc) => ({
//     id: doc.id,
//     ...doc.data(),
//   }));

//   res.status(200).json({ success: true, deliveries });
// });

// export const getDeliveries = catchAsync(async (req: Request, res: Response) => {
//   const { cursor = null, orderSerial } = req.query;
//   const pageSize = 10;

//   // If searching by orderSerial, bypass pagination
//   if (orderSerial) {
//     const snapshot = await db
//       .collection("deliveries")
//       .where("orderSerial", "==", orderSerial)
//       .get();

//     const deliveries = snapshot.docs.map((doc) => ({
//       id: doc.id,
//       ...doc.data(),
//     }));

//     return res.status(200).json({
//       success: true,
//       deliveries,
//       nextCursor: null,
//       hasNextPage: false,
//     });
//   }

//   // Default paginated query
//   let deliveriesRef = db
//     .collection("deliveries")
//     .orderBy("createdAt", "desc")
//     .limit(pageSize + 1); // Fetch one extra to check if more exist

//   if (cursor) {
//     const cursorDoc = await db
//       .collection("deliveries")
//       .doc(cursor as string)
//       .get();
//     if (!cursorDoc.exists) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid cursor ID" });
//     }

//     deliveriesRef = deliveriesRef.startAfter(cursorDoc);
//   }

//   const snapshot = await deliveriesRef.get();
//   const docs = snapshot.docs;
//   const hasNextPage = docs.length > pageSize;
//   const trimmedDocs = hasNextPage ? docs.slice(0, pageSize) : docs;

//   const deliveries = trimmedDocs.map((doc) => ({
//     id: doc.id,
//     ...doc.data(),
//   }));

//   const nextCursor = hasNextPage
//     ? trimmedDocs[trimmedDocs.length - 1].id
//     : null;

//   res.status(200).json({
//     success: true,
//     deliveries,
//     nextCursor,
//     hasNextPage,
//   });
// });

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
  const result = await paginateCollection(db, {
    collection: "deliveries",
    pageSize,
    orderBy: ["createdAt", "desc"],
    cursor: cursor as string,
    // where: orderSerial ? [["orderSerial", "==", orderSerial]] : [],
    where: whereList,
    fetchingUnassignedDeliveries: false,
  });
  let countSnap: Query<DocumentData> = db.collection("deliveries");

  if (deliveryStatus) {
    countSnap = countSnap.where("deliveryStatus", "==", deliveryStatus);
  }
  if (orderSerial) {
    countSnap = countSnap.where("orderSerial", "==", orderSerial);
  }
  const countSnapRes = await countSnap.count().get();
  const totalCount = countSnapRes.data().count;
  res.status(200).json({
    success: true,
    deliveries: result.items,
    nextCursor: result.nextCursor,
    hasNextPage: result.hasNextPage,
    totalCount,
  });
});

// export const getUnAssignedDeliveries = catchAsync(
//   async (req: Request, res: Response) => {
//     const snapshot = await db
//       .collection("deliveries")
//       .where("isAssigned", "==", false)
//       .where("deliveryStatus", "!=", "completed")
//       .orderBy("deliveryStatus") // Firestore requires this when using "!="
//       .orderBy("createdAt", "desc") // Sort by latest createdAt
//       .get();

//     const deliveries = snapshot.docs.map((doc) => ({
//       id: doc.id,
//       ...doc.data(),
//     }));

//     res.status(200).json({ success: true, deliveries });
//   }
// );

export const getUnAssignedDeliveries = catchAsync(
  async (req: Request, res: Response) => {
    const { cursor = null, orderSerial } = req.query;
    const pageSize = 10;

    // Build the where conditions
    const whereList: any = [
      ["isAssigned", "==", false],
      ["deliveryStatus", "!=", "completed"],
    ];

    if (orderSerial) {
      whereList.push(["orderSerial", "==", orderSerial]);
    }

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
      .where("isAssigned", "==", false)
      .where("deliveryStatus", "!=", "completed")
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

    // console.log(
    //   req.body["bagQuantity"],
    //   req.body["boxQuantity"],
    //   req.body["envelopeQuantity"],
    //   req.body["toteQuantity"]
    // );

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    if (updateData.hasOwnProperty("isAssigned")) {
      updateData.isAssigned = Boolean(updateData.isAssigned);
    }

    // Set othersDescription to null if othersQuantity is 0
    if (
      updateData.hasOwnProperty("othersQuantity") &&
      updateData.othersQuantity === 0
    ) {
      updateData.othersDescription = null;
    }

    //When the driver accepts the delivery on driver side, set the isActive state in the db true for them
    // if (req.body["driverId"] && req.body["isAssigned"]) {
    //   // do not use setIsActive func here
    //   db.collection("users")
    //     .doc(req.body["driverId"])
    //     .update({
    //       isActive: true,
    //     })
    //     .then(() => {
    //       // Optional: Handle success (this runs asynchronously)
    //       console.log("Driver activation initiated.");
    //     })
    //     .catch((error) => {
    //       // Optional: Handle error (this runs asynchronously)
    //       console.error("Error initiating driver activation:", error);
    //     });
    // }
    // console.log(req.body["driverId"], req.body["isAssigned"]);
    // console.log("Delivery status", req.body["deliveryStatus"]);

    if (updateData.isAssigned && req.body["deliveryStatus"] !== "completed") {
      updateData["deliveryStatus"] = "pending";
      updateData["unavailabilityReason"] = null;
    }

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

    // if (updateData.itemType !== "Other") {
    //   updateData.itemDescription = null;
    // }

    // 👉 Handle file uploads
    const files = req?.files as any;
    const filePaths: any = {};
    const basePath = path.join(__dirname, `../../public/delivery/${id}/`);

    if (!fs.existsSync(basePath)) {
      fs.mkdirSync(basePath, { recursive: true });
    }

    // 👉 Handle signatureImage
    let signatureImage: string = "";
    if (files?.signatureImage) {
      const signatureFileName = files.signatureImage[0].originalname;
      const signatureFilePath = path.join(basePath, signatureFileName);

      // ❌ Delete existing file if exists
      if (fs.existsSync(signatureFilePath)) {
        fs.unlinkSync(signatureFilePath);
      }

      // ✅ Save new file
      fs.writeFileSync(signatureFilePath, files.signatureImage[0].buffer);

      // Store public URL
      signatureImage = `/public/delivery/${id}/${signatureFileName}`;
      filePaths.signatureImage = `/public/delivery/${id}/${signatureFileName}`;
    }

    // 👉 Handle podImage
    let podImage: string = "";
    if (files?.podImage) {
      const podFileName = files.podImage[0].originalname;
      const podFilePath = path.join(basePath, podFileName);

      // ❌ Delete existing file if exists
      if (fs.existsSync(podFilePath)) {
        fs.unlinkSync(podFilePath);
      }

      // ✅ Save new file
      fs.writeFileSync(podFilePath, files.podImage[0].buffer);

      // Store public URL
      podImage = `/public/delivery/${id}/${podFileName}`;
      filePaths.podImage = `/public/delivery/${id}/${podFileName}`;
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
        // "info@shippify.net",
      ];

      sendEmail(
        recipients.join(","),
        "From Shippify: Delivery failed",
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
               <a href="mailto:info@shippify.net">info@shippify.net</a>.
            </p>
            <p>&copy; 2025 Shippify. All rights reserved.</p>
          </div>
        </div>`
      ).catch((error) => console.error("Failed to send email:", error));

      // set the isActive status by calculating pending orders
      // setIsActiveStatus(req.body["driverId"]);
    }

    if (req.body["deliveryStatus"] === "completed") {
      const attachments = [];

      if (signatureImage) {
        attachments.push("." + signatureImage);
      }

      if (podImage) {
        attachments.push("." + podImage);
      }

      const recipients = [req.body["email"]];
      if (attachments.length > 0) {
        sendEmail(
          recipients.join(","),
          "From Shippify: Delivery completed",
          `Your delivery with ID ${id} is completed`,
          attachments
        ).catch((error) => console.error("Failed to send email:", error));
      }

      //set the isActive status by calculating pending orders
      // setIsActiveStatus(req.body["driverId"]);
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

    const whereList: any = [["driverId", "==", userId]];

    if (orderSerial) {
      whereList.push(["orderSerial", "==", orderSerial]);
    }
    if (deliveryStatus) {
      whereList.push(["deliveryStatus", "==", deliveryStatus]);
    }
    const result = await paginateCollection(db, {
      collection: "deliveries",
      pageSize,
      orderBy: ["createdAt", "desc"],
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
    // const deliveries = snapshot.docs.map((doc) => ({
    //   id: doc.id,
    //   ...doc.data(),
    // }));

    // // Fetch all deliveries assigned to this user (driver) and sort by `updatedAt` in descending order

    // res.status(200).json({ success: true, deliveries });
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
    // deleteDelivery = del
    let driverData;
    // console.log(deliveryData);

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

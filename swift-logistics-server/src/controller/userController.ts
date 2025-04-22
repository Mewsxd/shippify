import { Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import { db } from "../config/firebase";
import { getDeliveriesByUser } from "./deliveryController";
import pLimit from "p-limit";

export const createUser = catchAsync(async (req: Request, res: Response) => {
  const { name, email, phone, role, password } = req.body;

  // Check if a user with the same email already exists
  const existingUser = await db
    .collection("users")
    .where("email", "==", email)
    .get();

  if (!existingUser.empty) {
    return res.status(400).json({
      success: false,
      message: "User with this email already exists",
    });
  }

  // Create user document without ID first
  const newUser = {
    name,
    email,
    phone,
    role,
    password,
    isActive: true,
    createdAt: new Date(),
  };

  // Add the document to Firestore
  const userRef = await db.collection("users").add(newUser);

  // Update the document to include the `id` field
  await userRef.update({ id: userRef.id });

  res.status(201).json({
    success: true,
    message: "User created successfully",
    userId: userRef.id,
  });
});

export const getUserById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res
      .status(400)
      .json({ success: false, message: "User ID is required" });
  }

  const doc = await db.collection("users").doc(id).get();

  if (!doc.exists) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const user = { id: doc.id, ...doc.data() };

  res.status(200).json({ success: true, user });
});

export const getUsers = catchAsync(async (req: Request, res: Response) => {
  const snapshot = await db
    .collection("users")
    .where("isActive", "==", true)
    .get();
  const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  res.status(200).json({ success: true, users });
});

export const updateUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, phone, role, password } = req.body;

  const userRef = db.collection("users").doc(id);
  const userSnapshot = await userRef.get();

  if (!userSnapshot.exists) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  await userRef.update({
    name,
    email,
    phone,
    role,
    password,
    updatedAt: new Date(),
  });

  res.status(200).json({ success: true, message: "User updated successfully" });
});

export const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const userRef = db.collection("users").doc(id);
  const userSnapshot = await userRef.get();

  if (!userSnapshot.exists) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const deliveries = await getDeliveriesByUser(id);
  const pendingDeliveries = deliveries.filter((delivery) => {
    // console.log(delivery);

    //@ts-ignore
    return delivery.deliveryStatus === "pending";
  });
  // console.log(pendingDeliveries);
  // for (const delivery of pendingDeliveries) {
  //   await db.collection("deliveries").doc(delivery.id).update({
  //     isActive: false,
  //   });
  // }
  console.log(pendingDeliveries);

  await Promise.all(
    pendingDeliveries.map((delivery) => {
      db.collection("deliveries").doc(delivery.id).update({
        isAssigned: false,
        driverId: null,
      });
    })
  );
  await userRef.update({
    isActive: false,
    updatedAt: new Date(),
  });

  res.status(200).json({ success: true, message: "User deleted successfully" });
});

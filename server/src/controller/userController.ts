import { Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import { db } from "../config/firebase";
import argon2 from "argon2";
import { sendEmail } from "../config/sendEmail";

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
  const passwordHash = await argon2.hash(password);
  // Create user document without ID first
  const newUser = {
    name,
    email,
    phone,
    role,
    password: passwordHash,
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
    .where("isActive", "==", true) // Only retrieve active users
    .get();
  const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  res.status(200).json({ success: true, users });
});

export const updateUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, phone, role } = req.body;

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

  await userRef.update({
    isActive: false,
    updatedAt: new Date(), // Record deletion timestamp
  });

  res.status(200).json({ success: true, message: "User deleted successfully" });
});

export const resetUserPassword = catchAsync(
  async (req: Request, res: Response) => {
    const password = req.body.password;
    const { id } = req.params;

    if (!password) {
      return res
        .status(400)
        .json({ success: false, message: "Password is required" });
    }

    const passwordHash = await argon2.hash(password);
    const userRef = db.collection("users").doc(id);
    const userSnapshot = await userRef.get();

    if (!userSnapshot.exists) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const userData = userSnapshot.data();
    await userRef.update({
      password: passwordHash,
      updatedAt: new Date(),
    });
    if (userData) {
      await sendEmail(
        userData.email,
        "Password Reset Successfully",
        "Your password has been reset successfully."
      );
    }

    res
      .status(200)
      .json({ success: true, message: "Password reset successfully" });
  }
);

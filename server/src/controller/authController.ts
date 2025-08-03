import { Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import { db } from "../config/firebase";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../config/verifyAdminMiddleware";
import nodemailer from "nodemailer";
import argon2 from "argon2";

const SECRET_KEY = process.env.JWT_SECRET as string;

export const loginController = catchAsync(
  async (req: Request, res: Response) => {
    const email = req.body.email?.trim();
    const password = req.body.password?.trim();

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    try {
      // Fetch the document from Firestore
      const docRef = db.collection("admin").doc("4rDYJqb3qZV5VRQeRomb");
      const doc = await docRef.get();

      if (!doc.exists) {
        return res.status(404).json({ message: "Admin record not found" });
      }

      const data = doc.data();
      const passwordMatch = await argon2.verify(data?.password, password);
      if (data?.email === email && passwordMatch) {
        // Generate JWT token
        const token = jwt.sign(
          { email: data?.email, role: "admin" },
          SECRET_KEY,
          {
            expiresIn: "90d",
          }
        );

        return res
          .status(200)
          .cookie("deliverx-jwt", token, {
            maxAge: 1000 * 60 * 60 * 24 * 90, // Cookie expiration in milliseconds (1 hour)
            httpOnly: true, // Ensures the cookie is sent only over HTTP(S), not accessible via JavaScript
            secure: true, // Ensures the cookie is sent over HTTPS (use false for local development)
            sameSite: "none", // Prevents CSRF attacks by controlling when the cookie is sent
          })
          .json({
            status: "success",
          });
      } else {
        return res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (error) {
      console.error("Error logging in:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

export const logout = (req: Request, res: Response) => {
  console.log("Logging out");

  res.cookie("deliverx-jwt", "", {
    httpOnly: true, // Ensures the cookie is sent only over HTTP(S), not accessible via JavaScript
    secure: true, // Ensures the cookie is sent over HTTPS (use false for local development)
    sameSite: "none",
    expires: new Date(0), // Invalidate the cookie immediately
  });

  res.status(200).json({ success: true, message: "Logged out successfully" });
};

export const userLoginController = catchAsync(
  async (req: Request, res: Response) => {
    const email = req.body.email?.trim();
    const password = req.body.password?.trim();

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    try {
      // Query for user by email
      const userSnapshot = await db
        .collection("users")
        .where("email", "==", email)
        .get();

      if (userSnapshot.empty) {
        return res.status(404).json({ message: "User not found" });
      }

      const userData = userSnapshot.docs[0].data();

      if (userData.isActive === false) {
        return res.status(401).json({ message: "User is inactive" });
      }

      const id = userSnapshot.docs[0].id;

      //Check if password matches
      if (await argon2.verify(userData.password, password)) {
        // Generate JWT token
        const token = jwt.sign({ id, role: "driver" }, SECRET_KEY, {
          expiresIn: "90d",
        });

        return res
          .status(200)
          .cookie("deliverx-jwt", token, {
            maxAge: 1000 * 60 * 60 * 24 * 90, // 90 days
            httpOnly: true,
            secure: true,
            sameSite: "none",
          })
          .json({ data: userData, status: "success" });
      } else {
        return res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (error) {
      console.error("Error logging in:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

export const meDriverController = catchAsync(
  async (req: AuthRequest, res: Response) => {
    try {
      // Query for user by email
      const userSnapshot = await db.collection("users").doc(req.user.id).get();

      if (!userSnapshot.exists) {
        return res.status(404).json({ message: "User not found" });
      }

      const userData = userSnapshot.data();

      if (userData?.isActive === false) {
        res.cookie("deliverx-jwt", "", {
          httpOnly: true,
          secure: true, // Set to true if using HTTPS
          sameSite: "none",
          expires: new Date(0), // Invalidate the cookie immediately
        });
        return res.status(401).json({ message: "User is inactive" });
      }
      res.status(200).json({ data: userData });
    } catch (error) {
      console.error("Error logging in:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // false for TLS, true for SSL
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail2 = catchAsync(async (req: Request, res: Response) => {
  const { to, subject, text } = req.body;
  if (!to || !subject || !text) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }

  try {
    const info = await transporter.sendMail({
      from: `"MyApp" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
    });

    res.status(200).json({
      success: true,
      message: `Email sent: ${info.messageId}`,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ success: false, message: "Failed to send email" });
  }
});

//common endpoint for both driver and admin to login with
export const commonLoginController = catchAsync(
  async (req: Request, res: Response) => {
    const email = req.body.email?.trim();
    const password = req.body.password?.trim();
    // console.log("Hello");

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    try {
      // Query for user by email
      const userSnapshot = await db
        .collection("users")
        .where("email", "==", email)
        .get();

      if (userSnapshot.empty) {
        const docRef = db.collection("admin").doc("4rDYJqb3qZV5VRQeRomb");
        const doc = await docRef.get();

        if (!doc.exists) {
          return res.status(404).json({ message: "Admin record not found" });
        }

        const data = doc.data();

        if (data?.email === email && data?.password === password) {
          // Generate JWT token
          const token = jwt.sign(
            { email: data?.email, role: "admin" },
            SECRET_KEY,
            {
              expiresIn: "90d",
            }
          );
          return res
            .status(200)
            .cookie("deliverx-jwt", token, {
              maxAge: 1000 * 60 * 60 * 24 * 90, // Cookie expiration in milliseconds (1 hour)
              httpOnly: true, // Ensures the cookie is sent only over HTTP(S), not accessible via JavaScript
              secure: true, // Ensures the cookie is sent over HTTPS (use false for local development)
              sameSite: "none", // Prevents CSRF attacks by controlling when the cookie is sent
            })
            .json({
              data: {
                email: data?.email,
                role: "admin",
              },
              status: "success",
            });
        } else {
          return res.status(401).json({ message: "Invalid credentials" });
        }
      }

      const userData = userSnapshot.docs[0].data();

      if (userData.isActive === false) {
        return res.status(401).json({ message: "User is inactive" });
      }

      const id = userSnapshot.docs[0].id;

      if (await argon2.verify(userData?.password, password)) {
        // Generate JWT token
        const token = jwt.sign({ id, role: "driver" }, SECRET_KEY, {
          expiresIn: "90d",
        });

        return res
          .status(200)
          .cookie("deliverx-jwt", token, {
            maxAge: 1000 * 60 * 60 * 24 * 90, // 90 days
            httpOnly: true,
            secure: true,
            sameSite: "none",
          })
          .json({ data: userData, status: "success" });
      } else {
        return res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (error) {
      console.error("Error logging in:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

//common controller to check auth by jwt
export const meController = catchAsync(
  async (req: AuthRequest, res: Response) => {
    console.log(req.user);

    if (req.user.role === "admin") {
      return res.status(200).json({ ...req.user });
    } else {
      // Query for user by email
      const userSnapshot = await db.collection("users").doc(req.user.id).get();
      // console.log(userSnapshot);

      if (!userSnapshot.exists) {
        return res.status(404).json({ message: "User not found" });
      }

      const userData = userSnapshot.data();

      if (userData?.isActive === false) {
        res.cookie("deliverx-jwt", "", {
          httpOnly: true,
          secure: true, // Set to true if using HTTPS
          sameSite: "none",
          expires: new Date(0), // Invalidate the cookie immediately
        });
        return res.status(401).json({ message: "User is inactive" });
      }
      res.status(200).json({ ...userData });
    }
  }
);

export const resetAdminPasswordController = catchAsync(
  async (req: Request, res: Response) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ message: "New password and confirm password do not match" });
    }

    const docRef = (
      await db.collection("admin").doc("4rDYJqb3qZV5VRQeRomb").get()
    ).data();

    if (await argon2.verify(docRef?.password, currentPassword)) {
      const hashedPassword = await argon2.hash(newPassword);
      await db
        .collection("admin")
        .doc("4rDYJqb3qZV5VRQeRomb")
        .update({ password: hashedPassword });
      console.log("here 2");

      return res.status(200).json({
        status: "success",
        message: "Admin password reset successfully",
      });
    } else {
      return res
        .status(401)
        .json({ status: "failed", message: "Current password is incorrect" });
    }
  }
);

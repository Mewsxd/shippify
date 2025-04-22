import { Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import { db } from "../config/firebase";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../config/verifyAdminMiddleware";
import nodemailer from "nodemailer";

const SECRET_KEY =
  process.env.JWT_SECRET ||
  "6fc60a8703a30a7f8a70ab7a8b18662b936001f60cd3a6cb1bffd304cdbec2a8";

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

      if (data?.email === email && data?.password === password) {
        // Generate JWT token
        const token = jwt.sign(
          { email: data?.email, role: "admin" },
          SECRET_KEY,
          {
            expiresIn: "90d",
          }
        );

        return (
          res
            .status(200)
            .cookie("deliverx-jwt", token, {
              maxAge: 1000 * 60 * 60 * 24 * 90, // Cookie expiration in milliseconds (1 hour)
              httpOnly: true, // Ensures the cookie is sent only over HTTP(S), not accessible via JavaScript
              secure: true, // Ensures the cookie is sent over HTTPS (use false for local development)
              sameSite: "none", // Prevents CSRF attacks by controlling when the cookie is sent
            })
            // .cookie("deliverx-jwt", token, {
            //   maxAge: 1000 * 60 * 60 * 24 * 90, // 90 days in milliseconds
            //   httpOnly: true, // Good security practice, keeps cookie inaccessible to JavaScript
            //   secure: false, // Change to false since you're using http:// not https://
            //   sameSite: "lax", // Change to "lax" for local development
            // })
            .json({
              status: "success",
            })
        );
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
  res.cookie("deliverx-jwt", "", {
    httpOnly: true,
    secure: true, // Set to true if using HTTPS
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

      if (userData?.password === password) {
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

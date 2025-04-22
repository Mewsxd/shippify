import express, { Response } from "express";
import {
  loginController,
  logout,
  meDriverController,
  userLoginController,
} from "../controller/authController";
import { authenticateJWT, AuthRequest } from "../config/verifyAdminMiddleware";
export const authRoutes = express.Router();

authRoutes.get(
  "/me-admin",
  authenticateJWT,
  (req: AuthRequest, res: Response) => {
    // console.log("hello", req);
    res.status(200).json({ user: req.user });
  }
);

authRoutes.get("/me-driver", authenticateJWT, meDriverController);
authRoutes.post("/admin-login", loginController);
authRoutes.post("/logout", logout);
authRoutes.post("/driver-login", userLoginController);
// authRoutes.post("/send-email", sendEmail2);

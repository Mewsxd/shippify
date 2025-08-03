import express, { Response } from "express";
import {
  commonLoginController,
  loginController,
  logout,
  meController,
  meDriverController,
  resetAdminPasswordController,
  userLoginController,
} from "../controller/authController";
import {
  authenticateAdminJWT,
  authenticateDriverJWT,
  AuthRequest,
} from "../config/verifyAdminMiddleware";
export const authRoutes = express.Router();

//this is the route for the admin to get their details
authRoutes.get(
  "/me-admin",
  authenticateDriverJWT,
  (req: AuthRequest, res: Response) => {
    res.status(200).json({ user: req.user });
  }
);

//this is the route for the driver to get their details
authRoutes.get("/me", authenticateDriverJWT, meController);
authRoutes.get("/me-driver", authenticateDriverJWT, meDriverController);

authRoutes.post("/admin-login", loginController);
authRoutes.post("/logout", logout);
authRoutes.post("/driver-login", userLoginController);
authRoutes.post("/login", commonLoginController);
authRoutes.put(
  "/reset-admin-password",
  authenticateAdminJWT,
  resetAdminPasswordController
);

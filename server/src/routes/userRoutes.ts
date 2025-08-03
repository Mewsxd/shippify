import express from "express";
import {
  createUser,
  getUsers,
  updateUser,
  deleteUser,
  getUserById,
  resetUserPassword,
} from "../controller/userController";
import { validateRequest } from "../config/validateRequest";

const router = express.Router();

router.post(
  "/",
  validateRequest(["name", "email", "phone", "role", "password"]),
  createUser
);
router.get("/", getUsers);
router.get("/:id", getUserById);
router.put(
  "/:id",
  validateRequest(["name", "email", "phone", "role"]),
  updateUser
);
router.put(
  "/:id/reset-password",
  validateRequest(["password"]),
  resetUserPassword
);

router.patch("/:id", deleteUser);

export default router;

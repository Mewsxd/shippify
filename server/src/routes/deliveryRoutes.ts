import express from "express";
import {
  createDelivery,
  getDeliveries,
  updateDelivery,
  deleteDelivery,
  getDeliveryById,
  getUnAssignedDeliveries,
  getDeliveriesByUserController,
  getUserDeliveryData,
} from "../controller/deliveryController";
import { validateRequest } from "../config/validateRequest";
import multer from "multer";
import {
  authenticateAdminJWT,
  authenticateDriverJWT,
} from "../config/verifyAdminMiddleware";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Route for creating and retrieving all deliveries
router
  .route("/")
  .post(
    authenticateAdminJWT, // Only admins can create a delivery
    validateRequest([
      "companyId",
      "name",
      "address",
      "contactPersonName",
      "contactPersonPhone",
      "email",
    ]),
    createDelivery
  )
  .get(getDeliveries);

// Route to fetch unassigned deliveries (authentication temporarily disabled)
router.get("/getUnAssignedDeliveries", getUnAssignedDeliveries);

// Route to get, update, or delete a specific delivery by ID
router
  .route("/:id")
  .get(authenticateDriverJWT, getDeliveryById)
  .patch(
    authenticateDriverJWT,
    upload.fields([
      { name: "podImage", maxCount: 4 },
      { name: "signatureImage", maxCount: 1 },
    ]),
    updateDelivery
  )
  .delete(authenticateAdminJWT, deleteDelivery);

// Route to get all deliveries assigned to a specific user
router.get("/user/:userId", getDeliveriesByUserController);

// Route for users to track a delivery by its serial number
router.get("/track-delivery/:orderSerial", getUserDeliveryData);

export default router;

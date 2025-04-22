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
  authenticateJWT,
} from "../config/verifyAdminMiddleware";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router
  .route("/")
  .post(
    authenticateAdminJWT,
    validateRequest([
      "companyId",
      // "bagQuantity",
      // "boxQuantity",
      // "envelopQuantity",
      // "toteQuantity",
      // "othersQuantity",
      "name",
      "address",
      "contactPersonName",
      "contactPersonPhone",
      "email",
    ]),
    createDelivery
  )
  .get(getDeliveries);

router.get(
  "/getUnAssignedDeliveries",
  // authenticateJWT,
  getUnAssignedDeliveries
);

router
  .route("/:id")
  .get(authenticateJWT, getDeliveryById)
  .patch(
    authenticateJWT,
    upload.fields([
      { name: "podImage", maxCount: 1 },
      { name: "signatureImage", maxCount: 1 },
    ]),
    updateDelivery
  )
  .delete(authenticateAdminJWT, deleteDelivery);

router.get("/user/:userId", getDeliveriesByUserController);
router.get("/track-delivery/:orderSerial", getUserDeliveryData);

export default router;

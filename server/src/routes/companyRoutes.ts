import express from "express";
import {
  createCompany,
  deleteCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
} from "../controller/companyController";
import { validateRequest } from "../config/validateRequest";
import { authenticateAdminJWT } from "../config/verifyAdminMiddleware";

const router = express.Router();

router.post(
  "/",
  authenticateAdminJWT,
  validateRequest([
    "name",
    "address",
    "contactPersonPhone",
    "email",
    "contactPersonName",
  ]),
  createCompany
);
router.get("/", authenticateAdminJWT, getCompanies);
router.get("/:id", authenticateAdminJWT, getCompanyById);

router.put(
  "/:id",
  authenticateAdminJWT,
  validateRequest([
    "name",
    "address",
    "contactPersonPhone",
    "email",
    "contactPersonName",
  ]),
  updateCompany
);
router.delete("/:id", authenticateAdminJWT, deleteCompany);

export default router;

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

// Route to create a new company (admin only, with required fields validated)
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

// Route to get a list of all companies (admin only)
router.get("/", authenticateAdminJWT, getCompanies);

// Route to get a single company by ID (admin only)
router.get("/:id", authenticateAdminJWT, getCompanyById);

// Route to update a company by ID (admin only, with required fields validated)
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

// Route to delete a company by ID (admin only)
router.delete("/:id", authenticateAdminJWT, deleteCompany);

export default router;

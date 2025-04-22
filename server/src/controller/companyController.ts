import { Request, Response } from "express";
import { db } from "../config/firebase";
import catchAsync from "../utils/catchAsync";

export const createCompany = catchAsync(async (req: Request, res: Response) => {
  const {
    name,
    address,
    contactPersonPhone,
    // deliveryType,
    email,
    contactPersonName,
  } = req.body;

  const newCompany = {
    name,
    address,
    contactPersonPhone,
    contactPersonName,
    // deliveryType,
    email,
    createdAt: new Date(),
  };
  const companyRef = await db.collection("companies").add(newCompany);

  res.status(201).json({
    success: true,
    message: "Company created successfully",
    companyId: companyRef.id,
  });
});

export const getCompanies = catchAsync(async (req: Request, res: Response) => {
  const snapshot = await db.collection("companies").get();
  const companies = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  res.status(200).json({ success: true, companies });
});

export const getCompanyById = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Company ID is required" });
    }

    const doc = await db.collection("companies").doc(id).get();

    if (!doc.exists) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    }

    const company = { id: doc.id, ...doc.data() };

    res.status(200).json({ success: true, company });
  }
);

export const updateCompany = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, address, contactPersonPhone, email, contactPersonName } =
    req.body;

  const companyRef = db.collection("companies").doc(id);
  const companySnapshot = await companyRef.get();

  if (!companySnapshot.exists) {
    return res
      .status(404)
      .json({ success: false, message: "Company not found" });
  }

  await companyRef.update({
    id,
    name,
    address,
    contactPersonPhone,
    contactPersonName,
    email,
    updatedAt: new Date(),
  });

  res
    .status(200)
    .json({ success: true, message: "Company updated successfully" });
});

export const deleteCompany = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const companyRef = db.collection("companies").doc(id);
  const companySnapshot = await companyRef.get();

  if (!companySnapshot.exists) {
    return res
      .status(404)
      .json({ success: false, message: "Company not found" });
  }

  await companyRef.delete();

  res
    .status(200)
    .json({ success: true, message: "Company deleted successfully" });
});

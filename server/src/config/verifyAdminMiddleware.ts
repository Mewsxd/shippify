import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const SECRET_KEY =
  "6fc60a8703a30a7f8a70ab7a8b18662b936001f60cd3a6cb1bffd304cdbec2a8"; // Replace with a secure key

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateJWT = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = req.cookies?.["deliverx-jwt"];

  if (!token) {
    res.status(401).json({ message: "Unauthorized: No token provided" });
    return;
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);

    req.user = decoded; // Attach user data to request object
    next(); // ✅ Ensure next() is called after successful verification
  } catch (error) {
    res.status(403).json({ message: "Forbidden: Invalid token" });
  }
};

export const authenticateAdminJWT = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = req.cookies?.["deliverx-jwt"];

  if (!token) {
    res.status(401).json({ message: "Unauthorized: No token provided" });
    return;
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    //@ts-ignore
    if (decoded.role !== "admin") {
      res.status(403).json({ message: "Forbidden: Not a driver" });
    }

    req.user = decoded; // Attach user data to request object
    next(); // ✅ Ensure next() is called after successful verification
  } catch (error) {
    res.status(403).json({
      message:
        error instanceof Error ? error.message : "Forbidden: Invalid token",
    });
  }
};

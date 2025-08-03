import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET as string;

export interface AuthRequest extends Request {
  user?: any;
}

// to authenticate the driver
export const authenticateDriverJWT = (
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

// to authenticate the admin
export const authenticateAdminJWT = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = req.cookies?.["deliverx-jwt"];
  console.log("Admin");
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

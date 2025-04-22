import { Request, Response, NextFunction } from "express";

export const validateRequest = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    for (const field of fields) {
      if (req.body[field] === undefined) {
        res
          .status(400)
          .json({ success: false, message: `${field} is required` });
        return; // Ensure it exits after sending a response
      }
    }
    next(); // Call next only when validation passes
  };
};

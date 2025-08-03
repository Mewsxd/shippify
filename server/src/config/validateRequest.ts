/*
 * Middleware factory that validates the presence of specified fields in the request body.
 * Returns a middleware function that checks if each field exists;
 * if any are missing, responds with HTTP 400 and an error message.
 * Otherwise, it calls `next()` to proceed to the next middleware or route handler.
 */

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

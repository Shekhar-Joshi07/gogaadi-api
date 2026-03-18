import type { Request, Response } from "express";

import { updateUserPhone } from "../services/authService";
import { HttpError } from "../lib/httpError";

export const updateMyPhone = async (req: Request, res: Response) => {
  if (!req.authUser?.uid) {
    throw new HttpError(401, "Authenticated Firebase user is required.");
  }

  const { phone } = req.body as { phone?: string };

  if (!phone?.trim()) {
    throw new HttpError(400, "phone is required.");
  }

  const user = await updateUserPhone(req.authUser.uid, phone);

  res.status(200).json({
    user,
    needsPhone: !user.phone,
  });
};

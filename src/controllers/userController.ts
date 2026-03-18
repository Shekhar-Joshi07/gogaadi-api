import type { Request, Response } from "express";

import { getUserProfileByUid, updateUserPhone } from "../services/authService";
import { HttpError } from "../lib/httpError";

export const getUserProfile = async (req: Request, res: Response) => {
  const rawUid = req.params.uid;
  const uid = Array.isArray(rawUid) ? rawUid[0] : rawUid;

  if (!uid?.trim()) {
    throw new HttpError(400, "uid is required.");
  }

  const user = await getUserProfileByUid(uid);

  res.status(200).json({ user });
};

export const updateMyPhone = async (req: Request, res: Response) => {
  const { uid, phone } = req.body as { uid?: string; phone?: string };

  if (!uid?.trim()) {
    throw new HttpError(400, "uid is required.");
  }

  if (!phone?.trim()) {
    throw new HttpError(400, "phone is required.");
  }

  const user = await updateUserPhone(uid, phone);

  res.status(200).json({
    user,
    needsPhone: !user.phone,
  });
};

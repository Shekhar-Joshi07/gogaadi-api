import type { Request, Response } from "express";

import { syncGoogleUser, verifyFirebaseIdToken } from "../services/authService";
import { HttpError } from "../lib/httpError";

export const googleAuth = async (req: Request, res: Response) => {
  const { idToken } = req.body as { idToken?: string };

  if (!idToken) {
    throw new HttpError(400, "idToken is required.");
  }

  const decodedToken = await verifyFirebaseIdToken(idToken);
  const user = await syncGoogleUser(decodedToken);

  res.status(200).json({
    user,
    needsPhone: !user.phone,
  });
};

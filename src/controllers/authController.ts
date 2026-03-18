import type { Request, Response } from "express";

import { syncGoogleUser, type GoogleUserProfileInput } from "../services/authService";
import { HttpError } from "../lib/httpError";

export const googleAuth = async (req: Request, res: Response) => {
  const { user } = req.body as { user?: GoogleUserProfileInput };

  if (!user) {
    throw new HttpError(400, "user is required.");
  }

  const syncedUser = await syncGoogleUser(user);

  res.status(200).json({
    user: syncedUser,
    needsPhone: !syncedUser.phone,
  });
};

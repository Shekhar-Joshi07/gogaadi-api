import type { NextFunction, Request, Response } from "express";

import { verifyFirebaseIdToken } from "../services/authService";

export const authenticateFirebase = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authorization = req.header("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Missing Firebase bearer token." });
    return;
  }

  const idToken = authorization.replace("Bearer ", "").trim();

  try {
    const decodedToken = await verifyFirebaseIdToken(idToken);

    req.authUser = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      picture: decodedToken.picture,
    };

    next();
  } catch (error) {
    next(error);
  }
};

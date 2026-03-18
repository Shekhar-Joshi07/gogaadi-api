import { Router } from "express";

import { googleAuth } from "../controllers/authController";

const authRoutes = Router();

authRoutes.post("/google", googleAuth);

export default authRoutes;

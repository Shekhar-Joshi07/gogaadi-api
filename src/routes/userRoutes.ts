import { Router } from "express";

import { updateMyPhone } from "../controllers/userController";
import { authenticateFirebase } from "../middleware/authenticateFirebase";

const userRoutes = Router();

userRoutes.patch("/me/phone", authenticateFirebase, updateMyPhone);

export default userRoutes;

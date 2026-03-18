import { Router } from "express";

import { getUserProfile, updateMyPhone } from "../controllers/userController";

const userRoutes = Router();

userRoutes.get("/:uid", getUserProfile);
userRoutes.patch("/phone", updateMyPhone);

export default userRoutes;

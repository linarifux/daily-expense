import { Router } from "express";
import { registerUser, loginUser, logoutUser } from "../controllers/user.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { getCurrentUser } from "../controllers/user.controller.js";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

// Secured route - needs the bouncer (verifyJWT)
router.post("/logout", verifyJWT, logoutUser);
router.route("/me").get(verifyJWT, getCurrentUser);

export default router;
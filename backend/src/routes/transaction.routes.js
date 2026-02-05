import { Router } from "express";
import { 
    addTransaction, 
    getTransactions, 
    deleteTransaction 
} from "../controllers/transaction.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

// Apply verifyJWT middleware to ALL routes in this file
// This is cleaner than adding it to every single route line
router.use(verifyJWT); 

router.route("/")
    .get(getTransactions)
    .post(addTransaction);

router.route("/:id")
    .delete(deleteTransaction);

export default router;
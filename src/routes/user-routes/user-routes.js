// All user related routes are defined here...!

import express from "express";
import { handleLogIn,  handleSendEmail} from "../../controllers/user-controller/user-controller.js";
import { checkAuthenticated } from "../../middleware/custom-middleware.js";

const router = express.Router();



router.route('/login').post(handleLogIn);

router.route('/send/mail').post(handleSendEmail);


export default router;
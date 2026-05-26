import express from "express";

import {
  gmailWebhook,
  startWatch,
  handleApproval
} from "../controllers/gmail.controller.js";

const router = express.Router();


// WEBHOOK
router.post(
  "/webhook",
  gmailWebhook
);


// START WATCH
router.get(
  "/watch",
  startWatch
);

router.post(
  "/approval",
  handleApproval
);

export default router;
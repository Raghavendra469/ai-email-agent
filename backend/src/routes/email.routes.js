import express from "express";
import { getEmails } from "../controllers/email.controller.js";

const router = express.Router();

router.get("/", getEmails);

export default router;
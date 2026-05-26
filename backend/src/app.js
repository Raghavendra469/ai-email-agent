import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes.js";
import emailRoutes from "./routes/email.routes.js";
import "./workers/email.worker.js";
import gmailRoutes
from "./routes/gmail.routes.js";



const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

app.use("/auth", authRoutes);
app.use(
  "/gmail",
  gmailRoutes
);

app.get("/", (req, res) => {
  res.send("AI Email Agent Running");
});
app.get("/health", (req, res) => {

  res.json({

    status: "ok",

    service: "backend"

  });

});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
import express from "express";
import {
  googleAuth,
  googleAuthCallback,
} from "../../controllers/v1/auth.controllers";

const authRoutes = express.Router();

authRoutes.get("/google-auth", googleAuth);
authRoutes.get("/oauth2callback", googleAuthCallback);

export default authRoutes;

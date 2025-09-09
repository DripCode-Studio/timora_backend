import prisma from "../../lib/dbConnection";
import axios from "axios";
import type { Request, Response } from "express";

export const googleAuth = async (req: Request, res: Response) => {
  try {
    const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    const options = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      redirect_uri: process.env.GOOGLE_REDIRECT_URI || "",
      response_type: "code",
      scope:
        "openid email profile https://www.googleapis.com/auth/calendar.events",
      access_type: "offline",
      prompt: "consent",
    });
    res.redirect(`${rootUrl}?${options.toString()}`);
  } catch (error) {
    console.error("Error during Google authentication:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const googleAuthCallback = async (req: Request, res: Response) => {
  try {
    res.json({ message: "Google OAuth2 callback endpoint" });
  } catch (error) {
    console.error("Error during Google OAuth2 callback:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

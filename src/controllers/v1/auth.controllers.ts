import prisma from "../../lib/dbConnection";
import axios from "axios";
import type { Request, Response } from "express";
import { success } from "zod";

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
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Authorization code is missing",
        error: 400,
        data: null,
      });
    }

    const { data } = await axios.post("https://oauth2.googleapis.com/token", {
      code,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    });

    const { access_token, id_token, refresh_token } = data;

    // Fetch user info
    const userInfo = await axios.get(
      `https://www.googleapis.com/oauth2/v3/userinfo`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    res.status(200).json({
      success: true,
      message: "Google authentication successful",
      error: null,
      data: {
        user: userInfo.data,
        access_token,
        id_token,
        refresh_token,
      },
    });
  } catch (error) {
    console.error("Error during Google OAuth2 callback:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

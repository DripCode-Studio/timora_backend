import prisma from "../../lib/dbConnection";
import axios from "axios";
import type { Request, Response } from "express";
import { HttpError, generateExpireDateInSeconds } from "../../lib/utils";
import { generateAccessToken, generateRefreshToken } from "../../lib/jwt.utils";
import type { TokenPayload } from "../../types/auth.interface";
import { th } from "zod/locales";

const COOKIE_CONFIG = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: "/",
};

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
    res.status(500).json({ message: "Internal server error test" });
  }
};

export const googleAuthCallback = async (req: Request, res: Response) => {
  try {
    const { code } = req.query;

    if (!code) {
      throw new HttpError(
        "Authorization code is missing",
        "MissingAuthCodeError",
        400
      );
    }

    const { data } = await axios.post("https://oauth2.googleapis.com/token", {
      code,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    });

    const { access_token, refresh_token, expires_in } = data;

    const userInfo = await axios.get(
      `https://www.googleapis.com/oauth2/v3/userinfo`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const userExists = await prisma.user.findUnique({
      where: {
        email: userInfo.data.email,
      },
    });

    // If user does not exist, create a new user else update the exiting user access token and refresh token (if refresh token is present)
    if (!userExists) {
      const newUser = await prisma.user.create({
        data: {
          email: userInfo.data.email,
          role: "USER",
          name: userInfo.data.name,
          avatar: userInfo.data.picture,
        },
      });

      const payload: TokenPayload = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        avatar: newUser.avatar,
      };
      const jwt_accessToken = generateAccessToken(payload);
      const jwt_refreshToken = generateRefreshToken(payload);

      if (!newUser) {
        throw new HttpError(
          "Failed to create new user",
          "UserCreationError",
          500
        );
      }
      // Create Google tokens entry
      const googleTokens = await prisma.google_tokens.create({
        data: {
          userId: newUser.id,
          accessToken: access_token,
          refreshToken: refresh_token,
          expiryDate: expires_in,
        },
      });

      if (!googleTokens) {
        throw new HttpError(
          "Failed to create Google tokens",
          "GoogleTokensCreationError",
          500
        );
      }

      const newAccount = await prisma.account.create({
        data: {
          userId: newUser.id,
          refreshToken: jwt_refreshToken,
          expiryDate: generateExpireDateInSeconds(30),
        },
      });

      if (!newAccount || !googleTokens) {
        // delete the user if account creation fails
        await prisma.user.delete({
          where: {
            id: newUser.id,
          },
        });
        throw new HttpError(
          "Failed to create new account",
          "AccountCreationError",
          500
        );
      }

      const redirectUrl = process.env.FRONTEND_AUTH_CALLBACK_URL!;
      const url = new URL(redirectUrl);

      const token = generateAccessToken(payload);
      res.cookie("RefreshTokejn", jwt_refreshToken, COOKIE_CONFIG);
      url.searchParams.set("status", "success");
      url.searchParams.set("message", "Authentication successful");
      url.searchParams.set("token", jwt_accessToken);
      return res.redirect(url.toString());
    } else {
      const payload: TokenPayload = {
        id: userExists.id,
        email: userExists.email,
        name: userExists.name,
        role: userExists.role,
        avatar: userExists.avatar,
      };
      const jwt_accessToken = generateAccessToken(payload);
      const jwt_refreshToken = generateRefreshToken(payload);

      const userAccount = await prisma.account.update({
        where: {
          userId: userExists.id,
        },
        data: {
          refreshToken: jwt_refreshToken,
          expiryDate: generateExpireDateInSeconds(30),
        },
      });

      if (!userAccount) {
        throw new HttpError(
          "Failed to update user account (refresh token)",
          "AccountUpdateError",
          500
        );
      }

      const updatedGoogleTokens = await prisma.google_tokens.updateMany({
        where: {
          userId: userExists.id,
        },
        data: {
          accessToken: access_token,
          expiryDate: expires_in,
          refreshToken: refresh_token,
        },
      });

      if (updatedGoogleTokens.count === 0) {
        throw new HttpError(
          "Failed to update Google Tokens",
          "GoogleTokensUpdateError",
          500
        );
      }

      const redirectUrl = process.env.FRONTEND_AUTH_CALLBACK_URL!;
      const url = new URL(redirectUrl);

      res.cookie("refreshToken", jwt_refreshToken, COOKIE_CONFIG);
      url.searchParams.set("status", "success");
      url.searchParams.set("message", "Authentication successful");
      url.searchParams.set("token", jwt_accessToken);
      return res.redirect(url.toString());
    }
  } catch (error) {
    console.error("Error during Google OAuth callback:", error);
    const e =
      error instanceof HttpError
        ? error
        : new HttpError("An unexpected error occurred", "UnknownError", 500);

    const fallbackUrl =
      process.env.FRONTEND_AUTH_CALLBACK_URL ||
      "http://localhost:5173/auth-callback";

    try {
      const url = new URL(fallbackUrl);
      url.searchParams.set("status", "error");
      url.searchParams.set("error", e.name);
      url.searchParams.set("message", e.message);
      url.searchParams.set("code", String((e as any).status ?? 500));
      url.searchParams.set("source", "google_oauth_callback");

      return res.redirect(url.toString());
    } catch {
      // Fallback to JSON if the URL is invalid
      return res.status((e as any).status ?? 500).json({
        success: false,
        error: { name: e.name, message: e.message },
        data: null,
      });
    }
  }
};

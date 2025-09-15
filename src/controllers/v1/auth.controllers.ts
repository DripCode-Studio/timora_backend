import prisma from "../../lib/dbConnection";
import axios from "axios";
import type { Request, Response } from "express";
import { HttpError } from "../../lib/utils";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";

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

    const userExists = await prisma.users.findUnique({
      where: {
        email: userInfo.data.email,
      },
    });

    // If user does not exist, create a new user else update the exiting user access token and refresh token (if refresh token is present)
    if (!userExists) {
      const newUser = await prisma.users.create({
        data: {
          email: userInfo.data.email,
          role: "USER",
          name: userInfo.data.name,
          avatar: userInfo.data.picture,
        },
      });

      if (!newUser) {
        throw new HttpError(
          "Failed to create new user",
          "UserCreationError",
          500
        );
      }

      if (newUser) {
        const newAccount = await prisma.accounts.create({
          data: {
            userId: newUser.id,
            googleId: userInfo.data.sub,
            refresh_token: refresh_token,
            access_token: access_token,
          },
        });

        if (!newAccount) {
          // delete the user if account creation fails
          await prisma.users.delete({
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

        // creating user session later (better-auth or passport or JWT)

        // send refresh_token in httpOnly cookie
        // res.cookie("refresh_token", refresh_token, {
        //   httpOnly: true,
        //   secure: process.env.NODE_ENV === "production",
        //   sameSite: "strict",
        //   maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        // });

        // Redirect to frontend with success message and user info
        const redirectUrl =
          process.env.FRONTEND_AUTH_CALLBACK_URL ||
          "http://localhost:5173/auth-callback";
        const url = new URL(redirectUrl);
        const payload = {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          avatar: newUser.avatar,
        };
        const options: SignOptions = {
          expiresIn: "7d",
        };
        const serverSecret = process.env.JWT_SECRET as string;
        const token = jwt.sign(payload, serverSecret, options);
        url.searchParams.set("status", "success");
        url.searchParams.set("message", "Authentication successful");
        url.searchParams.set("token", token);
        return res.redirect(url.toString());
      }
    } else {
      // update user account info in Account model
      const updatedAccount = await prisma.accounts.updateMany({
        where: {
          userId: userExists.id,
        },
        data: {
          access_token: access_token,
          // only update refresh token if it is present in the response
          ...(refresh_token && { refresh_token: refresh_token }),
        },
      });

      if (updatedAccount.count === 0) {
        throw new HttpError(
          "Failed to update account",
          "AccountUpdateError",
          500
        );
      }
      // creating user session later (better-auth or passport or JWT)

      // send refresh_token in httpOnly cookie
      // res.cookie("refresh_token", refresh_token, {
      //   httpOnly: true,
      //   secure: process.env.NODE_ENV === "production",
      //   sameSite: "strict",
      //   maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      // });

      // Redirect to frontend with success message and user info
      const redirectUrl =
        process.env.FRONTEND_AUTH_CALLBACK_URL ||
        "http://localhost:5173/auth-callback";
      const url = new URL(redirectUrl);
      const payload = {
        id: userExists.id,
        email: userExists.email,
        name: userExists.name,
        role: userExists.role,
        avatar: userExists.avatar,
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET!, {
        expiresIn: "30d",
      });
      url.searchParams.set("status", "success");
      url.searchParams.set("message", "Authentication successful");
      url.searchParams.set("token", token);
      return res.redirect(url.toString());
    }
  } catch (error) {
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
    console.error(e.message);
  }
};

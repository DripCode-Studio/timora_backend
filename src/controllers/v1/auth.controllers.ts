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
    res.status(500).json({ message: "Internal server error test" });
  }
};

export const googleAuthCallback = async (req: Request, res: Response) => {
  try {
    const { code } = req.query;

    if (!code) {
      throw new Error("Authorization code is missing");
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
        throw new Error("Failed to create new user");
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
          return res.status(500).json({
            success: false,
            message: "Failed to create new account",
            error: 500,
            data: null,
          });
        } else {
          return res.status(200).json({
            success: true,
            message: "User created successfully",
            error: null,
            data: {
              id: newUser.id,
              email: newUser.email,
              name: newUser.name,
              role: newUser.role,
            },
          });
        }
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
        return res.status(500).json({
          success: false,
          message: "Failed to update account",
          error: 500,
          data: null,
        });
      } else {
        return res.status(200).json({
          success: true,
          message: "User logged in successfully",
          error: null,
          data: {
            id: userExists.id,
            email: userExists.email,
            name: userExists.name,
            role: userExists.role,
          },
        });
      }
    }

    // creating user session later (better-auth or passport or JWT)

    // send refresh_token in httpOnly cookie
    // res.cookie("refresh_token", refresh_token, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === "production",
    //   sameSite: "strict",
    //   maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    // });
  } catch (error) {
    console.error("Error during Google OAuth2 callback:", error);
    res.status(500).json({ message: "Internal server error " + error });
  }
};

import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/jwt.utils";
import prisma from "../lib/dbConnection";

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Authorization header missing" });
    }

    const token = authHeader.split(" ")[1] as string;
    const decodeToken = verifyToken(token, process.env.JWT_SECRET!);

    const isUserValid = prisma.user.findUnique({
      where: { id: decodeToken.id },
    });

    if (!isUserValid) {
      return res
        .status(401)
        .json({ message: "User associated with token not found" });
    }

    next();

    if (!token) {
      return res.status(401).json("No Auth Tokne found");
    }
  } catch (err: any) {
    if (err.name == "TokenExpiredError") {
      return res.status(401).json({ message: "Your token has expired" });
    } else if (err.name == "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    return res.status(401).json({
      message: "Erroring during the Auth middleware verification" + err.message,
    });
  }
};

export default authMiddleware;

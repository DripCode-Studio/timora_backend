import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/v1/auth.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8001;

const allowedOrigins = [
  process.env.DEV_FRONTEND_URL || "http://localhost:5173",
  process.env.PROD_FRONTEND_ORIGIN || "https://yourdomain.com",
];
// const corsOptions = {
//   origin: (
//     origin: string | undefined,
//     callback: (err: Error | null, allow?: boolean) => void
//   ) => {
//     if (
//       !origin ||
//       allowedOrigins.includes(origin) ||
//       /\.yourdomain\.com$/.test(origin)
//     ) {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   credentials: true,
//   optionsSuccessStatus: 200,
// };

const corsOptions = {
  origin: "http://localhost:5173/",
  // credentials: true,
  optionsSuccessStatus: 200,
};

// Middleware
// app.use(helmet());
app.use(morgan("dev"));
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

app.use("/api/v1/auth", authRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

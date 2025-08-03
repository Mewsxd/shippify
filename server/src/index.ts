import express, { Request, Response } from "express";
import cors from "cors";
import userRoutes from "./routes/userRoutes";
import companyRoutes from "./routes/companyRoutes";
import deliveryRoutes from "./routes/deliveryRoutes";
import { authRoutes } from "./routes/authRoutes";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";

const PORT = process.env.PORT || 3001;
const app = express();

const isProd = process.env.NODE_ENV === "production";

const staticPath = path.join(__dirname, "../public");
app.use("/public", express.static(staticPath));

app.use(morgan("dev"));

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, TypeScript + Express!");
});

app.listen(PORT, () => {
  console.log(`Server is running in at http://localhost:${PORT}`);
});

app.use(
  cors({
    origin: [
      process.env.ADMIN_URL as string,
      process.env.DRIVER_URL as string,
      process.env.HOME_URL as string,
      process.env.PHONE_APP_URL as string,
    ],
    credentials: true, // Allow cookies and authentication headers
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"], // Allowed methods
  })
);

app.options(
  "*",
  cors({
    origin: [
      process.env.ADMIN_URL as string,
      process.env.DRIVER_URL as string,
      process.env.HOME_URL as string,
      process.env.PHONE_APP_URL as string,
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser()); // ✅ Required to read cookies
app.use("/api/users", userRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/auth", authRoutes);

export default app;

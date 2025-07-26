import express, { Request, Response } from "express";
import cors from "cors";
import userRoutes from "./routes/userRoutes";
import companyRoutes from "./routes/companyRoutes";
import deliveryRoutes from "./routes/deliveryRoutes";
import { authRoutes } from "./routes/authRoutes";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";
import cron from "node-cron";
const PORT = process.env.PORT || 3000;
const app = express();

app.use("/public", express.static(path.join(__dirname, "../public")));
app.use(express.json());
app.use(morgan("dev"));
app.use(cookieParser()); // ✅ Required to read cookies

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, TypeScript + Express!");
});

app.listen(PORT, () => {
  console.log(`Server is running in at http://localhost:${PORT}`);
});

app.use(
  cors({
    origin: [
      //@ts-ignore
      process.env.ADMIN_URL,
      //@ts-ignore
      process.env.DRIVER_URL,
      //@ts-ignore
      process.env.HOME_URL,
    ],
    credentials: true, // Allow cookies and authentication headers
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"], // Allowed methods
  })
);

app.options("*", cors()); // Handle preflight requests globally

app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/auth", authRoutes);

export default app;

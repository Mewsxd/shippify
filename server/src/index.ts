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

// const origin =
//   process.env.NODE_ENV === "production"
//     ? [
//         "https://visionary-tarsier-d321c7.netlify.app",
//         "https://tourmaline-frangollo-803134.netlify.app",
//       ]
//     : ["http://localhost:5173", "http://localhost:5174"];

app.use(
  cors({
    // origin: [
    //   "http://localhost:5173",
    //   "http://localhost:5174",
    //   "http://localhost:5175",
    // ], // Allow both ports 5173 and 5174
    // origin: [
    //   "https://visionary-tarsier-d321c7.netlify.app",
    //   "https://tourmaline-frangollo-803134.netlify.app",
    // ],
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

cron.schedule("*/5 * * * *", async () => {
  try {
    const response = await fetch("https://render-wakeup-bot.onrender.com/ping");
    if (!response.ok) {
      throw new Error(
        `API call failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
  } catch (error) {
    console.error("Error calling API:", error);
  }
});

app.get("/api/ping", (req: Request, res: Response) => {
  res.status(200).json({ message: "pong" });
});

app.use("/api/users", userRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/auth", authRoutes);

// sendEmail(
//   "mmuzammil1593@gmail.com",
//   "From DeliverX: Delivery completed",
//   `Your delivery with ID ZnBInznonOZ0 is completed`,
//   [
//     "./public/delivery/nBXYxmEKXqthndS80G9A/signature.png",
//     "./public/delivery/nBXYxmEKXqthndS80G9A/podImage.png",
//   ]
// );
// sendEmail("mmuzammil1593@gmail.com", "Never kill yourself", "HELLOOOO");
// Login endpoint
// generateOrderSerial();
export default app;

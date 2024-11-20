import express from "express";
import { connectToDB } from "./db/db.js";
import { config } from "dotenv";
import cors from "cors";
import NodeCron from "node-cron";
import { setTopEarnerUser } from "./controller/global.js";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { connectToS3Client } from "./utils/s3.js";
import helmet from "helmet"; 
import userRoute from "./routes/user.route.js";
import program from "./routes/program.route.js";
import globalRoute from "./routes/global.route.js";
import lottery from "./routes/lottery.route.js";
import miningRoute from "./routes/mining.route.js";
import { initCache } from "./utils/cache.js";
import billionaire from "./routes/billionaire.route.js";

config();
const app = express();
const PORT = process.env.PORT || 80;

// Initialize services
initCache();
connectToDB();
connectToS3Client();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add security headers using helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 31536000, 
      includeSubDomains: true,
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "same-origin" },
  })
);
app.use(helmet.frameguard())
// Add Permissions-Policy header explicitly
app.use((req, res, next) => {
  res.setHeader(
    "Permissions-Policy",
    "geolocation=(self), microphone=(), camera=(), fullscreen=(self), payment=()"
  );
  next();
});

// Routes
app.use("/user", userRoute);
app.use("/global", globalRoute);
app.use("/program", program);
app.use("/lottery", lottery);
app.use("/mining", miningRoute);
app.use("/billionaire", billionaire);

app.get("/", (req, res) => {
  return res.status(200).json({ msg: "Service is ok" });
});

// Socket.IO setup
const server = http.createServer(app);
const io = new SocketIOServer(server);
let userCount = 0;

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  userCount++;
  io.emit("user-count", { userCount });

  socket.on("disconnect", () => {
    userCount--;
    console.log("User disconnected. Active users:", userCount);
    io.emit("user-count", { userCount });
  });
});

// Schedule a cron job
NodeCron.schedule("0 6 * * *", async () => {
  try {
    await setTopEarnerUser();
    console.log("Cron job running at 6 AM");
  } catch (error) {
    console.error("Error in cron job:", error);
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`Server started listening on port ${PORT}`);
});
import express from "express";

import cors from "cors";

import http from "http";

import helmet from "helmet"; 


const app = express();
const PORT =  80;



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

app.get("/", (req, res) => {
  return res.status(200).json({ msg: "Service is ok" });
});

// Socket.IO setup
const server = http.createServer(app);





// Start server
server.listen(PORT, () => {
  console.log(`Server started listening on port ${PORT}`);
});

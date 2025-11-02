const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");
require("dotenv").config();

const app = express();

// Security middleware - configure helmet for static files
// Disable Helmet in development for easier local testing
if (process.env.NODE_ENV === "production") {
  app.use(helmet());
} else {
  // Minimal security in development
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );
}

// CORS - Allow all origins in development for mobile access
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // In development, allow all origins for easier mobile testing
      if (process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }

      // List of allowed origins for production
      const allowedOrigins = [
        "http://localhost:3000",
        "http://localhost:5501",
        "http://127.0.0.1:5501",
        "http://0.0.0.0:5501",
        process.env.FRONTEND_URL,
      ].filter(Boolean); // Remove undefined values

      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        allowedOrigins.some((allowed) => origin.includes(allowed))
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use("/api/", limiter);

// Body parser middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Routes
app.use("/api/products", require("./routes/products"));
app.use("/api/inquiries", require("./routes/inquiries"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/contact", require("./routes/contact"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "ARK Hygiene API is running",
    timestamp: new Date().toISOString(),
  });
});

// Serve static files from parent directory (where HTML files are)
// This allows serving admin.html, index.html, etc.
const parentDir = path.join(__dirname, "..");
app.use(express.static(parentDir, {
  extensions: ['html', 'htm'],
  index: false,
  dotfiles: 'ignore'
}));

// Explicitly serve HTML files
app.get("/admin.html", (req, res) => {
  res.sendFile(path.join(parentDir, "admin.html"));
});

app.get("/index.html", (req, res) => {
  res.sendFile(path.join(parentDir, "index.html"));
});

app.get("/", (req, res) => {
  res.sendFile(path.join(parentDir, "index.html"));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// 404 handler for API routes (after static files)
app.use("/api/*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

// Database connection (optional - won't exit if MongoDB is not available)
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/ark-hygiene", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    // Initialize admin user if needed
    require("./config/initAdmin")();
  })
  .catch((err) => {
    console.warn("⚠️  MongoDB connection warning:", err.message);
    console.log("💡 Server will continue without database. Some features may not work.");
    // Don't exit - allow server to run without MongoDB for basic file serving
  });

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0"; // Listen on all interfaces for mobile access

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 API URL: http://localhost:${PORT}/api`);
  console.log(`🌐 Network URL: http://192.168.100.40:${PORT} (use this for mobile)`);
});

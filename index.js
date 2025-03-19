const express = require("express");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const crypto = require("crypto");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const WebSocket = require('ws');
// const cors = require('cors');

dotenv.config();
const app = express();
// app.use(cors({ 
//   origin: 'https://pandemic-insights-and-prepareness-hub.vercel.app', // Allow your frontend URL
//   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
//   credentials: true
// }));
// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("Uploads folder created:", uploadsDir);
}

// Middleware
app.use(express.json());
// app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "public")));

// Multer Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

// MongoDB Setup
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost/pandemic")
  .then(() => console.log("Database is ready..!"))
  .catch((err) => console.log("MongoDB connection error:", err));

  const HospitalSchema = new mongoose.Schema({
    name: String,
    latitude: Number,
    longitude: Number,
    status: { type: String, default: 'Normal' },
    alerts: [{ userEmail: String, message: String, timestamp: Date }]
});
const Hospital = mongoose.model('Hospital', HospitalSchema);
// MongoDB Schemas & Models
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String },
  username: { type: String },
  photo: { type: String },
  phone: { type: String },
  dob: { type: Date },
  resetOtp: { type: String },
  resetOtpExpiry: { type: Date },
  volunteerData: [
    {
      orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization" },
      status: {
        type: String,
        enum: ["pending", "accepted"],
        default: "pending",
      },
      tasks: [
        { description: String, assignedAt: { type: Date, default: Date.now } },
      ],
      hours: { type: Number, default: 0 },
      contributions: { type: Number, default: 0 },
    },
  ],
  tasksCompleted: { type: Number, default: 0 },
  isOrgHead: { type: Boolean, default: false },
});
const User = mongoose.model("User", userSchema);

const counterSchema = new mongoose.Schema({
  modelName: { type: String, required: true },
  currentId: { type: Number, default: 0 },
});
const Counter = mongoose.model("Counter", counterSchema);

const requestSchema = new mongoose.Schema({
  request_id: { type: Number, required: true, unique: true },
  name: { type: String, required: false },
  contactInformation: { type: String, required: false },
  requestType: { type: String, required: false },
  description: { type: String, required: false },
  quantity: { type: Number, required: false },
  location: { type: String, required: false },
  userEmail: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, required: false },
});
const Request = mongoose.model("Request", requestSchema);

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  location: { type: String },
  description: { type: String },
  logo: { type: String },
  cover: { type: String },
  category: { type: String, enum: ["NGO", "Hospital", "Org"], default: "Org" },
  volunteerRequirements: { type: Number, default: 0 },
  volunteers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  projects: [
    {
      name: String,
      description: String,
      date: Date,
      fundsRaised: { type: Number, default: 0 },
    },
  ],
  creator: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});
const Organization = mongoose.model("Organization", organizationSchema);

const resourceSchema = new mongoose.Schema({
  type: String,
  available: Number,
  status: String,
});
const Resource = mongoose.model("Resource", resourceSchema);

const donationSchema = new mongoose.Schema({
  type: String,
  quantity: Number,
  location: String,
  contact: String,
  status: String,
  createdAt: Date,
});
const Donation = mongoose.model("Donation", donationSchema);

let otpStorage = {};

// Nodemailer Setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
});
app.set("views", path.join(__dirname, "views"));
// Routes
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "/views/home.html"))
);
app.get("/stats", (req, res) =>
  res.sendFile(path.join(__dirname, "/views/stats.html"))
);
app.get("/login", (req, res) =>
  res.sendFile(path.join(__dirname, "/views/log-in.html"))
);
app.get("/signup", (req, res) =>
  res.sendFile(path.join(__dirname, "/views/sign-up.html"))
);
app.get("/request", (req, res) =>
  res.sendFile(path.join(__dirname, "/views/request.html"))
);
app.get("/firstPage", (req, res) =>
  res.sendFile(path.join(__dirname, "/views/firstPage.html"))
);
app.get("/admin", (req, res) =>
  res.sendFile(path.join(__dirname, "/views/manageRequest.html"))
);
app.get("/pandamic", (req, res) =>
  res.sendFile(path.join(__dirname, "/views/pandamic.html"))
);
app.get("/map", (req, res) =>
  res.sendFile(path.join(__dirname, "/views/map.html"))
);
app.get("/profile", (req, res) =>
  res.sendFile(path.join(__dirname, "/views/updateProfile.html"))
);
app.get("/organizations", (req, res) =>
  res.sendFile(path.join(__dirname, "/views/organizations.html"))
);
app.get("/org-dashboard", (req, res) =>
  res.sendFile(path.join(__dirname, "/views/org-dashboard.html"))
);
app.get("/user-dashboard", (req, res) =>
  res.sendFile(path.join(__dirname, "/views/user-dashboard.html"))
);
app.get("/hospital-dashboard", (req, res) =>
  res.sendFile(path.join(__dirname, "/views/hospital-dashboard.html"))
);

const allowedEmails = [
  "sunilnp@acem.edu.in",
  "ofcsatyam007@gmail.com",
  "vanshajs11@gmail.com",
];
app.get('/hospital-dashboard', (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.redirect('/login');
  try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (allowedEmails.includes(decoded.email)) {
          res.sendFile(path.join(__dirname, '/views/hospital-dashboard.html'));
      } else {
          res.status(403).send('Access denied.');
      }
  } catch (error) {
      res.redirect('/login');
  }
});
app.get('/admin', (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.redirect('/login');
  try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (allowedEmails.includes(decoded.email)) {
          res.sendFile(path.join(__dirname, '/views/manageRequest.html'));
      } else {
          res.status(403).send('Access denied.');
      }
  } catch (error) {
      res.redirect('/login');
  }
});
app.get('/api/hospitals', async (req, res) => {
  const hospitals = await Hospital.find();
  res.json(hospitals);
});

// WebSocket Server
const server = app.listen(5000, () => console.log('Server running on port 5000'));
const wss = new WebSocket.Server({ server });

let hospitalClients = [];

wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', async (message) => {
      const data = JSON.parse(message);
      
      if (data.type === 'alert') {
          const { hospitalId, userEmail, alertMessage } = data;
          const hospital = await Hospital.findById(hospitalId);
          if (hospital) {
              hospital.alerts.push({ userEmail, message: alertMessage, timestamp: new Date() });
              hospital.status = 'Alerted';
              await hospital.save();

              hospitalClients.forEach(client => {
                  if (client.readyState === WebSocket.OPEN) {
                      client.send(JSON.stringify({
                          type: 'alert',
                          hospitalId,
                          alert: { userEmail, message: alertMessage, timestamp: new Date() }
                      }));
                  }
              });
          }
      } else if (data.type === 'hospital-connect') {
          hospitalClients.push(ws);
          ws.on('close', () => {
              hospitalClients = hospitalClients.filter(client => client !== ws);
          });
      }
  });

  ws.on('close', () => console.log('Client disconnected'));
});

function authMiddleware(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
  } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
  }
}
app.get("/check-email", (req, res) => {
  try {
      const userEmail = req.headers["x-user-email"];
      const token = req.headers["authorization"]?.replace('Bearer ', '');
      console.log('Checking email:', userEmail, 'Token:', token);

      if (!userEmail) {
          console.log('Email header missing');
          return res.status(400).send("Email header is missing.");
      }

      // Check if email is in allowed list
      if (allowedEmails.includes(userEmail)) {
          console.log('Access granted via email check:', userEmail);
          return res.status(200).send("Access granted.");
      }

      // If token provided, validate it
      if (token) {
          try {
              const decoded = jwt.verify(token, process.env.JWT_SECRET);
              const user = User.findById(decoded.userId);
              if (user && user.email === userEmail) {
                  console.log('Access granted via JWT:', userEmail);
                  return res.status(200).send("Access granted.");
              }
          } catch (err) {
              console.log('Invalid token:', err.message);
          }
      }

      console.log('Access denied for:', userEmail);
      return res.status(403).send("Access denied.");
  } catch (error) {
      console.error("Error verifying email:", error);
      res.status(500).send("Server error");
  }
});

// Resource Routes
async function seedResources() {
  await Resource.deleteMany({});
  await Resource.insertMany([
    { type: "medical", available: 50, status: "in_stock" },
    { type: "food", available: 10, status: "low_stock" },
    { type: "shelter", available: 0, status: "out_of_stock" },
  ]);
}
// seedResources(); // Uncomment to seed initial data

app.get("/api/resources", async (req, res) => {
  try {
    const resources = await Resource.find();
    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/requests", async (req, res) => {
  try {
    const {
      userEmail,
      name,
      contact,
      requestType,
      description,
      quantity,
      location,
    } = req.body;

    // Enhanced validation
    if (
      !userEmail ||
      !name ||
      !contact ||
      !requestType ||
      !description ||
      !quantity ||
      !location
    ) {
      console.error("Missing required fields:", {
        userEmail,
        name,
        contact,
        requestType,
        description,
        quantity,
        location,
      });
      return res.status(400).json({ message: "All fields are required." });
    }

    if (isNaN(quantity) || quantity <= 0) {
      console.error("Invalid quantity:", quantity);
      return res
        .status(400)
        .json({ message: "Quantity must be a positive number." });
    }

    // Generate unique request_id
    const counter = await Counter.findOneAndUpdate(
      { modelName: "Request" },
      { $inc: { currentId: 1 } },
      { new: true, upsert: true }
    );
    const requestId = counter.currentId;

    // Create new request
    const request = new Request({
      request_id: requestId,
      userEmail,
      name,
      contact,
      requestType,
      description,
      quantity,
      location,
      status: "pending",
      createdAt: new Date(),
    });

    await request.save();
    console.log("Request saved:", request);

    // Update resource availability
    const resource = await Resource.findOne({ type: requestType });
    if (resource) {
      if (resource.available >= quantity) {
        resource.available -= quantity;
        resource.status =
          resource.available <= 10
            ? "low_stock"
            : resource.available === 0
            ? "out_of_stock"
            : "in_stock";
        await resource.save();
        console.log("Resource updated:", resource);
      } else {
        console.warn("Insufficient resources:", {
          type: requestType,
          available: resource.available,
          requested: quantity,
        });
      }
    } else {
      console.warn("Resource not found:", requestType);
    }

    res.json({ message: "Request submitted", requestId });
  } catch (error) {
    console.error("Error in /api/requests:", error.stack);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

app.get("/api/requests", async (req, res) => {
  try {
    const requests = await Request.find({
      userEmail: req.query.userEmail,
    }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/donations", async (req, res) => {
  try {
    const donation = new Donation({
      ...req.body,
      status: "available",
      createdAt: new Date(),
    });
    await donation.save();
    let resource = await Resource.findOne({ type: req.body.type });
    if (!resource) {
      resource = new Resource({
        type: req.body.type,
        available: 0,
        status: "out_of_stock",
      });
    }
    resource.available += req.body.quantity;
    resource.status = resource.available <= 10 ? "low_stock" : "in_stock";
    await resource.save();
    res.json({ message: "Donation submitted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Authentication Middleware
function authMiddleware(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// Registration & OTP Routes
app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  const otp = generateOTP();
  otpStorage[email] = otp;

  const existingUser = await User.findOne({ email });
  if (existingUser)
    return res
      .status(400)
      .json({ error: "User already exists with this email" });

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: "Registration OTP",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your OTP for PIPH Login</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            background-color: #1a1a1a;
            margin: 0;
            padding: 0;
            color: #e0e0e0;
            line-height: 1.6;
        }
        .container {
            width: 100%;
            max-width: 700px;
            margin: 20px auto;
            background-color:rgb(207, 199, 199);
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
        }
        .header {
            text-align: center;
            padding: 10px 15px;
            background: linear-gradient(135deg, #1f3a44, #0a2629); /* Dark gradient */
            border-bottom: 3px solid #00cccc; /* Cyan border retained */
        }
        .header img {
            max-width: 120px;
            height: auto;
            margin: 5px 0;
        }
        .header h1 {
            color: #00cccc; /* Cyan text for contrast */
            font-size: 24px;
            margin: 5px 0 0;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .header p {
            color: #b0b0b0; /* Softer gray for subtitle */
            font-size: 14px;
            margin: 5px 0;
        }
        .banner img {
            width: 100%;
            height: auto;
            border-bottom: 2px solid #00cccc;
        }
        .content {
            padding: 20px;
            text-align: center;
        }
        .otp-box {
            font-size: 28px;
            font-weight: bold;
            color: #00cccc;
            background-color: #1a1a1a;
            padding: 12px 25px;
            display: inline-block;
            margin: 20px 0;
            border: 2px solid #00cccc;
            border-radius: 6px;
            box-shadow: 0 0 10px rgba(0, 255, 255, 0.6);
        }
        .features {
            margin: 25px 0;
            display: flex;
            justify-content: space-around;
            flex-wrap: wrap;
            padding: 0 20px;
        }
        .feature-item {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
            flex: 1 1 30%;
            min-width: 200px;
        }
        .feature-item img {
            width: 28px;
            height: 28px;
            margin-right: 12px;
        }
        .footer {
            background-color: #333333;
            padding: 15px;
            text-align: center;
            font-size: 12px;
            color: #b0b0b0;
            border-top: 1px solid #00cccc;
        }
        a {
            color: #00cccc;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
            color: #00ffff;
        }
        h2 {
            color: #00cccc;
            margin: 15px 0;
            font-size: 24px;
        }
        p {
            margin: 10px 0;
        }

        /* Desktop Enhancements */
        @media only screen and (min-width: 601px) {
            .header {
                padding: 15px 20px;
            }
            .header h1 {
                font-size: 28px;
            }
            .header p {
                font-size: 16px;
            }
            .content {
                padding: 30px;
            }
            .otp-box {
                font-size: 32px;
                padding: 15px 30px;
            }
            .features {
                padding: 0 30px;
            }
            .feature-item {
                min-width: 180px;
            }
            .feature-item img {
                width: 32px;
                height: 32px;
            }
            h2 {
                font-size: 26px;
            }
            p {
                font-size: 16px;
            }
        }

        /* Mobile Optimization */
        @media only screen and (max-width: 600px) {
            .container {
                margin: 10px;
                border-radius: 6px;
                max-width: 100%;
            }
            .header {
                padding: 8px 10px;
            }
            .header img {
                max-width: 100px;
            }
            .header h1 {
                font-size: 20px;
            }
            .header p {
                font-size: 12px;
            }
            .content {
                padding: 15px;
            }
            .otp-box {
                font-size: 22px;
                padding: 10px 20px;
            }
            .features {
                padding: 0 10px;
                display: block;
            }
            .feature-item {
                min-width: 100%;
                margin-bottom: 12px;
            }
            .feature-item img {
                width: 24px;
                height: 24px;
            }
            .footer {
                padding: 12px;
                font-size: 10px;
            }
            h2 {
                font-size: 20px;
            }
            p {
                font-size: 14px !important;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header with Logo and Title -->
        <div class="header">
            <img src="piph.png" alt="PIPH Logo">
            <h1>PIPH</h1>
            <p>Pandemic Insights And Preparedness Hub</p>
        </div>

        <!-- Banner (Placeholder from Google) -->
        <!-- <div class="banner">
            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5zXU8qO8qV8qV8qV8qV8qV8qV8qV8qV8qV8qV8qV8qV8" alt="PIPH Banner">
        </div> -->

        <!-- Content -->
        <div class="content">
            <h2>Building Resilience, One Step at a Time</h2>
            <p style="font-size: 16px;">
                Hello Buddy,<br>
                Welcome to PIPH—your hub for pandemic insights and preparedness. We’re here to empower communities with cutting-edge tools and real-time data.
            </p>
            <p style="font-size: 16px;">
                Your One-Time Password (OTP) to log in securely:
            </p>
            <div class="otp-box">${otp}</div>
            <p style="font-size: 14px; color: #b0b0b0;">
                Valid for 10 minutes. Keep it confidential.
            </p>

            <!-- Features Section with Icons -->
            <div class="features">
                <div class="feature-item">
                    <img src="https://img.icons8.com/ios-filled/50/00cccc/clock.png" alt="Real-Time Icon">
                    <span>Real-time pandemic tracking</span>
                </div>
                <div class="feature-item">
                    <img src="https://img.icons8.com/ios-filled/50/00cccc/settings.png" alt="Automation Icon">
                    <span>Automated resource management</span>
                </div>
                <div class="feature-item">
                    <img src="https://img.icons8.com/ios-filled/50/00cccc/shield.png" alt="Resilience Icon">
                    <span>Resilience-focused tools</span>
                </div>
            </div>

            <p style="font-size: 16px;">
                Stay connected:<br>
                <a href="[INSERT INSTAGRAM URL HERE]" target="_blank">@PIPH_Official</a> | 
                <a href="[INSERT WEBSITE URL HERE]" target="_blank">www.piph.com</a>
            </p>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>Best regards,<br><strong>Satyam Pandey</strong><br>CEO, PIPH</p>
            <p>© 2025 PIPH. All rights reserved.</p>
            <p>Need help? <a href="mailto:support@piph.com">support@piph.com</a></p>
        </div>
    </div>
</body>
</html>`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending OTP email:", error);
      return res.status(500).json({ error: "Failed to send OTP" });
    }
    res.json({ message: "OTP sent! Please verify." });
  });
});

app.post("/register/verify", async (req, res) => {
  const { email, otp, password, name, phone, dob } = req.body;

  if (otpStorage[email] !== otp)
    return res.status(400).json({ error: "Invalid OTP" });

  const existingUser = await User.findOne({ email });
  if (existingUser)
    return res.status(400).json({ error: "User already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({
    email,
    password: hashedPassword,
    name,
    phone,
    dob: new Date(dob),
    volunteerData: [],
  });
  await newUser.save();

  delete otpStorage[email];

  const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  res.json({ message: "Registration successful", token });
});

// Login Route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: "User not found" });

  bcrypt.compare(password, user.password, (err, result) => {
    if (err) return res.status(500).json({ error: "Internal error" });
    if (!result) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ message: "Login successful", token });
  });
});

// Forgot Password Routes
app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Email not found" });

    const otp = generateOTP();
    user.resetOtp = otp;
    user.resetOtpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: "Password Reset OTP",
      html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset OTP</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');
        body { font-family: "Poppins", serif; background-color: #f9f9f9; margin: 0; padding: 0; }
        .email-container { width: 400px; margin: 20px auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); overflow: hidden; }
        .email-header { background-color: #4caf50; color: #ffffff; text-align: center; padding: 20px; }
        .email-header img { width: 150px; }
        .email-header h1 { margin: 10px 0 0; font-size: 24px; }
        .email-body { padding: 20px; text-align: center; }
        .email-body h2 { font-size: 20px; color: #333; }
        .email-body .otp-box { background-color: #f4f4f4; font-size: 24px; color: #4caf50; padding: 15px; margin: 20px auto; width: fit-content; border-radius: 5px; border: 1px solid #ddd; }
        .email-body p { font-size: 16px; color: #555; line-height: 1.6; }
        .email-footer { text-align: center; padding: 15px; font-size: 14px; color: #777; background-color: #f4f4f4; }
        .email-footer a { color: #4caf50; text-decoration: none; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <img src="https://i.postimg.cc/pT69mFMB/logo.png" alt="Website Logo">
            <h1>Pandemic Response Hub</h1>
        </div>
        <div class="email-body">
            <h2>🔑 Password Reset</h2>
            <p>We received a request to reset your password. Use the OTP below to proceed:</p>
            <div class="otp-box">${otp}</div>
            <p><em>(This OTP is valid for the next 10 minutes.)</em></p>
            <p>If you didn’t request this, please ignore this email or <a href="#">contact support</a>.</p>
        </div>
        <div class="email-footer">
            <p>Need help? <a href="#">Visit our support page</a>.</p>
            <p>The <strong>PIPH Team</strong></p>
        </div>
    </div>
</body>
</html>`,
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        console.error("Error sending OTP email:", error);
        return res.status(500).json({ error: "Failed to send OTP" });
      }
      res.json({ message: "OTP sent to your email" });
    });
  } catch (err) {
    console.error("Error in forgot-password:", err);
    res.status(500).json({ message: "Error sending OTP" });
  }
});

app.post("/reset-password/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || user.resetOtp !== otp || Date.now() > user.resetOtpExpiry) {
      return res.status(400).json({ valid: false });
    }
    res.json({ valid: true });
  } catch (err) {
    console.error("Error verifying OTP:", err);
    res.status(500).json({ message: "Error verifying OTP" });
  }
});

app.post("/reset-password", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    user.password = await bcrypt.hash(password, 10);
    user.resetOtp = null;
    user.resetOtpExpiry = null;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Error resetting password:", err);
    res.status(500).json({ message: "Error resetting password" });
  }
});

// Request & Admin Routes
app.post("/send", async (req, res) => {
  try {
    const {
      name,
      contactInformation,
      requestType,
      description,
      quantity,
      location,
      email,
    } = req.body;

    if (
      !name ||
      !contactInformation ||
      !requestType ||
      !description ||
      quantity === undefined ||
      !location
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const counter = await Counter.findOneAndUpdate(
      { modelName: "Request" },
      { $inc: { currentId: 1 } },
      { new: true, upsert: true }
    );
    const requestId = counter.currentId;

    const newRequest = new Request({
      request_id: requestId,
      name,
      contactInformation,
      requestType,
      description,
      quantity,
      location,
      email,
      status: "Pending",
    });

    await newRequest.save();
    res.status(201).json({ message: "Request successfully stored." });
  } catch (error) {
    console.error("Error storing request:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

app.get("/requests", async (req, res) => {
  try {
    const requests = await Request.find();
    res.json(requests);
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({ message: "Error fetching requests" });
  }
});

app.put("/requests/:id", async (req, res) => {
  try {
    const { status, email } = req.body;
    const requestId = parseInt(req.params.id, 10);
    const request = await Request.findOne({ request_id: requestId });

    if (!request) return res.status(404).json({ message: "Request not found" });

    const { quantity } = request;
    request.status = status;
    const updatedRequest = await request.save();

    const data = new Date();
    const formattedDate = data.toISOString().split("T")[0];

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: "Request Status Update",
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resource Request Approved</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');
    body { font-family: "Poppins", sans-serif; background-color: #f9f9f9; margin: 0; padding: 0; }
    .email-container { max-width: 600px; margin: 20px auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); overflow: hidden; }
    .email-header { background-color: #4caf50; color: #ffffff; text-align: center; padding: 20px; }
    .email-header img { max-width: 150px; }
    .email-header h1 { margin: 10px 0 0; font-size: 24px; }
    .email-body { padding: 20px; text-align: center; }
    .email-body h2 { font-size: 20px; color: #333; }
    .email-body p { font-size: 16px; color: #555; line-height: 1.6; }
    .email-body .resource-details { background-color: #f4f4f4; padding: 15px; margin: 20px auto; border-radius: 5px; border: 1px solid #ddd; text-align: left; }
    .email-body .resource-details strong { color: #4caf50; }
    .email-footer { text-align: center; padding: 15px; font-size: 14px; color: #777; background-color: #f4f4f4; }
    .email-footer a { color: #4caf50; text-decoration: none; }
    .email-body img { width: 100px; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <img src="https://i.postimg.cc/pT69mFMB/logo.png" alt="Website Logo">
      <h1>Resource Request Approved!</h1>
    </div>
    <div class="email-body">
      <h2>👏 Great news, ${requestId}</h2>
      <p>Your resource request has been ${status}. Below are the details of your request:</p>
      <img src="https://www.pngarts.com/files/4/Happy-Emoji-PNG-Free-Download.png" alt="">
      <div class="resource-details">
        <p><strong>Request ID:</strong> #${requestId}</p>
        <p><strong>Resource Type:</strong> ${request.requestType}</p>
        <p><strong>Quantity Approved:</strong> ${quantity}</p>
        <p><strong>Approval Date:</strong> ${formattedDate}</p>
      </div>
      <p>Our team will ensure that the requested resources are delivered to you promptly. If you have any questions, feel free to reach out to us.</p>
    </div>
    <div class="email-footer">
      <p>Need assistance? <a href="#">Contact our support team</a>.</p>
      <p>Thank you for choosing PIPH! <br>The <strong>PIPH</strong> Team</p>
    </div>
  </div>
</body>
</html>`,
    };

    transporter.sendMail(mailOptions, async (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ message: "Error sending email" });
      }
      console.log("Email sent: " + info.response);
      await Request.deleteOne({ request_id: requestId });
      console.log(`Request with ID ${requestId} deleted from the database.`);
      res.json(updatedRequest);
    });
  } catch (error) {
    console.error("Error updating request:", error);
    res.status(500).json({ message: "Error updating request status" });
  }
});

// User Profile Endpoints
app.get("/api/user/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.phone,
      photo: user.photo,
      tasksCompleted: user.tasksCompleted,
      isOrgHead: user.isOrgHead,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post(
  "/api/user/update",
  authMiddleware,
  upload.single("photo"),
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const { fullName, userName, email, phone } = req.body;
      let updateData = { name: fullName, username: userName, email, phone };
      if (req.file) updateData.photo = "uploads/" + req.file.filename;

      const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
      }).select("-password");
      res.json({ message: "Profile updated successfully", user: updatedUser });
    } catch (err) {
      console.error("Error updating profile:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Volunteer and Organization Routes
app.post("/api/volunteer/signup", authMiddleware, async (req, res) => {
  const { name, email, phone, skills, location, description, orgId, type } =
    req.body;
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (type === "individual") {
      user.volunteerData.push({ skills });
    } else if (type === "create-org") {
      const org = new Organization({
        name,
        email,
        location,
        description,
        creator: req.user.userId,
      });
      await org.save();
      user.volunteerData.push({ orgId: org._id, status: "accepted" });
      user.isOrgHead = true;
    } else if (type === "join-org") {
      const org = await Organization.findById(orgId);
      if (!org)
        return res.status(404).json({ error: "Organization not found" });
      user.volunteerData.push({ name, email, orgId });
    }
    await user.save();
    res.json({ message: "Signup successful" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/organizations", async (req, res) => {
  try {
    const orgs = await Organization.find().select(
      "name logo description location volunteerRequirements"
    );
    res.json(orgs);
  } catch (err) {
    console.error("Error fetching organizations:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/org/dashboard", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const org = await Organization.findOne({ creator: userId }).populate(
      "volunteers"
    );
    if (!org) return res.status(404).json({ error: "Organization not found" });

    const volunteers = await User.find({ "volunteerData.orgId": org._id });
    const projects = org.projects;
    const beneficiaries = projects.reduce(
      (sum, proj) => sum + (proj.beneficiaries || 0),
      0
    );

    res.json({
      org,
      volunteers: volunteers.map((v) => ({
        _id: v._id,
        name: v.name,
        email: v.email,
        status: v.volunteerData.find((d) => d.orgId.equals(org._id)).status,
      })),
      projects,
      beneficiaries,
    });
  } catch (err) {
    console.error("Error loading org dashboard:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/org/volunteer/:action", authMiddleware, async (req, res) => {
  const { volunteerId } = req.body;
  const action = req.params.action;
  try {
    const user = await User.findById(volunteerId);
    const org = await Organization.findOne({ creator: req.user.userId });
    if (!user || !org)
      return res.status(404).json({ error: "User or organization not found" });

    const volunteerData = user.volunteerData.find((d) =>
      d.orgId.equals(org._id)
    );
    if (!volunteerData)
      return res.status(404).json({ error: "Volunteer not found" });

    if (action === "accept") {
      volunteerData.status = "accepted";
      if (!org.volunteers.includes(volunteerId))
        org.volunteers.push(volunteerId);
    } else if (action === "reject") {
      user.volunteerData = user.volunteerData.filter(
        (d) => !d.orgId.equals(org._id)
      );
    }
    await user.save();
    await org.save();
    res.json({ message: `Volunteer ${action}ed` });
  } catch (err) {
    console.error("Error managing volunteer:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/org/volunteer/task", authMiddleware, async (req, res) => {
  const { volunteerId, task } = req.body;
  try {
    if (!volunteerId || !task) {
      console.error("Missing volunteerId or task:", { volunteerId, task });
      return res
        .status(400)
        .json({ error: "Volunteer ID and task description are required" });
    }

    const user = await User.findById(volunteerId);
    const org = await Organization.findOne({ creator: req.user.userId });
    if (!user || !org) {
      console.error("User or organization not found:", {
        volunteerId,
        userId: req.user.userId,
      });
      return res.status(404).json({ error: "User or organization not found" });
    }

    const volunteerData = user.volunteerData.find((d) =>
      d.orgId.equals(org._id)
    );
    if (!volunteerData) {
      console.error("Volunteer not associated with this org:", {
        volunteerId,
        orgId: org._id,
      });
      return res
        .status(404)
        .json({ error: "Volunteer not found in this organization" });
    }

    volunteerData.tasks.push({ description: task, assignedAt: new Date() });
    await user.save();
    console.log("Task assigned to volunteer:", {
      volunteerId,
      task,
      tasks: volunteerData.tasks,
    });

    res.json({ message: "Task assigned successfully" });
  } catch (err) {
    console.error("Error in /api/org/volunteer/task:", err.stack);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

app.post(
  "/api/org/volunteer/task/complete",
  authMiddleware,
  async (req, res) => {
    const { volunteerId, taskIndex } = req.body;
    try {
      const user = await User.findById(volunteerId);
      const org = await Organization.findOne({ creator: req.user.userId });
      if (!user || !org)
        return res
          .status(404)
          .json({ error: "User or organization not found" });

      const volunteerData = user.volunteerData.find((d) =>
        d.orgId.equals(org._id)
      );
      if (!volunteerData || taskIndex >= volunteerData.tasks.length) {
        return res.status(404).json({ error: "Task not found" });
      }

      user.tasksCompleted += 1;
      volunteerData.tasks.splice(taskIndex, 1);
      await user.save();
      res.json({ message: "Task marked as completed" });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

app.post("/api/org/event", authMiddleware, async (req, res) => {
  const { name, description, date } = req.body;
  try {
    const org = await Organization.findOne({ creator: req.user.userId });
    if (!org) return res.status(404).json({ error: "Organization not found" });

    org.projects.push({ name, description, date });
    await org.save();
    res.json({ message: "Event created" });
  } catch (err) {
    console.error("Error creating event:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post(
  "/api/org/profile",
  authMiddleware,
  upload.fields([{ name: "cover" }, { name: "logo" }]),
  async (req, res) => {
    try {
      const org = await Organization.findOne({ creator: req.user.userId });
      if (!org)
        return res.status(404).json({ error: "Organization not found" });

      org.description = req.body.description;
      if (req.files.cover) org.cover = "uploads/" + req.files.cover[0].filename;
      if (req.files.logo) org.logo = "uploads/" + req.files.logo[0].filename;
      await org.save();
      res.json({ message: "Profile updated" });
    } catch (err) {
      console.error("Error updating org profile:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);
// Update Resource
app.put('/api/resources', async (req, res) => {
  try {
      const { type, available } = req.body;
      const resource = await Resource.findOneAndUpdate(
          { type },
          { available, status: available <= 10 ? 'low_stock' : available === 0 ? 'out_of_stock' : 'in_stock' },
          { new: true }
      );
      if (!resource) return res.status(404).json({ message: 'Resource not found' });
      res.json({ message: 'Resource updated' });
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});

// Update Donation Status
app.put('/api/donations/:id', async (req, res) => {
  try {
      const { status } = req.body;
      const donation = await Donation.findByIdAndUpdate(req.params.id, { status }, { new: true });
      if (!donation) return res.status(404).json({ message: 'Donation not found' });
      if (status === 'claimed') {
          const resource = await Resource.findOne({ type: donation.type });
          if (resource) {
              resource.available += donation.quantity;
              resource.status = resource.available <= 10 ? 'low_stock' : 'in_stock';
              await resource.save();
          }
      }
      res.json({ message: 'Donation updated' });
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});

// Delete Donation
app.delete('/api/donations/:id', async (req, res) => {
  try {
      const donation = await Donation.findByIdAndDelete(req.params.id);
      if (!donation) return res.status(404).json({ message: 'Donation not found' });
      res.json({ message: 'Donation rejected' });
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});
app.get("/api/user/dashboard", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const joinedOrgs = await Organization.find({
      _id: {
        $in: user.volunteerData
          .filter((d) => d.status === "accepted")
          .map((d) => d.orgId),
      },
    });
    const pendingOrgs = await Organization.find({
      _id: {
        $in: user.volunteerData
          .filter((d) => d.status === "pending")
          .map((d) => d.orgId),
      },
    });
    const allOrgs = await Organization.find();
    const recommendations = allOrgs
      .filter((org) => !user.volunteerData.some((d) => d.orgId.equals(org._id)))
      .slice(0, 3);

    const joinedOrgsWithTasks = joinedOrgs.map((org) => {
      const volunteerData = user.volunteerData.find(
        (d) => d.orgId.equals(org._id) && d.status === "accepted"
      );
      return {
        ...org.toObject(),
        tasks: volunteerData ? volunteerData.tasks : [],
      };
    });

    res.json({
      joinedOrgs: joinedOrgsWithTasks,
      pendingOrgs,
      recommendations,
      volunteerHours: user.volunteerData.reduce((sum, d) => sum + d.hours, 0),
      impactContributions: user.volunteerData.reduce(
        (sum, d) => sum + d.contributions,
        0
      ),
    });
  } catch (err) {
    console.error("Error loading user dashboard:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Utility Function: Generate OTP
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

// Start the Server
server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Trying port ${PORT + 1}...`);
    server.listen(PORT + 1, () => console.log(`Server running on port ${PORT + 1}`));
  } else {
    console.error("Server error:", error);
    process.exit(1);
  }
});

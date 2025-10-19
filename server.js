const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
}));
app.use(bodyParser.json({ limit: "25mb" }));

// Create uploads folder
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// MongoDB connection
const mongoURI = process.env.MONGODB_URI ||
  "mongodb+srv://welcome:welcomeji1@selfie.exrykey.mongodb.net/selfieDB?retryWrites=true&w=majority";

mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// Schema & Model
const selfieSchema = new mongoose.Schema({
  filePath: String,
  timestamp: { type: Date, default: Date.now },
});
const Selfie = mongoose.model("Selfie", selfieSchema);

// Routes
app.get("/", (req, res) => res.send("📸 Selfie API Running!"));

app.post("/upload", async (req, res) => {
  console.log("Incoming upload request from:", req.ip);
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: "No image provided" });

    const base64Data = image.replace(/^data:image\/png;base64,/, "");
    const fileName = `selfie_${Date.now()}.png`;
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, base64Data, "base64");

    const selfie = new Selfie({ filePath: `/uploads/${fileName}` });
    await selfie.save();

    console.log("✅ Selfie saved:", filePath);
    res.json({ message: "✅ Selfie saved", filePath: `/uploads/${fileName}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/selfies", async (req, res) => {
  try {
    const selfies = await Selfie.find().sort({ timestamp: -1 });
    res.json(selfies);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Serve static uploads folder
app.use("/uploads", express.static(uploadDir));

// Start server
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));

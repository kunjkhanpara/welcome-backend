// server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import multer from "multer";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

// Schema
const selfieSchema = new mongoose.Schema({
  filePath: String,
  timestamp: { type: Date, default: Date.now },
});

const Selfie = mongoose.model("Selfie", selfieSchema);

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, "selfie_" + Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Routes
app.post("/upload", upload.single("selfie"), async (req, res) => {
  const selfie = new Selfie({ filePath: `/uploads/${req.file.filename}` });
  await selfie.save();
  res.json({ message: "Uploaded successfully", selfie });
});

app.get("/selfies", async (req, res) => {
  const selfies = await Selfie.find().sort({ timestamp: -1 });
  res.json(selfies);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

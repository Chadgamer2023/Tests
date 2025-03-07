const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

// Temporary storage (use MongoDB later)
let inviteCodes = {
  "126784362": { storageLimit: 2 * 1024 * 1024 * 1024, used: 0, expires: null },
};

// Middleware to check invite codes
app.use("/upload", (req, res, next) => {
  const { code } = req.body;
  if (!inviteCodes[code]) return res.status(403).json({ error: "Invalid code" });
  next();
});

// Upload endpoint (replace with Chibisafe API integration)
app.post("/upload", (req, res) => {
  const { code, fileSize } = req.body;
  if (inviteCodes[code].used + fileSize > inviteCodes[code].storageLimit) {
    return res.status(403).json({ error: "Storage limit exceeded" });
  }
  inviteCodes[code].used += fileSize;
  res.json({ message: "File uploaded successfully" });
});

// Get user storage info
app.get("/storage/:code", (req, res) => {
  const code = req.params.code;
  if (!inviteCodes[code]) return res.status(404).json({ error: "Invalid code" });
  res.json(inviteCodes[code]);
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));

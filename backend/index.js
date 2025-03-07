const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

const corsOptions = {
  origin: 'https://invictadeus.netlify.app',  // your Netlify frontend URL
  methods: ['GET', 'POST', 'DELETE', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

mongoose.connect(process.env.MONGO_URI, {
    dbName: "BSSS", // ✅ Explicitly setting the database name
    useUnifiedTopology: true
})
    .then(() => console.log("✅ MongoDB connected to BSSS"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Inactive Codes Schema (New Manually Added Codes)
const InactiveCodeSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    storageLimit: { type: Number, required: true } // in bytes
});
const InactiveCode = mongoose.model("InactiveCode", InactiveCodeSchema, "InactiveCodes");

// Active Codes Schema (Activated Codes Used for Login)
const ActiveCodeSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    storageLimit: { type: Number, required: true },
    used: { type: Number, default: 0 }, // Used storage in bytes
    activatedAt: { type: Date, default: Date.now } // When it was activated
});
const ActiveCode = mongoose.model("ActiveCode", ActiveCodeSchema, "ActiveCodes");

// Temporary Codes Schema (Short-Term Codes with Expiry)
const TempCodeSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    storageLimit: { type: Number, required: true },
    expires: { type: Date, required: true } // Expiry date
});
const TempCode = mongoose.model("TempCode", TempCodeSchema, "TempCodes");

// File Schema (No Changes)
const FileSchema = new mongoose.Schema({
    name: String,
    url: String,
    size: Number,
    uploadedBy: String,
    expiry: Date, // Optional expiry date
    password: String // Optional password protection
});
const File = mongoose.model("File", FileSchema, "Files");

module.exports = { InactiveCode, ActiveCode, TempCode, File };

/* ==========================
   ✅ Check Storage API
   ========================== */
app.get("/storage/:code", async (req, res) => {
    const invite = await Invite.findOne({ code: req.params.code });
    if (!invite) return res.status(404).json({ error: "Invalid code" });

    // Auto-delete expired codes
    if (invite.expires && new Date() > invite.expires) {
        await Invite.deleteOne({ code: req.params.code });
        return res.status(404).json({ error: "Code expired" });
    }

    res.json(invite);
});

/* ==========================
   ✅ Upload File API (Verifies Code & Bandwidth)
   ========================== */
app.post("/upload", async (req, res) => {
    const { code, fileSize, fileName, fileUrl } = req.body;
    const invite = await Invite.findOne({ code });

    if (!invite) return res.status(403).json({ error: "Invalid code" });
    if (invite.used + fileSize > invite.storageLimit) {
        return res.status(403).json({ error: "Storage limit exceeded" });
    }

    // Save file info in DB
    const file = new File({ name: fileName, url: fileUrl, size: fileSize, uploadedBy: code });
    await file.save();

    // Update used storage
    invite.used += fileSize;
    await invite.save();

    res.json({ message: "File uploaded successfully" });
});

/* ==========================
   ✅ Fetch User Files API
   ========================== */
app.get("/files/:code", async (req, res) => {
    const files = await File.find({ uploadedBy: req.params.code });
    res.json(files);
});

/* ==========================
   ✅ Download File API
   ========================== */
app.get("/download/:fileId", async (req, res) => {
    const file = await File.findById(req.params.fileId);
    if (!file) return res.status(404).json({ error: "File not found" });

    res.redirect(file.url);
});

/* ==========================
   ✅ Share File API (Returns Share Link)
   ========================== */
app.get("/share/:fileId", async (req, res) => {
    const file = await File.findById(req.params.fileId);
    if (!file) return res.status(404).json({ error: "File not found" });

    res.json({ shareLink: file.url });
});

/* ==========================
   ✅ Set File Expiry API
   ========================== */
app.post("/set-expiry", async (req, res) => {
    const { fileId, days } = req.body;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    await File.findByIdAndUpdate(fileId, { expiry: expiryDate });

    res.json({ message: `File will expire in ${days} days` });
});

/* ==========================
   ✅ Delete File API
   ========================== */
app.delete("/delete/:fileId", async (req, res) => {
    await File.findByIdAndDelete(req.params.fileId);
    res.json({ message: "File deleted" });
});

/* ==========================
   ✅ Auto-Delete Expired Files (Runs Every Hour)
   ========================== */
setInterval(async () => {
    await File.deleteMany({ expiry: { $lt: new Date() } });
    console.log("Expired files deleted");
}, 3600000); // Runs every hour

/* ==========================
   ✅ Start Server
   ========================== */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));

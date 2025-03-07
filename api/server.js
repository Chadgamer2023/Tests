const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI, {
    dbName: "BSSS", // ✅ Explicitly setting the database name
    useUnifiedTopology: true
})
    .then(() => console.log("✅ MongoDB connected to BSSS"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Inactive Codes Schema
const InactiveCodeSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    storageLimit: { type: Number, required: true }
});
const InactiveCode = mongoose.model("InactiveCode", InactiveCodeSchema, "InactiveCodes");

// Active Codes Schema
const ActiveCodeSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    storageLimit: { type: Number, required: true },
    used: { type: Number, default: 0 },
    activatedAt: { type: Date, default: Date.now }
});
const ActiveCode = mongoose.model("ActiveCode", ActiveCodeSchema, "ActiveCodes");

// Temporary Codes Schema
const TempCodeSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    storageLimit: { type: Number, required: true },
    expires: { type: Date, required: true }
});
const TempCode = mongoose.model("TempCode", TempCodeSchema, "TempCodes");

// File Schema
const FileSchema = new mongoose.Schema({
    name: String,
    url: String,
    size: Number,
    uploadedBy: String,
    expiry: Date,
    password: String
});
const File = mongoose.model("File", FileSchema, "Files");

/* ==========================
   ✅ Check Storage API
   ========================== */
app.get("/api/storage/:code", async (req, res) => {
    const invite = await ActiveCode.findOne({ code: req.params.code });
    if (!invite) return res.status(404).json({ error: "Invalid code" });

    // Auto-delete expired codes
    if (invite.expires && new Date() > invite.expires) {
        await ActiveCode.deleteOne({ code: req.params.code });
        return res.status(404).json({ error: "Code expired" });
    }

    res.json(invite);
});

/* ==========================
   ✅ Upload File API
   ========================== */
app.post("/api/upload", async (req, res) => {
    const { code, fileSize, fileName, fileUrl } = req.body;
    const invite = await ActiveCode.findOne({ code });

    if (!invite) return res.status(403).json({ error: "Invalid code" });
    if (invite.used + fileSize > invite.storageLimit) {
        return res.status(403).json({ error: "Storage limit exceeded" });
    }

    const file = new File({ name: fileName, url: fileUrl, size: fileSize, uploadedBy: code });
    await file.save();

    invite.used += fileSize;
    await invite.save();

    res.json({ message: "File uploaded successfully" });
});

/* ==========================
   ✅ Fetch User Files API
   ========================== */
app.get("/api/files/:code", async (req, res) => {
    const files = await File.find({ uploadedBy: req.params.code });
    res.json(files);
});

/* ==========================
   ✅ Download File API
   ========================== */
app.get("/api/download/:fileId", async (req, res) => {
    const file = await File.findById(req.params.fileId);
    if (!file) return res.status(404).json({ error: "File not found" });

    res.redirect(file.url);
});

/* ==========================
   ✅ Share File API
   ========================== */
app.get("/api/share/:fileId", async (req, res) => {
    const file = await File.findById(req.params.fileId);
    if (!file) return res.status(404).json({ error: "File not found" });

    res.json({ shareLink: file.url });
});

/* ==========================
   ✅ Set File Expiry API
   ========================== */
app.post("/api/set-expiry", async (req, res) => {
    const { fileId, days } = req.body;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    await File.findByIdAndUpdate(fileId, { expiry: expiryDate });

    res.json({ message: `File will expire in ${days} days` });
});

/* ==========================
   ✅ Delete File API
   ========================== */
app.delete("/api/delete/:fileId", async (req, res) => {
    await File.findByIdAndDelete(req.params.fileId);
    res.json({ message: "File deleted" });
});

/* ==========================
   ✅ Vercel Export (No app.listen)
   ========================== */
module.exports = app;

const multer = require("multer");
const fs = require("fs");

// Configure Multer to store file temporarily in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const convertToBase64 = (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    // Convert the image buffer to Base64
    const base64Image = req.file.buffer.toString("base64");

    // Add Base64 image to request object
    req.fileBase64 = `data:${req.file.mimetype};base64,${base64Image}`;

    next();
};

module.exports = {
    upload: upload.single("image"), // Middleware for uploading
    convertToBase64
};

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 5000;

// Enable CORS for all origins (adjust as needed)
app.use(cors());

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// In-memory store for download tokens and file info
const downloads = new Map();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Use unique ID as filename to avoid collisions
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});
const upload = multer({ storage: storage });

// Upload endpoint
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const ttl = parseInt(req.body.ttl) || 15; // default TTL 15 minutes

  // Generate a unique token for one-time download
  const token = uuidv4();

  // Store file info and expiration time
  const expiresAt = Date.now() + ttl * 60 * 1000;
  downloads.set(token, {
    filePath: path.join(uploadDir, req.file.filename),
    originalName: req.file.originalname,
    expiresAt,
    downloaded: false,
  });

  // Construct one-time download link
  const downloadLink = `http://localhost:${PORT}/download/${token}`;

  res.json({
    fileInfo: {
      originalName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
      filename: req.file.filename,
    },
    downloadLink,
    ttl,
  });
});

const downloadLock = new Set();

// One-time download endpoint
app.get('/download/:token', async (req, res) => {
  const token = req.params.token;
  const download = downloads.get(token);

  if (!download) {
    return res.status(404).send('Download link not found or expired.');
  }

  if (download.downloaded) {
    return res.status(410).send('This file has already been downloaded.');
  }

  if (Date.now() > download.expiresAt) {
    downloads.delete(token);
    // Delete the file as well
    fs.unlink(download.filePath, () => {});
    return res.status(410).send('Download link has expired.');
  }

  // Prevent concurrent downloads for the same token
  if (downloadLock.has(token)) {
    return res.status(429).send('Download in progress. Please wait.');
  }
  downloadLock.add(token);

  // Mark as downloaded before sending
  download.downloaded = true;

  res.download(download.filePath, download.originalName, (err) => {
    downloadLock.delete(token);
    if (err) {
      console.error('Error sending file:', err);
      // Reset downloaded flag on error to allow retry
      download.downloaded = false;
      return;
    }
    // Delete file and remove token after successful download
    fs.unlink(download.filePath, () => {});
    downloads.delete(token);
  });
});

app.listen(PORT, () => {
  console.log(`Upload server running on http://localhost:${PORT}`);
});

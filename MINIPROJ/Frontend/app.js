const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// Store file info with TTL
const fileStore = new Map();

// Upload endpoint
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const ttl = parseInt(req.body.ttl) || 15; // minutes
  const fileId = uuidv4();
  const fileInfo = {
    id: fileId,
    name: req.file.originalname,
    size: req.file.size,
    type: req.file.mimetype,
    path: req.file.filename,
    uploadedAt: Date.now(),
    ttl: ttl * 60 * 1000, // to ms
  };

  fileStore.set(fileId, fileInfo);

  // Get local IP
  const os = require('os');
  const interfaces = os.networkInterfaces();
  let localIP = 'localhost';
  for (let iface in interfaces) {
    for (let alias of interfaces[iface]) {
      if (alias.family === 'IPv4' && !alias.internal) {
        localIP = alias.address;
        break;
      }
    }
    if (localIP !== 'localhost') break;
  }

  const downloadLink = `http://${localIP}:${PORT}/download/${fileId}`;

  res.json({
    downloadLink,
    fileInfo: {
      name: fileInfo.name,
      size: fileInfo.size,
      type: fileInfo.type,
    },
    ttl,
  });
});

// Download endpoint
app.get('/download/:id', (req, res) => {
  const fileId = req.params.id;
  const fileInfo = fileStore.get(fileId);

  if (!fileInfo) {
    return res.status(404).json({ error: 'File not found or expired' });
  }

  // Check if expired
  if (Date.now() - fileInfo.uploadedAt > fileInfo.ttl) {
    fileStore.delete(fileId);
    fs.unlink(path.join(uploadsDir, fileInfo.path), () => {});
    return res.status(404).json({ error: 'File expired' });
  }

  const filePath = path.join(uploadsDir, fileInfo.path);
  res.download(filePath, fileInfo.name, (err) => {
    if (err) {
      console.error('Download error:', err);
    }
  });
});

// Cleanup expired files periodically
setInterval(() => {
  const now = Date.now();
  for (let [id, info] of fileStore) {
    if (now - info.uploadedAt > info.ttl) {
      fileStore.delete(id);
      fs.unlink(path.join(uploadsDir, info.path), () => {});
    }
  }
}, 60000); // every minute

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Accessible on network at http://<your-local-ip>:${PORT}`);
});

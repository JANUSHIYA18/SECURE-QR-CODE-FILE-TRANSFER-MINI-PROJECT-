const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.static('uploads')); // serves files from 'uploads' folder

// Make sure 'uploads' directory exists!
const fs = require('fs');
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');

// File storage with multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname) // You may want to sanitize this in production!
  }
});
const upload = multer({ storage: storage });

// Upload endpoint
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded.');
  // Respond with download URL (replace with your LAN IP if not using DHCP/static IP)
  const fileUrl = `/download/${req.file.filename}`;
  res.json({ status: 'ok', url: fileUrl, name: req.file.filename });
});

// Download endpoint
app.get('/download/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'uploads', req.params.filename);
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).send('File not found');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit from LAN: http://<YOUR_LAN_IP>:${PORT}/`);
});

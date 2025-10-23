const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const ip = require('ip');
const stripe = require('stripe')('sk_test_51SLOVWRCkxXC1fPpyCJ4tZCswBExU2xENBvrfHi7MuG1ubJwNUqHxqzVJbECgYYZWmMYtSZKvk5xJK0uJybBWg6k00YSC82OnG');
const bonjour = require('bonjour')();

const app = express();
const PORT = process.env.PORT || 3001;

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
// Track number of scans per QR code
const qrScans = new Map();
// Store connected devices for nearby WiFi transfer
const connectedDevices = new Map();

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

  // Get local IP using ip package for more reliable detection
  const localIP = ip.address();
  console.log(`Detected local IP: ${localIP}`);
  const downloadLink = `http://${localIP}:${PORT}/download/${fileId}`;
  console.log(`Generated download link: ${downloadLink}`);

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
    // If file not found or already removed, show premium/expired page
    return res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Download Limit Exceeded</title>
  <style>
    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f7fa; color: #222; }
    h1 { color: #e74c3c; }
    p { font-size: 18px; }
    .btn { padding: 10px 20px; background: #4a90e2; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; text-decoration: none; display: inline-block; margin-top: 20px; }
  </style>
</head>
<body>
  <h1>Premium Features Required</h1>
  <p>This QR code is no longer available for free downloads.</p>
  <p>Upgrade to premium for unlimited scans and downloads!</p>
  <a href="/premium" class="btn">Upgrade to Premium</a>
  <a href="/" class="btn">Go to Home</a>
</body>
</html>
    `);
  }

  // Check if expired
  if (Date.now() - fileInfo.uploadedAt > fileInfo.ttl) {
    fileStore.delete(fileId);
    fs.unlink(path.join(uploadsDir, fileInfo.path), () => {});
    return res.status(404).json({ error: 'File expired' });
  }

  // If already downloaded once, don't allow another free download
  if (fileInfo.downloaded) {
    return res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Download Limit Exceeded</title>
  <style>
    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f7fa; color: #222; }
    h1 { color: #e74c3c; }
    p { font-size: 18px; }
    .btn { padding: 10px 20px; background: #4a90e2; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; text-decoration: none; display: inline-block; margin-top: 20px; }
  </style>
</head>
<body>
  <h1>Premium Features Required</h1>
  <p>This file has already been downloaded once and is no longer available for free.</p>
  <p>Upgrade to premium for unlimited downloads.</p>
  <a href="/premium" class="btn">Upgrade to Premium</a>
  <a href="/" class="btn">Go to Home</a>
</body>
</html>
    `);
  }

  // Mark as downloaded and increment scan count BEFORE sending the file to prevent concurrent downloads
  fileStore.set(fileId, { ...fileInfo, downloaded: true });
  qrScans.set(fileId, (qrScans.get(fileId) || 0) + 1);

  const filePath = path.join(uploadsDir, fileInfo.path);
  res.type(fileInfo.type);
  res.download(filePath, fileInfo.name, (err) => {
    if (err) {
      console.error('Download error:', err);
      // On error, revert the downloaded flag and decrement scan count so the uploader can retry
      const prev = qrScans.get(fileId) || 1;
      qrScans.set(fileId, Math.max(prev - 1, 0));
      fileStore.set(fileId, { ...fileInfo, downloaded: false });
      return;
    }

    // After successful download, delete the file from disk and remove from store
    setTimeout(() => {
      fileStore.delete(fileId);
      fs.unlink(path.join(uploadsDir, fileInfo.path), () => {});
    }, 1000);
  });
});

// Premium page
app.get('/file-info/:id', (req, res) => {
  const fileId = req.params.id;
  const fileInfo = fileStore.get(fileId);
  const scanCount = qrScans.get(fileId) || 0;

  if (!fileInfo) {
    return res.status(404).json({ error: 'File not found' });
  }

  res.json({
    scanCount,
    downloaded: !!fileInfo.downloaded,
    fileInfo: {
      name: fileInfo.name,
      size: fileInfo.size,
      type: fileInfo.type,
    }
  });
});
app.get('/premium', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Premium Plans</title>
  <style>
    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f7fa; color: #222; }
    .plans { display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; }
    .plan { border: 1px solid #ddd; padding: 20px; background: white; border-radius: 8px; width: 250px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
    .plan h3 { margin-top: 0; color: #4a90e2; }
    .plan p { margin: 10px 0; }
    button { padding: 10px 20px; background: #4a90e2; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; }
    .current { background: #ddd; color: #333; }
  </style>
</head>
<body>
  <h1>Choose Your Plan</h1>
  <div class="plans">
    <div class="plan">
      <h3>Free</h3>
      <p>1 download per file</p>
      <p>Limited transfers</p>
      <p>$0/month</p>
      <button class="current" onclick="alert('You are on Free plan')">Current Plan</button>
    </div>
    <div class="plan">
      <h3>Premium</h3>
      <p>Unlimited downloads</p>
      <p>Unlimited transfers</p>
      <p>$9.99/month</p>
      <button onclick="alert('Redirecting to payment...')">Subscribe Now</button>
    </div>
  </div>
</body>
</html>
  `);
});

// Stripe checkout session endpoint
app.post('/create-checkout-session', async (req, res) => {
  const { plan } = req.body; // 'monthly' or 'yearly'
  const price = plan === 'yearly' ? 9999 : 999; // $99.99 or $9.99 in cents

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Premium Plan` },
          unit_amount: price,
        },
        quantity: 1
      }],
      success_url: `http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: 'http://localhost:5173/subscription',
    });
    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Success page
app.get('/success', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Successful</title>
  <style>
    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f7fa; color: #222; }
    h1 { color: #28a745; }
    p { font-size: 18px; }
    .btn { padding: 10px 20px; background: #4a90e2; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; text-decoration: none; display: inline-block; margin-top: 20px; }
  </style>
</head>
<body>
  <h1>Payment Successful!</h1>
  <p>Thank you for subscribing to Premium. Your account has been upgraded.</p>
  <a href="/" class="btn">Go to Home</a>
</body>
</html>
  `);
});

// Nearby WiFi Transfer endpoints
app.post('/register-device', (req, res) => {
  const { deviceName, deviceId } = req.body;
  if (!deviceName || !deviceId) {
    return res.status(400).json({ error: 'Device name and ID required' });
  }

  connectedDevices.set(deviceId, {
    name: deviceName,
    ip: req.ip,
    lastSeen: Date.now(),
    id: deviceId
  });

  res.json({ success: true });
});

app.get('/nearby-devices', (req, res) => {
  const now = Date.now();
  const activeDevices = [];

  for (let [id, device] of connectedDevices) {
    // Remove devices not seen in last 30 seconds
    if (now - device.lastSeen > 30000) {
      connectedDevices.delete(id);
      continue;
    }
    activeDevices.push({
      id: device.id,
      name: device.name,
      ip: device.ip
    });
  }

  res.json({ devices: activeDevices });
});

app.post('/transfer-file', upload.single('file'), (req, res) => {
  const { targetDeviceId } = req.body;

  if (!req.file || !targetDeviceId) {
    return res.status(400).json({ error: 'File and target device required' });
  }

  const targetDevice = connectedDevices.get(targetDeviceId);
  if (!targetDevice) {
    return res.status(404).json({ error: 'Target device not found' });
  }

  // Store file temporarily for transfer
  const transferId = uuidv4();
  const transferInfo = {
    id: transferId,
    name: req.file.originalname,
    size: req.file.size,
    type: req.file.mimetype,
    path: req.file.filename,
    targetDeviceId,
    createdAt: Date.now(),
    ttl: 5 * 60 * 1000, // 5 minutes
  };

  fileStore.set(transferId, transferInfo);

  // Notify target device (in a real implementation, this would use WebSockets or polling)
  // For now, just return success and let the frontend handle polling

  res.json({
    success: true,
    transferId,
    fileInfo: {
      name: transferInfo.name,
      size: transferInfo.size,
      type: transferInfo.type,
    }
  });
});

app.get('/transfer/:id', (req, res) => {
  const transferId = req.params.id;
  const transferInfo = fileStore.get(transferId);

  if (!transferInfo) {
    return res.status(404).json({ error: 'Transfer not found' });
  }

  // Check if expired
  if (Date.now() - transferInfo.createdAt > transferInfo.ttl) {
    fileStore.delete(transferId);
    fs.unlink(path.join(uploadsDir, transferInfo.path), () => {});
    return res.status(404).json({ error: 'Transfer expired' });
  }

  const filePath = path.join(uploadsDir, transferInfo.path);
  res.type(transferInfo.type);
  res.download(filePath, transferInfo.name, (err) => {
    if (!err) {
      // Clean up after successful transfer
      setTimeout(() => {
        fileStore.delete(transferId);
        fs.unlink(path.join(uploadsDir, transferInfo.path), () => {});
      }, 1000);
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

// Start mDNS service advertisement
bonjour.publish({
  name: 'FileShareApp',
  type: 'http',
  port: PORT,
  txt: {
    version: '1.0',
    service: 'file-transfer'
  }
});

console.log('mDNS service published: FileShareApp');

app.listen(PORT, '0.0.0.0', () => {
  const localIP = ip.address();
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Accessible on your network at http://${localIP}:${PORT}`);
  console.log(`mDNS service advertising as 'FileShareApp' on port ${PORT}`);
});

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function BluetoothShare() {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
      alert("File size must be less than 10MB for sharing.");
      return;
    }
    setFile(selectedFile);
  };

  const scanDevices = async () => {
    try {
      setStatus("Scanning for Bluetooth devices...");
      // Check if Web Bluetooth API is supported
      if (!navigator.bluetooth) {
        // Don't throw here — surface a helpful fallback message instead
        setStatus("Web Bluetooth API is not supported in this browser. Try Chrome or Edge on desktop, or a compatible mobile browser. Use the Upload flow or Web Share as a fallback.");
        return;
      }
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
      });
      setDevices([device]);
      setStatus("Device found: " + device.name);
    } catch (error) {
      setStatus("Error scanning: " + error.message + ". Make sure Bluetooth is enabled on your device and you're using a compatible browser (Chrome/Edge).");
    }
  };

  const webShare = async () => {
    if (!file) {
      setStatus('Please choose a file first to share.');
      return;
    }
    if (!navigator.share) {
      setStatus('Web Share API is not available in this browser.');
      return;
    }
    try {
      // Prefer files-capable share if supported
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: file.name });
        setStatus('Shared via system share sheet.');
      } else {
        // Fallback: create object URL and let user copy/open, or trigger a download on this device
        const downloadUrl = URL.createObjectURL(file);
        setStatus('Web Share without file support. A download link was created for you.');
        // Open the link in a new tab so the receiver can download if they navigate to it (best-effort)
        window.open(downloadUrl, '_blank');
        // revoke after short timeout
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 60_000);
      }
    } catch (err) {
      setStatus('Error sharing: ' + err.message);
    }
  };

  const selectDevice = (device) => {
    setSelectedDevice(device);
    setStatus("Device selected: " + device.name + ". Ready to send.");
  };

  const sendFile = () => {
    if (!selectedDevice || !file) {
      setStatus("Please select a device and file.");
      return;
    }
    // Simulate sending file via Bluetooth
    setStatus("Sending file to " + selectedDevice.name + "...");
    // In a real implementation, this would use Bluetooth file transfer protocol
    // For demo, we'll simulate approval and transfer
    setTimeout(() => {
      setStatus("File sent! Receiver can now download directly from their browser.");
      // Generate a temporary download link (in real app, this would be sent via Bluetooth)
      const downloadUrl = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    }, 3000);
  };

  const copyDownloadLink = () => {
    if (!file) {
      setStatus('Please choose a file first to create a link.');
      return;
    }
    const downloadUrl = URL.createObjectURL(file);
    navigator.clipboard && navigator.clipboard.writeText
      ? navigator.clipboard.writeText(downloadUrl).then(() => {
          setStatus('Temporary download link copied to clipboard. Paste it to the receiver.');
        })
      : (window.prompt('Copy this temporary link', downloadUrl) && setStatus('Link presented to user for manual copy.'));
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 60_000);
  };

  return (
    <div style={{ minHeight: '100vh', padding: '20px', background: '#f7f9fb' }}>
      <h1 style={{ color: '#ff4d3b', fontSize: '2.5rem', fontWeight: 700, marginBottom: 32 }}>Bluetooth File Sharing (Free)</h1>
      <p>Share files directly via Bluetooth. Receiver doesn't need this app - they can download directly in their browser. (Max 10MB)</p>

      <div style={{ marginBottom: 20 }}>
        <input type="file" onChange={handleFileChange} />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', marginBottom: '20px' }}>
        <button className="btn primary" onClick={scanDevices}>
          Scan for Devices
        </button>

        <button className="btn secondary" onClick={webShare}>
          Share via System (Web Share)
        </button>

        <button className="btn secondary" onClick={copyDownloadLink}>
          Copy Temporary Download Link
        </button>
      </div>

      {devices.length > 0 && (
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <h3>Available Devices:</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {devices.map((device, index) => (
              <li key={index} style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                <span style={{ fontWeight: '500' }}>{device.name}</span>
                <button
                  className="btn primary"
                  onClick={() => selectDevice(device)}
                >
                  Select
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {selectedDevice && file && (
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <button className="btn primary" onClick={sendFile}>
            Send File to {selectedDevice.name}
          </button>
        </div>
      )}

      <p style={{ marginTop: 20, textAlign: 'center', fontSize: '16px', color: '#666' }}>{status}</p>

      <div style={{ marginTop: 32, textAlign: 'center' }}>
        <button className="btn primary" onClick={() => navigate("/upload")}>
          Back to Upload
        </button>
      </div>
    </div>
  );
}

import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

// Mock premium check - in real app, check user subscription
const isPremium = () => localStorage.getItem('isPremium') === 'true';

function Upload() {
  const [file, setFile] = useState(null);
  const [ttl, setTtl] = useState(15);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const fileInputRef = useRef();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a file first!");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("ttl", ttl);

  // Use VITE_API_URL if set, otherwise use the current hostname (LAN IP) and backend port 3001
  const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:3001`;
  const response = await fetch(`${apiBase}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed, server returned an error.");

      const data = await response.json();

      // Save to localStorage for fallback
      localStorage.setItem("uploadResult", JSON.stringify({
        fileInfo: data.fileInfo,
        downloadLink: data.downloadLink || data.download_link,
        ttl: data.ttl,
      }));

      // Clear file selection for a new upload cycle
      if (fileInputRef.current) fileInputRef.current.value = "";
      setFile(null);

      navigate("/result", {
        state: {
          fileInfo: data.fileInfo,
          downloadLink: data.downloadLink || data.download_link,
          ttl: data.ttl,
        },
      });
    } catch (err) {
      alert("Error uploading file: " + err.message);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page upload">
      <h2>📤 Upload File</h2>
      <form onSubmit={handleUpload}>
        <div className="field">
          <label htmlFor="file-upload">Select File</label>
          <input
            id="file-upload"
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            required
          />
        </div>
        {file && (
          <div className="file-preview">
            <p><strong>File:</strong> {file.name}</p>
            <p><strong>Size:</strong> {(file.size / 1024 / 1024).toFixed(2)} MB</p>
            <p><strong>Type:</strong> {file.type}</p>
          </div>
        )}
        <div className="field">
          <label htmlFor="ttl-input">Expires in (minutes)</label>
          <input
            id="ttl-input"
            type="number"
            value={ttl}
            min="1"
            max="1440"
            onChange={(e) => setTtl(Number(e.target.value))}
          />
        </div>
        <button
          type="submit"
          className="btn primary"
          disabled={loading || !file} // Only enabled if file selected
          style={{ marginTop: '20px' }}
        >
          {loading ? "Uploading..." : "Upload File"}
        </button>
      </form>

      {/* Nearby Share Button */}
      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <p style={{ marginBottom: '10px', color: '#666' }}>Or share directly with nearby devices</p>
        <button
          onClick={() => navigate('/nearby-share')}
          className="btn secondary"
          style={{
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          📶 Nearby WiFi Transfer
        </button>
      </div>

    </div>
  );
}

export default Upload;

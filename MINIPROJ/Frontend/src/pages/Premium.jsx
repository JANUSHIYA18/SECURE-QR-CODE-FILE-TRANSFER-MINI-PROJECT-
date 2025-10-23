import React from "react";
import { useNavigate } from "react-router-dom";

export default function Premium() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f7f9fb' }}>
      <h1 style={{ color: '#ff4d3b', fontSize: '2.5rem', fontWeight: 700, marginBottom: 16 }}>Premium Features Required</h1>
      <p style={{ fontSize: '1.2rem', marginBottom: 8 }}>This QR code is no longer available for free downloads.</p>
      <p style={{ fontSize: '1.2rem', marginBottom: 32 }}>Upgrade to premium for unlimited scans and downloads!</p>
      <div>
        <button
          className="btn primary"
          style={{ marginRight: 12 }}
          onClick={() => navigate("/subscription")}
        >
          Upgrade to Premium
        </button>
        <button className="btn primary" onClick={() => navigate("/")}>Go to Home</button>
      </div>
    </div>
  );
}

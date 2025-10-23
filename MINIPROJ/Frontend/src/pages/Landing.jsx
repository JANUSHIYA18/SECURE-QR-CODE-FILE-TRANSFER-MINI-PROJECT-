import React from "react";
import { Link } from "react-router-dom";
import { Upload } from "lucide-react";

function Landing() {
  return (
    <div className="page landing">
      <h1>Welcome to AirBridge</h1>
      <p>Share files securely with one-time download links and QR codes. No cables, no hassle.</p>
      <Link to="/upload" className="btn primary" style={{ marginTop: '20px' }}>
        <Upload size={20}/> Start Sharing
      </Link>
    </div>
  );
}

export default Landing;


import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Copy, RefreshCw, Download, Share } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

export default function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialState = location.state || JSON.parse(localStorage.getItem("uploadResult")) || {};
  const { fileInfo, downloadLink, ttl } = initialState;

  const [shared, setShared] = useState(false);
  const [copied, setCopied] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [downloaded, setDownloaded] = useState(false);
  const [showSubscribePrompt, setShowSubscribePrompt] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [expirySeconds, setExpirySeconds] = useState(ttl ? ttl * 60 : 0);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    if (performance && performance.navigation && performance.navigation.type === 1) {
      window.location.replace("/");
    }
  }, []);

  useEffect(() => {
    if (!fileInfo || !downloadLink) return;

    const checkScans = async () => {
      try {
        const url = new URL(downloadLink);
        const parts = url.pathname.split("/").filter(Boolean);
        const fileId = parts[parts.length - 1];
        const infoUrl = `${url.origin}/file-info/${fileId}`;
        const response = await fetch(infoUrl);

        if (response.status === 404) {
          setDownloaded(true);
          setShowSubscribePrompt(true);
          return;
        }

        if (!response.ok) return;
        const data = await response.json();
        setScanCount(data.scanCount || 0);
        setDownloaded(!!data.downloaded);
        if (data.downloaded) setShowSubscribePrompt(true);
      } catch (err) {
        console.error("Error checking scan count:", err);
      }
    };

    checkScans();
    const interval = setInterval(checkScans, 3000);
    return () => clearInterval(interval);
  }, [fileInfo, downloadLink]);

  useEffect(() => {
    if (!fileInfo || !downloadLink || expirySeconds <= 0) return;
    const timer = setInterval(() => {
      setExpirySeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/", { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [fileInfo, downloadLink, expirySeconds, navigate]);

  const formatMMSS = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const addToHistory = (action) => {
    if (!fileInfo || !downloadLink) return;
    const record = {
      file: {
        name: fileInfo.name,
        size: fileInfo.size,
        type: fileInfo.type,
      },
      link: downloadLink,
      ttl,
      timestamp: new Date().toISOString(),
      action,
    };
    const prev = JSON.parse(localStorage.getItem("history")) || [];
    localStorage.setItem("history", JSON.stringify([record, ...prev]));
  };

  const copyToClipboard = async () => {
    if (showSubscribePrompt || downloaded) {
      setCopied("expired");
      setShowUpgrade(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }
    try {
      await navigator.clipboard.writeText(downloadLink);
      setCopied(true);
      addToHistory("copy");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const textArea = document.createElement("textarea");
      textArea.value = downloadLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      addToHistory("copy");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareLink = () => {
    if (showSubscribePrompt || downloaded) {
      setShared("expired");
      setShowUpgrade(true);
      setTimeout(() => setShared(false), 2000);
      return;
    }
    setShared(true);
    setShowShareOptions(prev => !prev);
    addToHistory("share");
    setTimeout(() => setShared(false), 2000);
  };

  const handleDownload = () => {
    if (showSubscribePrompt || downloaded) {
      setDownloaded("expired");
      setShowUpgrade(true);
      setTimeout(() => setDownloaded(false), 2000);
      return;
    }
    window.open(downloadLink, "_blank");
    addToHistory("download");
  };

  const shareToWhatsApp = () => {
    const text = `Download your file: ${fileInfo.name} ${downloadLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    addToHistory("share_whatsapp");
  };

  const shareToTelegram = () => {
    const text = `Download your file: ${fileInfo.name}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(downloadLink)}&text=${encodeURIComponent(text)}`, "_blank");
    addToHistory("share_telegram");
  };

  const shareToEmail = () => {
    const subject = "File Download";
    const body = `Download your file: ${fileInfo.name}\n${downloadLink}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
    addToHistory("share_email");
  };

  const shareToTwitter = () => {
    const text = `Download your file: ${fileInfo.name} ${downloadLink}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
    addToHistory("share_twitter");
  };

  if (!fileInfo || !downloadLink) {
    return (
      <div className="page">
        <div className="container">
          <p>No file uploaded. Redirecting to home...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page result">
      <div className="container">
        <h1> File Ready for Download</h1>
        {showSubscribePrompt || downloaded ? (
          <div
            className="qr-closed-box"
            style={{
              border: "1px dashed #ccc",
              background: "#f8f9fb",
              padding: "32px",
              margin: "24px 0",
              borderRadius: "12px",
              textAlign: "center",
              color: "#444",
              fontSize: "1.2rem",
              fontWeight: 500,
            }}
          >
            <div style={{ fontSize: "2.2rem", marginBottom: "8px" }}>
              <span role="img" aria-label="lock"></span> QR Code Closed
            </div>
            <div style={{ fontSize: "1rem", color: "#888" }}>
              File was downloaded or scanned. QR is now hidden everywhere.
            </div>
          </div>
        ) : (
          <div className="qr-section">
            <h2>Scan QR Code to Download</h2>
            <div className="qr-container">
              <QRCodeCanvas
                value={downloadLink}
                size={200}
                bgColor="#fff"
                fgColor="#000"
                level="M"
              />
            </div>
            <p className="qr-help">Scan with any device to download the file</p>
          </div>
        )}
        <div className="file-info">
          <h2>File Details</h2>
          <div className="info-grid">
            <p><strong> Name:</strong> {fileInfo.name}</p>
            <p><strong> Size:</strong> {(fileInfo.size / 1024 / 1024).toFixed(2)} MB</p>
            <p><strong> Type:</strong> {fileInfo.type}</p>
            <p><strong> Expires in:</strong> {expirySeconds <= 0 ? "Expired!" : formatMMSS(expirySeconds)}</p>
          </div>
        </div>
        <div className="download-section">
          <h2>Download Link (One-Time Use)</h2>
          <div className="link-display">
            <a href={downloadLink} target="_blank" rel="noopener noreferrer">{downloadLink}</a>
          </div>
          <div className="actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', marginTop: '20px' }}>
            <button className="btn secondary" onClick={copyToClipboard}>
              <Copy size={18} />
              {copied === "expired" ? "Link Expired" : copied ? "Copied!" : "Copy Link"}
            </button>
            <button className="btn secondary" onClick={handleShareLink}>
              <Share size={18} />
              {shared === "expired" ? "Link Expired" : shared ? "Choose app!" : "Share Link"}
            </button>
            <button className="btn secondary" onClick={handleDownload}>
              <Download size={18} />
              {downloaded === "expired" ? "Link Expired" : "Download"}
            </button>
            <button className="btn primary" onClick={() => navigate("/upload")}>
              <RefreshCw size={18} />
              New Upload
            </button>
          </div>
          {/* Always show Upgrade button below actions if any expired state is active */}
          {showUpgrade && (
            <div style={{ marginTop: 24, textAlign: "center" }}>
              <button className="btn primary" onClick={() => navigate("/premium")}>Upgrade to Premium</button>
            </div>
          )}
          {showShareOptions && !showSubscribePrompt && !downloaded && (
            <div className="share-options" style={{ marginTop: '24px', textAlign: 'center' }}>
              <h3 style={{ marginBottom: '16px' }}>Share to Apps</h3>
              <div className="share-buttons" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' }}>
                <button className="btn share-btn" onClick={shareToWhatsApp}>WhatsApp</button>
                <button className="btn share-btn" onClick={shareToTelegram}>Telegram</button>
                <button className="btn share-btn" onClick={shareToEmail}>Email</button>
                <button className="btn share-btn" onClick={shareToTwitter}>Twitter</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

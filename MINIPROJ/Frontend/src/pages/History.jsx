import React, { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

function History() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("history")) || [];
    setHistory(saved);
  }, []);

  const clearAll = () => {
    setHistory([]);
    localStorage.setItem("history", JSON.stringify([]));
  };

  const clearOne = (index) => {
    const newHistory = history.filter((_, i) => i !== index);
    setHistory(newHistory);
    localStorage.setItem("history", JSON.stringify(newHistory));
  };

  // Human readable action names
  const actionLabel = (action) => {
    switch (action) {
      case "download": return "Download";
      case "transfer": return "Transfer (actual download used)";
      case "copy": return "Copy Link";
      case "share": return "Share Link";
      case "share_whatsapp": return "Share to WhatsApp";
      case "share_telegram": return "Share to Telegram";
      case "share_email": return "Share to Email";
      case "share_twitter": return "Share to Twitter";
      default: return action;
    }
  };

  return (
    <div className="page history">
      <div className="history-header">
        <h2>📜 Transfer & Action History</h2>
        {history.length > 0 && (
          <button className="btn secondary" onClick={clearAll}>
            <Trash2 size={16} />
            Clear All
          </button>
        )}
      </div>
      {history.length === 0 ? (
        <p>No actions yet.</p>
      ) : (
        <ul>
          {history.map((h, i) => (
            <li key={i}>
              <div className="content">
                <strong>{h.file.name}</strong> ({(h.file.size / 1024).toFixed(1)} KB) -{" "}
                <a href={h.link} target="_blank" rel="noreferrer">
                  {h.link}
                </a>{" "}
                ({h.ttl} min) {h.timestamp && <>- <em>{new Date(h.timestamp).toLocaleString()}</em></>}<br/>
                <span>Action: <strong>{actionLabel(h.action)}</strong></span>
              </div>
              <button className="btn secondary" onClick={() => clearOne(i)}>
                <Trash2 size={14} />
                Clear
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default History;

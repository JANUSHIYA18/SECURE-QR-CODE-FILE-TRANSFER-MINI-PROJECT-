import React from "react";
import { useNavigate } from "react-router-dom";

export default function Success() {
  const navigate = useNavigate();

  React.useEffect(() => {
    // Set premium status on success
    localStorage.setItem('isPremium', 'true');
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f7f9fb' }}>
      <h1 style={{ color: '#28a745', fontSize: '2.5rem', fontWeight: 700, marginBottom: 16 }}>Payment Successful!</h1>
      <p style={{ fontSize: '1.2rem', marginBottom: 8 }}>Thank you for subscribing to Premium.</p>
      <p style={{ fontSize: '1.2rem', marginBottom: 32 }}>Your account has been upgraded to unlimited features.</p>
      <button
        className="btn primary"
        onClick={() => navigate("/")}
      >
        Go to Home
      </button>
    </div>
  );
}

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Subscription() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (plan) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan })
      });
      const data = await response.json();
      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        alert('Error creating checkout session');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Payment failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', padding: '20px', background: '#f7f9fb', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1 style={{ color: '#ff4d3b', fontSize: '2.5rem', fontWeight: 700, marginBottom: 32 }}>Subscription Plans</h1>

      <div style={{ width: '100%', maxWidth: '800px' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: 16 }}>Current Pack</h2>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: 32 }}>
          <h3>Free Plan</h3>
          <p>Limited scans and downloads.</p>
          <ul>
            <li>Up to 5 QR code scans per day</li>
            <li>Basic download options</li>
          </ul>
        </div>

        <h2 style={{ fontSize: '1.8rem', marginBottom: 16 }}>Premium Subscription Options</h2>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', flex: '1 1 300px' }}>
            <h3>Monthly Premium</h3>
            <p>$9.99/month</p>
            <ul>
              <li>Unlimited scans</li>
              <li>High-quality downloads</li>
              <li>Priority support</li>
            </ul>
            <button
              className="btn primary"
              style={{
                marginTop: 16,
                padding: '14px 28px',
                fontSize: '16px',
                fontWeight: '600',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #ff4d3b 0%, #ff6b5b 100%)',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(255, 77, 59, 0.3)',
                minWidth: '180px'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(255, 77, 59, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(255, 77, 59, 0.3)';
              }}
              onClick={() => handleSubscribe('monthly')}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Subscribe Monthly'}
            </button>
          </div>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', flex: '1 1 300px' }}>
            <h3>Yearly Premium</h3>
            <p>$99/year (Save 17%)</p>
            <ul>
              <li>Unlimited scans</li>
              <li>High-quality downloads</li>
              <li>Priority support</li>
              <li>Bluetooth file sharing</li>
              <li>Exclusive features</li>
            </ul>
            <button
              className="btn primary"
              style={{
                marginTop: 16,
                padding: '14px 28px',
                fontSize: '16px',
                fontWeight: '600',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #ff4d3b 0%, #ff6b5b 100%)',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(255, 77, 59, 0.3)',
                minWidth: '180px'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(255, 77, 59, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(255, 77, 59, 0.3)';
              }}
              onClick={() => handleSubscribe('yearly')}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Subscribe Yearly'}
            </button>
          </div>
        </div>
      </div>

      <button
        className="btn primary"
        style={{
          marginTop: 40,
          padding: '14px 32px',
          fontSize: '16px',
          fontWeight: '600',
          borderRadius: '12px',
          border: 'none',
          background: 'linear-gradient(135deg, #4a90e2 0%, #5ba3f5 100%)',
          color: 'white',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 15px rgba(74, 144, 226, 0.3)',
          minWidth: '160px'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 6px 20px rgba(74, 144, 226, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = '0 4px 15px rgba(74, 144, 226, 0.3)';
        }}
        onClick={() => navigate("/")}
      >
        Go to Home
      </button>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wifi, Upload, Download, Users, ArrowLeft } from 'lucide-react';

const NearbyShare = () => {
  const [devices, setDevices] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [transferStatus, setTransferStatus] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [deviceId] = useState(() => Math.random().toString(36).substr(2, 9));
  const navigate = useNavigate();

  // Register this device when component mounts
  useEffect(() => {
    const registerDevice = async () => {
      const name = deviceName || `Device-${deviceId.slice(0, 4)}`;
      try {
        await fetch('http://localhost:3001/register-device', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceName: name, deviceId })
        });
      } catch (error) {
        console.error('Failed to register device:', error);
      }
    };

    if (deviceName || deviceId) {
      registerDevice();
    }
  }, [deviceName, deviceId]);

  // Poll for nearby devices
  useEffect(() => {
    const pollDevices = async () => {
      try {
        const response = await fetch('http://localhost:3001/nearby-devices');
        const data = await response.json();
        setDevices(data.devices.filter(d => d.id !== deviceId)); // Exclude self
      } catch (error) {
        console.error('Failed to fetch devices:', error);
      }
    };

    pollDevices();
    const interval = setInterval(pollDevices, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [deviceId]);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleTransfer = async (targetDeviceId) => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    setIsUploading(true);
    setTransferStatus('Sending file...');

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('targetDeviceId', targetDeviceId);

    try {
      const response = await fetch('http://localhost:3001/transfer-file', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        setTransferStatus('File sent successfully!');
        setSelectedFile(null);
      } else {
        setTransferStatus('Failed to send file');
      }
    } catch (error) {
      console.error('Transfer error:', error);
      setTransferStatus('Transfer failed');
    } finally {
      setIsUploading(false);
      setTimeout(() => setTransferStatus(''), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
          >
            <ArrowLeft size={20} />
            Back to Home
          </button>
          <div className="flex items-center gap-2 text-blue-600">
            <Wifi size={24} />
            <span className="font-semibold">Nearby WiFi Transfer</span>
          </div>
        </div>

        {/* Device Registration */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users size={20} />
            Your Device
          </h2>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Enter device name (optional)"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-600">
              ID: {deviceId}
            </div>
          </div>
        </div>

        {/* File Selection */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Upload size={20} />
            Select File to Share
          </h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              id="file-input"
            />
            <label htmlFor="file-input" className="cursor-pointer">
              <div className="text-gray-500 mb-2">
                <Upload size={48} className="mx-auto mb-4" />
                <p className="text-lg">Click to select a file</p>
                <p className="text-sm">Any file type supported</p>
              </div>
            </label>
            {selectedFile && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="font-medium text-blue-800">{selectedFile.name}</p>
                <p className="text-sm text-blue-600">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Nearby Devices */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Wifi size={20} />
            Nearby Devices ({devices.length})
          </h2>

          {devices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Wifi size={48} className="mx-auto mb-4 opacity-50" />
              <p>No nearby devices found</p>
              <p className="text-sm">Make sure other devices are on the same WiFi network</p>
            </div>
          ) : (
            <div className="space-y-3">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{device.name}</p>
                      <p className="text-sm text-gray-500">{device.ip}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleTransfer(device.id)}
                    disabled={!selectedFile || isUploading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                  >
                    {isUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Download size={16} />
                        Send File
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          {transferStatus && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">{transferStatus}</p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 rounded-xl p-6 mt-6">
          <h3 className="font-semibold text-blue-800 mb-2">How it works:</h3>
          <ol className="text-sm text-blue-700 space-y-1">
            <li>1. Make sure all devices are connected to the same WiFi network</li>
            <li>2. Select a file to share</li>
            <li>3. Choose a nearby device from the list</li>
            <li>4. Click "Send File" - the transfer happens instantly over local WiFi</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default NearbyShare;

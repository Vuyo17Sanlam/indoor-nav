// QRScannerButton.js
import React, { useState } from "react";
import "./QRScannerButton.css";

const QRScannerButton = ({ onScanComplete }) => {
  const [isScanning, setIsScanning] = useState(false);

  const handleScanClick = () => {
    setIsScanning(true);

    // In a real implementation, you would integrate with a QR scanning library
    // For now, we'll simulate scanning with a demo
    simulateQRScan();
  };

  const simulateQRScan = () => {
    // Simulate scanning process
    setTimeout(() => {
      // This is where you would get the actual QR code data
      // For demo purposes, we'll use a mock QR code
      const mockQRData = {
        type: "roofRef",
        code: "A101",
        timestamp: new Date().toISOString(),
      };

      if (onScanComplete) {
        onScanComplete(mockQRData);
      }

      setIsScanning(false);
    }, 1500);
  };

  const handleManualInput = () => {
    const code = prompt("Enter QR code data manually:");
    if (code && onScanComplete) {
      onScanComplete({
        type: "manual",
        code: code,
        timestamp: new Date().toISOString(),
      });
    }
  };

  return (
    <div className="qr-scanner-container">
      <button
        className={`qr-scanner-btn ${isScanning ? "scanning" : ""}`}
        onClick={handleScanClick}
        disabled={isScanning}
        title="Scan QR Code"
      >
        <span className="qr-icon">{isScanning ? "⌛" : "📷"}</span>
        <span className="qr-text">
          {isScanning ? "Scanning..." : "Scan QR"}
        </span>
      </button>

      {/* Manual input option - appears on hover */}
      <div className="qr-manual-option">
        <button
          className="qr-manual-btn"
          onClick={handleManualInput}
          title="Enter QR code manually"
        >
          ⌨️
        </button>
      </div>
    </div>
  );
};

export default QRScannerButton;

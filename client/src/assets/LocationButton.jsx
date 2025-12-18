import React, { useState } from 'react';
import axios from 'axios';

const LocationSender = () => {
  const [status, setStatus] = useState("");
  const [location, setLocation] = useState(null);

  const handleShareLocation = () => {
    setStatus("Locating...");

    if (!navigator.geolocation) {
      setStatus("Geolocation is not supported by your browser");
      return;
    }

    // 1. Try High Accuracy
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      (error) => {
        // 2. On fail, try Low Accuracy (Laptop Mode)
        console.log("High accuracy failed, switching to fallback...");
        navigator.geolocation.getCurrentPosition(
            handleSuccess,
            (err) => {
                 setStatus("Unable to retrieve location.");
                 console.error(err);
            },
            { enableHighAccuracy: false, timeout: 10000 }
        );
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const handleSuccess = async (position) => {
    const { latitude, longitude } = position.coords;
    setStatus("Location found! Sending...");
    setLocation({ latitude, longitude });

    try {
      // Ensure your backend is running
      await axios.post('http://localhost:5000/api/save-location', {
        latitude,
        longitude,
        userId: "user_123"
      });
      setStatus("Location shared successfully!");
    } catch (err) {
      setStatus("Failed to send to server (Network Error).");
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h3>Emergency Assistance</h3>
      <p>Share your current location for rescue operations.</p>
      
      <button 
        onClick={handleShareLocation}
        style={{
          backgroundColor: '#ff4d4d', color: 'white', padding: '10px 20px', 
          border: 'none', cursor: 'pointer', borderRadius: '5px'
        }}
      >
        📍 Share My Exact Location
      </button>

      {status && <p style={{ marginTop: '10px' }}><strong>Status:</strong> {status}</p>}
      
      {location && (
        <div style={{ marginTop: '10px', fontSize: '0.9em', color: '#555' }}>
          Lat: {location.latitude}, Long: {location.longitude}
        </div>
      )}
    </div>
  );
};

export default LocationSender;
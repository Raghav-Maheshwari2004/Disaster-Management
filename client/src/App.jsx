import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css'; // You can add basic styling here

function App() {
  const [logs, setLogs] = useState([
    { id: 1, message: "System initialized...", time: "10:00 AM" }
  ]);

  // Placeholder for when we add the backend later
  const handleUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Logic to send file to backend will go here later
      const newLog = { 
        id: logs.length + 1, 
        message: `Uploading: ${file.name}...`, 
        time: new Date().toLocaleTimeString() 
      };
      setLogs([newLog, ...logs]);
    }
  };

  return (
    <div className="dashboard-container" style={{ display: 'flex', height: '100vh' }}>
      
      {/* LEFT SIDE: The Map */}
      <div className="map-section" style={{ flex: 3 }}>
        <MapContainer center={[12.9692, 79.1559]} zoom={13} style={{ height: "100%", width: "100%" }}>
          {/* Using OpenStreetMap tiles */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          {/* Example Marker (VIT Vellore coordinates) */}
          <Marker position={[12.9692, 79.1559]}>
            <Popup>Disaster Control Center (VIT)</Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* RIGHT SIDE: Controls & Logs */}
      <div className="sidebar" style={{ flex: 1, padding: '20px', background: '#f4f4f4', borderLeft: '2px solid #ccc' }}>
        <h2>🚨 Rescue Ops Center</h2>
        
        {/* Upload Section */}
        <div className="upload-box" style={{ background: 'white', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          <h3>Analyze Debris</h3>
          <input type="file" onChange={handleUpload} />
          <p style={{fontSize: '12px', color: '#666'}}>Upload drone image for analysis</p>
        </div>

        {/* Live Logs */}
        <div className="logs-box">
          <h3>Live Activity</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {logs.map(log => (
              <li key={log.id} style={{ borderBottom: '1px solid #ddd', padding: '10px 0' }}>
                <span style={{ fontWeight: 'bold', color: '#555' }}>[{log.time}]</span> {log.message}
              </li>
            ))}
          </ul>
        </div>
      </div>

    </div>
  );
}

export default App;
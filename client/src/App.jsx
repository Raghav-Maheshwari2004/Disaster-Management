import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import './App.css';

function App() {
  // State for Logs
  const [logs, setLogs] = useState([
    { id: 1, message: "System initialized...", time: "10:00 AM" }
  ]);
  
  // State for UI Loading
  const [loading, setLoading] = useState(false);
  
  // State for AI Results
  const [detections, setDetections] = useState([]); 
  const [annotatedImage, setAnnotatedImage] = useState(null); // <--- Stores the URL of the image with boxes

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Reset previous results
    setDetections([]);
    setAnnotatedImage(null);
    
    // Add "Uploading" log
    const tempLogId = Date.now();
    setLogs(prev => [{ id: tempLogId, message: `Uploading: ${file.name}...`, time: new Date().toLocaleTimeString() }, ...prev]);
    setLoading(true);

    const formData = new FormData();
    formData.append('image', file);

    try {
      // 1. Send to Node Server
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      console.log("Server Response:", response.data);

      // 2. Extract Data from Response
      const aiResult = response.data.ai_data;
      const foundObjects = aiResult.detections || [];
      const imageUrl = response.data.annotatedUrl; // This comes from our updated server code

      // 3. Update State
      setDetections(foundObjects);
      setAnnotatedImage(imageUrl);

      // 4. Update Logs
      setLogs(prev => [
        { id: Date.now(), message: `✅ Analysis Complete. Found ${foundObjects.length} objects.`, time: new Date().toLocaleTimeString() },
        ...prev
      ]);

    } catch (error) {
      console.error("Upload Error:", error);
      setLogs(prev => [
        { id: Date.now(), message: `❌ Error: ${error.message}`, time: new Date().toLocaleTimeString() },
        ...prev
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      
      {/* LEFT SIDE: Map */}
      <div className="map-section">
        <MapContainer center={[12.9692, 79.1559]} zoom={13} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          <Marker position={[12.9692, 79.1559]}>
            <Popup>Disaster Control Center (VIT)</Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* RIGHT SIDE: Controls & Results */}
      <div className="sidebar">
        <h2>🚨 Rescue Ops Center</h2>
        
        {/* Upload Box */}
        <div className="upload-box" style={{ background: 'white', padding: '15px', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
          <h3>Analyze Debris</h3>
          <input type="file" onChange={handleUpload} disabled={loading} accept="image/*" />
          
          {loading && <p style={{color: '#e65100', fontWeight: 'bold', marginTop: '10px'}}>🤖 AI is analyzing image...</p>}
          <p style={{fontSize: '12px', color: '#666', marginTop: '5px'}}>Upload drone image for analysis</p>
        </div>

        {/* --- NEW: IMAGE RESULT SECTION --- */}
        {annotatedImage && (
          <div className="image-result-box" style={{ marginBottom: '20px' }}>
            <h3 style={{marginTop:0, color: '#1565c0'}}>📸 Debris Analysis:</h3>
            <div style={{ border: '2px solid #2196f3', borderRadius: '8px', overflow: 'hidden' }}>
                <img 
                  src={annotatedImage} 
                  alt="Analyzed Output" 
                  style={{ width: '100%', display: 'block' }} 
                />
            </div>
          </div>
        )}

        {/* --- TEXT RESULT SECTION --- */}
        {detections.length > 0 && (
          <div className="results-box" style={{ background: '#e3f2fd', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #90caf9' }}>
            <h3 style={{marginTop:0, color: '#0d47a1'}}>🔍 AI Found:</h3>
            <ul style={{paddingLeft: '20px', margin: 0}}>
              {detections.map((item, index) => (
                <li key={index} style={{fontWeight: 'bold', marginBottom: '4px'}}>
                  {item.label.toUpperCase()} 
                  <span style={{color: '#666', fontSize:'0.9em', marginLeft: '8px'}}>
                    ({(item.confidence * 100).toFixed(0)}%)
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Live Logs */}
        <div className="logs-box">
          <h3>Live Activity</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {logs.map(log => (
              <li key={log.id} style={{ borderBottom: '1px solid #ddd', padding: '10px 0', fontSize: '13px' }}>
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
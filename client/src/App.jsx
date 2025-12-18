import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './App.css'; 

// --- FIX: Leaflet Default Icon Hack ---
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- Map Component to handle "Fly To" animation ---
function MapUpdater({ location }) {
  const map = useMap();
  useEffect(() => {
    if (location) {
      map.flyTo([location.latitude, location.longitude], 13);
    }
  }, [location, map]);
  return null;
}

function App() {
  const [file, setFile] = useState(null);
  const [logs, setLogs] = useState(["[System Init] Waiting for user action..."]);
  const [locationStatus, setLocationStatus] = useState("");
  const [location, setLocation] = useState(null); 
  const [isOffline, setIsOffline] = useState(false); 
  
  // Default Map Center (Vellore/India)
  const defaultCenter = [12.9692, 79.1559]; 

  const addLog = (message) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${time}] ${message}`, ...prev]);
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    addLog("File selected ready for analysis.");
  };

  // --- THE "TRIPLE REDUNDANCY" LOCATION SYSTEM ---
  const handleShareLocation = () => {
    setLocationStatus("Locating...");
    setIsOffline(false);
    addLog("1. Attempting High Accuracy GPS...");

    if (!navigator.geolocation) {
      setLocationStatus("Not Supported");
      return;
    }

    // LAYER 1: High Accuracy (GPS) - 5 second timeout
    navigator.geolocation.getCurrentPosition(
      handleSuccess, 
      (error) => {
        console.warn("GPS failed, trying Wi-Fi...");
        addLog("⚠️ GPS timed out. Switching to Wi-Fi triangulation...");
        
        // LAYER 2: Low Accuracy (Wi-Fi) - 10 second timeout
        navigator.geolocation.getCurrentPosition(
            handleSuccess, 
            (error2) => {
                console.warn("Wi-Fi failed, trying IP...");
                addLog("⚠️ Wi-Fi location failed. Fetching IP-based location...");
                
                // LAYER 3: IP Geolocation (The "Nuclear Option")
                fetchIPLocation();
            }, 
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
        );
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  // Helper: Get location from IP address
  const fetchIPLocation = async () => {
      try {
          // Using free IPAPI service
          const response = await axios.get('https://ipapi.co/json/');
          const { latitude, longitude, city } = response.data;
          
          if (latitude && longitude) {
              const position = { coords: { latitude, longitude } };
              addLog(`✅ Location found via IP (${city})`);
              handleSuccess(position);
          } else {
              throw new Error("Invalid IP data");
          }
      } catch (error) {
          handleError(new Error("All location methods failed. Check connection."));
      }
  };

  const handleSuccess = async (position) => {
    const { latitude, longitude } = position.coords;
    setLocation({ latitude, longitude }); 
    
    // Log success if not already logged by IP fetcher
    if (!logs[0].includes("via IP")) {
        addLog(`✅ Precise Location Locked: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    }
    
    setLocationStatus("Sending...");

    try {
      // Send to your Node.js Server
      await axios.post('http://localhost:5000/api/save-location', {
        latitude,
        longitude,
        userId: "user_rescue_01" 
      });
      setLocationStatus("Sent to HQ");
      addLog("✅ Coordinates uploaded to server.");
    } catch (error) {
      console.error("Server Error:", error);
      setLocationStatus("Offline Mode");
      setIsOffline(true);
      addLog("⚠️ Server unreachable. Switched to Manual Mode.");
    }
  };

  const handleError = (error) => {
    console.error(error);
    setLocationStatus("Location Failed");
    addLog(`❌ CRITICAL ERROR: ${error.message}`);
  };

  // --- MANUAL SHARING TOOLS ---
  const sendWhatsApp = () => {
    if (!location) return;
    const message = `SOS! Help needed. Location: https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    window.open(`https://web.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
    addLog("💬 WhatsApp Web Triggered.");
  };

  // --- Draggable Marker ---
  function DraggableMarker() {
    const markerRef = useRef(null);
    const eventHandlers = useMemo(() => ({
        dragend() {
          const marker = markerRef.current;
          if (marker != null) {
            const { lat, lng } = marker.getLatLng();
            setLocation({ latitude: lat, longitude: lng });
            addLog(`📍 Pin moved manually: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          }
        },
      }), []);

    if (location === null) return null;

    return (
      <Marker draggable={true} eventHandlers={eventHandlers} position={[location.latitude, location.longitude]} ref={markerRef}>
        <Popup minWidth={90}><span>📍 <b>You are here</b><br/>Drag to adjust</span></Popup>
      </Marker>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f0f2f5', minHeight: '100vh', textAlign: 'center' }}>
      
      <h1 style={{ marginBottom: '30px', color: '#333' }}>🚨 Rescue Ops Center</h1>

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px' }}>
        
        {/* LEFT COLUMN */}
        <div style={{ width: '100%', maxWidth: '400px' }}>
          
          {/* 1. Upload Section */}
          <div style={cardStyle}>
            <h3>Analyze Debris</h3>
            <input type="file" onChange={handleFileChange} style={{ marginBottom: '10px' }} />
            <p style={{ fontSize: '12px', color: '#666' }}>{file ? file.name : "No file chosen"}</p>
          </div>

          {/* 2. Location Section */}
          <div style={cardStyle}>
            <h3>📍 Emergency Location</h3>
            <p style={{ fontSize: '14px', color: '#555', marginBottom: '15px' }}>
               Share your precise coordinates with the team.
            </p>
            
            <button onClick={handleShareLocation} style={buttonStyle}>
              {locationStatus === "Locating..." ? "Acquiring Signal..." : "Find My Location"}
            </button>

            {/* Success / Offline Options */}
            {location && (
              <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                 <div style={{fontSize:'12px', color: 'green', marginBottom: '5px'}}>
                   <b>Lat:</b> {location.latitude.toFixed(5)}, <b>Lng:</b> {location.longitude.toFixed(5)}
                 </div>
                 
                 <button onClick={sendWhatsApp} style={{...actionBtnStyle, backgroundColor: '#25D366'}}>
                   💬 Share on WhatsApp
                 </button>
              </div>
            )}
          </div>

          {/* 3. Logs Section */}
          <div style={{ ...cardStyle, textAlign: 'left', maxHeight: '200px', overflowY: 'auto' }}>
            <h4 style={{ margin: '0 0 10px 0' }}>Live Activity</h4>
            <div style={{ fontSize: '12px', color: '#333' }}>
              {logs.map((log, index) => (
                <div key={index} style={{ borderBottom: '1px solid #eee', padding: '4px 0' }}>{log}</div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: MAP */}
        <div style={{ ...cardStyle, width: '100%', maxWidth: '600px', height: '500px', padding: '0', overflow: 'hidden' }}>
          <MapContainer center={defaultCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© OpenStreetMap contributors' />
            <MapUpdater location={location} />
            <DraggableMarker />
          </MapContainer>
        </div>

      </div>
    </div>
  );
}

// --- Styles ---
const cardStyle = {
  backgroundColor: 'white', padding: '20px', borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginBottom: '20px'
};

const buttonStyle = {
  backgroundColor: '#ff4d4d', color: 'white', padding: '12px 24px',
  border: 'none', borderRadius: '6px', cursor: 'pointer',
  fontSize: '16px', fontWeight: 'bold', width: '100%'
};

const actionBtnStyle = {
  color: 'white', padding: '10px', border: 'none',
  borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', width: '100%'
};

export default App;
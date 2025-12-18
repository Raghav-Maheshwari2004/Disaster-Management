const express = require('express');
const cors = require('cors'); // Required for frontend connection
const multer = require('multer');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = 5000;

// The address of your Python Brain (AI Service)
const AI_SERVICE_URL = 'http://127.0.0.1:8000/detect'; 

// --- Middleware ---
app.use(cors()); // Enables the frontend to talk to this server
app.use(express.json()); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Setup Storage (Multer) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Ensure this folder exists!
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// --- Routes ---

app.get('/', (req, res) => {
    res.send('Disaster Management Server is Running!');
});

// 1. Upload Image & Trigger AI
app.post('/upload', upload.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    console.log(`📸 Image received: ${req.file.filename}`);

    try {
        const payload = { image_path: `server/uploads/${req.file.filename}` };
        console.log("🤖 Asking AI to analyze...");

        const aiResponse = await axios.post(AI_SERVICE_URL, payload);
        console.log("✅ AI Analysis Complete:", aiResponse.data);

        res.json({ 
            message: "Analysis Successful", 
            filename: req.file.filename,
            ai_data: aiResponse.data,
            annotatedUrl: `http://localhost:5000/uploads/${path.basename(aiResponse.data.annotated_image)}`
        });

    } catch (error) {
        console.error("❌ AI Error:", error.message);
        res.json({ 
            message: "Upload saved, but AI failed.", 
            filename: req.file.filename,
            error: "AI Service Unavailable"
        });
    }
});

// 2. Save User Location Route
app.post('/api/save-location', (req, res) => {
    const { latitude, longitude, userId } = req.body;

    if (!latitude || !longitude) {
        return res.status(400).json({ error: "Invalid location data" });
    }

    console.log("-----------------------------------------");
    console.log(`📍 Location Received from User ${userId || 'Guest'}:`);
    console.log(`   Lat: ${latitude}, Long: ${longitude}`);
    console.log("-----------------------------------------");

    res.json({ 
        message: "Location received successfully",
        coords: { latitude, longitude }
    });
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`✅ HQ Server is running on http://localhost:${PORT}`);
});
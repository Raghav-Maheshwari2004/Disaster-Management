const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const axios = require('axios'); // Import Axios

const app = express();
const PORT = 5000;
const AI_SERVICE_URL = 'http://127.0.0.1:8000/detect'; // The address of your Python Brain

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Setup Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Route: Check if server is running
app.get('/', (req, res) => {
    res.send('Disaster Management Server is Running!');
});

// Route: Upload Image & Trigger AI
app.post('/upload', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    console.log(`📸 Image received: ${req.file.filename}`);

    try {
        // 1. Prepare the payload for Python
        // Python expects a path relative to the root project folder
        const payload = {
            image_path: `server/uploads/${req.file.filename}`
        };

        console.log("🤖 Asking AI to analyze...");

        // 2. Send request to Python AI Service
        const aiResponse = await axios.post(AI_SERVICE_URL, payload);

        console.log("✅ AI Analysis Complete:", aiResponse.data);

        // 3. Send the AI results back to the Frontend
        res.json({ 
            message: "Analysis Successful", 
            filename: req.file.filename,
            ai_data: aiResponse.data,
            // Construct the URL for the annotated image
            // Python sends "server/uploads/img_annotated.jpg", we just need the filename part
            annotatedUrl: `http://localhost:5000/uploads/${path.basename(aiResponse.data.annotated_image)}`
        });

    } catch (error) {
        console.error("❌ AI Error:", error.message);
        // If AI fails, still return the image info so the app doesn't crash
        res.json({ 
            message: "Upload saved, but AI failed.", 
            filename: req.file.filename,
            error: "AI Service Unavailable"
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
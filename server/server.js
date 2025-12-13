const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Setup Storage for uploaded images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Images will be saved in an 'uploads' folder
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Create uploads folder if it doesn't exist (Manual step: create 'uploads' folder in server directory)

// Route: Check if server is running
app.get('/', (req, res) => {
    res.send('Disaster Management Server is Running!');
});

// Route: Upload Image
app.post('/upload', upload.single('image'), (req, res) => {
    // This is where we will eventually trigger the Python AI script
    console.log("File received:", req.file);
    
    // Simulate a response
    res.json({ 
        message: "Image received successfully!", 
        filePath: `/uploads/${req.file.filename}`,
        analysis: "Pending AI detection..." 
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
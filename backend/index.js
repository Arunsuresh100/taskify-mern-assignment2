require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const taskRoutes = require('./src/routes/taskRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// --- Middleware Setup ---
// 1. CORS: Allows your frontend (running on a different port) to access the backend API
app.use(cors());

// 2. Body Parser: Reads JSON data sent in request bodies
app.use(express.json());

// 3. API Routes: Mount the task routes
app.use('/api/tasks', taskRoutes);

// 4. Root Route (Health Check)
app.get('/', (req, res) => {
    res.send('Taskify API is running!');
});

// --- Database Connection ---
const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB connected successfully.');
    } catch (err) {
        console.error('MongoDB connection failed:', err.message);
        process.exit(1); // Exit process with failure
    }
};

// Start the server only after successful database connection
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`Access the API at http://localhost:${PORT}/api/tasks`);
    });
});
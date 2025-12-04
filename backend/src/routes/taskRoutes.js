const express = require('express');
const Task = require('../models/taskModel');

const router = express.Router();

// --- Controller Logic (Simulates RESTful API) ---

// 1. GET /api/tasks (Retrieve all tasks - includes filtering by status)
// Advanced Requirement: Implements query parameter filtering (e.g., /api/tasks?status=Completed)
const getAllTasks = async (req, res) => {
    try {
        let filter = {};
        const { status } = req.query; // Check for status query parameter

        if (status) {
            // Case-insensitive status filtering
            filter.status = { $regex: new RegExp(`^${status}$`, 'i') };
        }

        const tasks = await Task.find(filter).sort({ createdAt: -1 });
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch tasks', error: error.message });
    }
};

// 2. POST /api/tasks (Create a new task)
const createTask = async (req, res) => {
    try {
        const newTask = new Task(req.body);
        const savedTask = await newTask.save();
        res.status(201).json(savedTask);
    } catch (error) {
        // Handle validation errors (e.g., missing title/description)
        res.status(400).json({ message: 'Failed to create task', error: error.message });
    }
};

// 3. GET /api/tasks/:id (Retrieve a single task)
const getTaskById = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.status(200).json(task);
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve task', error: error.message });
    }
};

// 4. PUT /api/tasks/:id (Update an existing task)
const updateTask = async (req, res) => {
    try {
        const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, {
            new: true, // return the new document
            runValidators: true, // run Mongoose validation checks
        });

        if (!updatedTask) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.status(200).json(updatedTask);
    } catch (error) {
        res.status(400).json({ message: 'Failed to update task', error: error.message });
    }
};

// 5. DELETE /api/tasks/:id (Delete a task)
const deleteTask = async (req, res) => {
    try {
        const deletedTask = await Task.findByIdAndDelete(req.params.id);

        if (!deletedTask) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.status(204).send(); // 204 No Content is standard for successful deletion
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete task', error: error.message });
    }
};


// --- Define Routes ---
router.get('/', getAllTasks); // GET /api/tasks (all and filtered)
router.post('/', createTask); // POST /api/tasks
router.get('/:id', getTaskById); // GET /api/tasks/:id
router.put('/:id', updateTask); // PUT /api/tasks/:id
router.delete('/:id', deleteTask); // DELETE /api/tasks/:id

module.exports = router;
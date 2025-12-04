const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required.'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Description is required.'],
    },
    status: {
        type: String,
        required: true,
        default: 'Pending',
        enum: ['Pending', 'In Progress', 'Completed'], // Possible values
    },
    dueDate: {
        type: Date,
        default: null, // Optional
    },
    createdAt: {
        type: Date,
        default: Date.now, // Automatically set
    },
});

module.exports = mongoose.model('Task', TaskSchema);
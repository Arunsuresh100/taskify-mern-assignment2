import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Twitter, Linkedin, Github, CheckCircle, Clock, XCircle, ChevronDown, ListTodo, Trash2, Calendar, Zap } from 'lucide-react'; 

// --- Configuration for MERN Backend ---
// NOTE: For this to work, your Express server MUST be running on port 5000.
const API_BASE_URL = 'http://localhost:5000/api/tasks';

// Helper to handle date formatting
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    // Mongoose Date (ISO string) to JS Date object
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
    }).format(date);
};

// --- ToastNotification Component ---
const ToastNotification = ({ notification, onClose }) => {
    if (!notification) return null;

    const { message, type } = notification;

    const baseStyle = "fixed bottom-5 right-5 p-4 rounded-xl shadow-2xl z-50 transform transition-all duration-500 ease-out flex items-center space-x-3 max-w-sm";
    
    const styleMap = {
        success: "bg-green-600 text-white",
        error: "bg-red-600 text-white",
        info: "bg-indigo-600 text-white",
    };

    return (
        <div className={`${baseStyle} ${styleMap[type] || styleMap.info}`}>
            {type === 'success' && <CheckCircle size={20} className="flex-shrink-0" />}
            {type === 'error' && <XCircle size={20} className="flex-shrink-0" />}
            <p className="text-sm font-medium flex-grow">{message}</p>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition duration-150 ml-2">
                <XCircle size={16} />
            </button>
        </div>
    );
};


// --- TaskForm Component ---
const TaskForm = ({ isModalOpen, closeModal, onSave }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');

    // Calculate today's date to enforce a minimum due date
    const today = useMemo(() => new Date().toISOString().split('T')[0], []);

    const handleSubmit = (e) => {
        e.preventDefault();

        onSave({
            title: title.trim(),
            description: description.trim(),
            // Ensure dueDate is formatted as an ISO string or null for Mongoose
            dueDate: dueDate ? new Date(dueDate).toISOString() : null, 
        });

        // Reset form and close modal
        setTitle('');
        setDescription('');
        setDueDate('');
        closeModal();
    };

    if (!isModalOpen) return null;

    return (
        // Mobile optimization: Added flex-col and overflow for small screens
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-70 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 transform transition-all my-auto">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Create New Task</h2>
                <form onSubmit={handleSubmit}>
                    {/* Title Input (Mandatory) */}
                    <div className="mb-4">
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 border"
                            required
                            placeholder="Task title (e.g., Implement POST /api/tasks)"
                        />
                    </div>

                    {/* Description Input (Mandatory) */}
                    <div className="mb-4">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description <span className="text-red-500">*</span></label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows="3"
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 border"
                            required
                            placeholder="Detailed steps or notes for the task..."
                        />
                    </div>

                    {/* Due Date Input */}
                    <div className="mb-6">
                        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Due Date (Optional)</label>
                        <input
                            type="date"
                            id="dueDate"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 border"
                            min={today}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition duration-150 shadow"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition duration-150 shadow-md disabled:opacity-50"
                            disabled={!title.trim() || !description.trim()}
                        >
                            Create Task
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- TaskItem Component ---
const TaskItem = ({ task, onUpdateStatus, onDelete }) => {
    const statusColors = useMemo(() => ({
        'Pending': 'bg-red-100 text-red-800',
        'In Progress': 'bg-yellow-100 text-yellow-800',
        'Completed': 'bg-green-100 text-green-800',
    }), []);

    const nextStatus = useMemo(() => {
        switch (task.status) {
            case 'Pending':
                return 'In Progress';
            case 'In Progress':
                return 'Completed';
            case 'Completed':
                return 'Pending';
            default:
                return 'Pending';
        }
    }, [task.status]);

    const isCompleted = task.status === 'Completed';
    const statusStyle = statusColors[task.status] || 'bg-gray-100 text-gray-800';
    
    // Check if the task is overdue (but not yet completed)
    const isOverdue = useMemo(() => {
        if (!task.dueDate || isCompleted) return false;
        
        // Convert Mongoose ISO string date to Date object
        const dateToCheck = new Date(task.dueDate);
        
        // Use midnight of the due date for accurate comparison
        const dueDateMidnight = new Date(dateToCheck.getFullYear(), dateToCheck.getMonth(), dateToCheck.getDate());
        const nowMidnight = new Date();
        nowMidnight.setHours(0, 0, 0, 0); // Set time to midnight for comparison

        return dueDateMidnight < nowMidnight;
    }, [task.dueDate, isCompleted]);

    // Conditional card styles
    // IMPROVED: Consistent professional styling and vertical spacing (space-y-5)
    let cardClass = "bg-white border border-gray-200 p-5 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-indigo-300/50 transition-all duration-500 ease-in-out flex flex-col space-y-5 transform hover:scale-[1.01]";
    
    if (isCompleted) {
        // Style for Completed Task
        cardClass = "bg-green-50 border-green-300 border-2 p-5 rounded-xl shadow-md transition-all duration-500 ease-in-out flex flex-col space-y-5 opacity-90"; 
    } else if (isOverdue) {
        // Style for Overdue Task (High visual urgency)
        cardClass = "bg-red-50 border-red-500 border-2 p-5 rounded-xl shadow-2xl shadow-red-500/50 transition-all duration-500 ease-in-out flex flex-col space-y-5 transform hover:scale-[1.02]"; 
    }

    // Dynamic classes for content: bold title, smooth transitions
    const titleClass = `text-xl font-bold text-gray-800 transition-all duration-500 ${isCompleted ? 'line-through text-gray-500' : ''}`;
    const descriptionClass = `text-sm text-gray-600 flex-grow transition-all duration-500 ${isCompleted ? 'line-through text-gray-400' : ''}`;


    return (
        <div className={cardClass}>
            <div className="flex justify-between items-start">
                {/* Title and Status Badge */}
                <h3 className={titleClass}>
                    {task.title}
                </h3>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusStyle} transition-colors duration-500`}>
                    {task.status}
                </span>
            </div>

            {/* Description is given ample vertical space */}
            <p className={descriptionClass}>
                {task.description || 'No description provided.'}
            </p>

            {/* Date and Action Section */}
            {/* CRITICAL FIX: Changed flex behavior to ensure date info and actions arrange themselves neatly on all screen sizes */}
            <div className="text-xs text-gray-500 border-t pt-3 flex flex-col sm:flex-row justify-between sm:items-center space-y-3 sm:space-y-0">
                
                {/* Date Info Column - Takes full width on mobile if needed */}
                <div className="text-left w-full sm:w-auto">
                    {/* Created At - with Icon */}
                    <div className="flex items-center space-x-1">
                        <Calendar size={12} className="text-gray-400" />
                        <p>Created: {formatDate(task.createdAt)}</p>
                    </div>
                    
                    {/* Due Date (Visualized with Clock/Zap Icon) */}
                    {task.dueDate && 
                        <div className={`flex items-center space-x-1 mt-1 font-medium ${isOverdue ? 'text-red-600 font-bold' : (isCompleted ? 'text-green-500' : 'text-orange-500')}`}>
                            {isOverdue 
                                ? <Zap size={12} className="text-red-600 animate-pulse" /> 
                                : <Clock size={12} className="text-orange-500" />
                            }
                            <p>Due: {formatDate(task.dueDate)} {isOverdue && <span className='text-red-700'>(OVERDUE)</span>}</p>
                        </div>
                    }
                </div>

                {/* Action Buttons: Status Change and Delete */}
                {/* Ensure buttons are grouped nicely, using full width on mobile for better touch targets */}
                <div className="flex justify-end space-x-2 items-center w-full sm:w-auto">
                    {/* Status Change Button (Uses more width on mobile for better readability/touch) */}
                    <button
                        onClick={() => onUpdateStatus(task._id, nextStatus)}
                        className="flex items-center justify-center space-x-1 px-3 py-2 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-full hover:bg-indigo-700 hover:text-white transition duration-300 shadow-md flex-grow sm:flex-grow-0"
                        title={`Set status to "${nextStatus}"`}
                    >
                        {/* Icon changes based on status for clear action */}
                        {isCompleted ? <Clock size={12} /> : (nextStatus === 'Completed' ? <CheckCircle size={12} /> : <ChevronDown size={12} />)}
                        <span className="ml-1 text-sm sm:text-xs font-semibold">{isCompleted ? 'Re-open' : `Move to ${nextStatus}`}</span>
                    </button>
                    
                    {/* Delete Button (Symbol/Icon) */}
                    <button
                        onClick={() => onDelete(task._id)}
                        className="p-2 text-gray-400 hover:text-red-700 hover:bg-red-100 rounded-full transition duration-300"
                        title="Delete Task"
                    >
                        <Trash2 size={16} /> {/* Slightly smaller icon size for better balance */}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Footer Component ---
const Footer = ({ showNotification }) => (
    <footer className="bg-gray-900 text-white mt-8">
        <div className="max-w-6xl mx-auto p-6 flex flex-col sm:flex-row justify-between items-center border-t border-gray-700/50">
            <p className="text-sm text-gray-400 mb-4 sm:mb-0">
                &copy; {new Date().getFullYear()} Taskify App. All rights reserved.
            </p>
            
            {/* Social Media Icons */}
            <div className="flex space-x-6">
                <a 
                    href="#" // Preventing default navigation
                    onClick={(e) => {
                        e.preventDefault();
                        showNotification('For contact, please use the LinkedIn link.', 'info');
                    }}
                    rel="noopener noreferrer" 
                    className="text-gray-400 hover:text-indigo-400 transition duration-200 transform hover:scale-110"
                    aria-label="Twitter"
                >
                    <Twitter size={20} />
                </a>
                <a 
                    href="https://www.linkedin.com/in/arun-suresh-" // Updated link
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-gray-400 hover:text-indigo-400 transition duration-200 transform hover:scale-110"
                    aria-label="LinkedIn"
                >
                    <Linkedin size={20} />
                </a>
                <a 
                    href="#" // Preventing default navigation
                    onClick={(e) => {
                        e.preventDefault();
                        showNotification('For contact, please use the LinkedIn link.', 'info');
                    }}
                    rel="noopener noreferrer" 
                    className="text-gray-400 hover:text-indigo-400 transition duration-200 transform hover:scale-110"
                    aria-label="GitHub"
                >
                    <Github size={20} />
                </a>
            </div>
        </div>
    </footer>
);

// --- Main App Component ---
export default function App() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filterStatus, setFilterStatus] = useState('All'); 
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0); 
    
    // Notification state
    const [notification, setNotification] = useState(null); 
    
    // Central function to handle notifications
    const showNotification = useCallback((msg, type) => {
        setNotification({ message: msg, type: type });
        // Automatically clear the notification after 4 seconds
        setTimeout(() => setNotification(null), 4000);
    }, []);

    // 1. Data Fetching (GET /api/tasks and GET /api/tasks?status=...)
    useEffect(() => {
        const fetchTasks = async () => {
            setLoading(true);
            setError(null);
            
            // Construct URL with optional status filter
            const statusParam = filterStatus !== 'All' ? `?status=${encodeURIComponent(filterStatus)}` : '';
            const url = `${API_BASE_URL}${statusParam}`;

            try {
                const response = await fetch(url);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                setTasks(data);
            } catch (e) {
                console.error("MERN API fetch error:", e);
                setError(`Failed to load tasks from MERN backend. Is Express server running on port 5000? Error: ${e.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();
    }, [filterStatus, refreshTrigger]); // Re-run when filter changes or a CRUD operation triggers a refresh

    // 2. CRUD Operations (MERN API calls)

    // POST /api/tasks (Updated for notification)
    const createTask = useCallback(async (taskData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create task.');
            }
            
            // Trigger a data refresh and show success message
            setRefreshTrigger(prev => prev + 1);
            showNotification(`Task "${taskData.title}" created successfully!`, 'success');

        } catch (e) {
            console.error("Error creating task:", e);
            setError(`Failed to create task. ${e.message}`);
            showNotification(`Error creating task. Check console.`, 'error');
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    // PUT /api/tasks/:id (CRITICAL: Added Optimistic Update for smooth status change)
    const updateTaskStatus = useCallback(async (id, newStatus) => {
        setError(null);
        
        // 1. Optimistic UI Update: Update the UI immediately for smoothness
        const tempOriginalTasks = tasks; // Capture current state for simple rollback on failure
        setTasks(prevTasks => prevTasks.map(task => 
            task._id === id ? { ...task, status: newStatus } : task
        ));
        
        try {
            const response = await fetch(`${API_BASE_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update task status.');
            }
            
            showNotification(`Status updated to "${newStatus}"!`, 'info');
            
        } catch (e) {
            console.error("Error updating status:", e);
            setError(`Failed to update task status. ${e.message}`);
            showNotification(`Error updating status. Reverting change.`, 'error');
            
            // 4. Rollback on Failure: Restore the previous state and force a refresh.
            setTasks(tempOriginalTasks);
            setRefreshTrigger(prev => prev + 1);
        }
    }, [showNotification, tasks]); // DEPENDS ON TASKS for accurate optimistic rollback

    // DELETE /api/tasks/:id (Updated for notification)
    const deleteTask = useCallback(async (id) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/${id}`, {
                method: 'DELETE',
            });
            
            if (response.status !== 204) { 
                if (response.status !== 404) {
                    const errorText = await response.text();
                    throw new Error(errorText || 'Failed to delete task.');
                }
            }
            
            // Trigger a data refresh and show success message
            setRefreshTrigger(prev => prev + 1);
            showNotification('Task deleted successfully.', 'error'); // Use 'error' type for delete confirmation (red color)
        } catch (e) {
            console.error("Error deleting task:", e);
            setError(`Failed to delete task. ${e.message}`);
            showNotification(`Error deleting task. Check console.`, 'error');
        } finally {
            setLoading(false);
        }
    }, [showNotification]);
    
    // Close dropdown when clicking outside
    const handleMainClick = (e) => {
        // Only close if click is outside the dropdown button area
        if (isFilterDropdownOpen && !e.target.closest('.filter-dropdown-container')) {
            setIsFilterDropdownOpen(false);
        }
    };


    return (
        // Main container ensures footer is always at the bottom
        <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
            
            {/* Navbar / Header (Simplified and Polished) */}
            <header className="bg-white shadow-md sticky top-0 z-10 p-4 md:p-6">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    {/* H1: Clean, high-impact title, subtle subtitle on desktop */}
                    <div className="flex items-center space-x-2">
                        <ListTodo className="h-7 w-7 text-indigo-600" />
                        <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">
                            Taskify 
                            <span className="text-base font-medium text-indigo-500 ml-2 hidden sm:inline">| MERN Manager</span>
                        </h1>
                    </div>
                    {/* Backend Status: Less intrusive and smaller */}
                    <p className="text-xs text-gray-500 text-right">
                        <span className="hidden md:inline">Backend Status:</span> <span className="font-mono text-gray-700 font-semibold bg-gray-100 px-2 py-1 rounded-md">M/E</span>
                    </p>
                </div>
            </header>

            {/* Main Content Area - flex-grow ensures it takes up available space */}
            <main className="flex-grow p-4 md:p-8" onClick={handleMainClick}>
                <div className="max-w-6xl mx-auto">
                    
                    {/* Action Bar and Filters (Responsive Stacking for Mobile) */}
                    <div className="flex flex-col md:flex-row justify-between items-center mb-8 space-y-4 md:space-y-0">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="w-full md:w-auto px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:bg-indigo-700 transition duration-200 transform hover:scale-[1.02]"
                        >
                            + Create New Task
                        </button>

                        {/* Filter UI - Professional Dropdown */}
                        <div className="relative filter-dropdown-container w-full md:w-auto">
                            <button
                                onClick={(e) => { 
                                    e.stopPropagation(); // Prevent main click from immediately closing it
                                    setIsFilterDropdownOpen(!isFilterDropdownOpen);
                                }}
                                className="flex items-center justify-between w-full space-x-2 px-4 py-2 bg-white text-gray-700 font-semibold rounded-xl shadow-md border hover:bg-gray-100 transition duration-200"
                            >
                                <span className="text-sm">Filter by: </span>
                                <span className="text-indigo-600 font-bold">{filterStatus}</span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${isFilterDropdownOpen ? 'transform rotate-180' : ''}`} />
                            </button>
                            
                            {/* Dropdown Menu (Full width on mobile, fixed width on desktop) */}
                            {isFilterDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-full md:w-48 bg-white rounded-xl shadow-2xl z-20 border overflow-hidden">
                                    {['All', 'Pending', 'In Progress', 'Completed'].map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => {
                                                setFilterStatus(status);
                                                setIsFilterDropdownOpen(false);
                                            }}
                                            className={`block w-full text-left px-4 py-2 text-sm transition duration-150 ${
                                                filterStatus === status 
                                                    ? 'bg-indigo-50 text-indigo-700 font-semibold' 
                                                    : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Loading and Error States */}
                    {loading && (
                        <div className="text-center p-12 text-lg text-indigo-500">Loading tasks...</div>
                    )}
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative mb-6" role="alert">
                            <strong className="font-bold">MERN Error!</strong>
                            <span className="block sm:inline ml-2">{error}</span>
                            <p className="mt-1 text-sm">Please ensure your Express server is running and accessible at `http://localhost:5000`.</p>
                        </div>
                    )}

                    {/* Task List View (Responsive Grid - IMPROVED) */}
                    {/* Changed xl:grid-cols-4 to xl:grid-cols-3 to guarantee wider cards on large screens. */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                        {!loading && tasks.length === 0 && (
                            <div className="lg:col-span-3 text-center p-12 text-gray-500 bg-white rounded-xl shadow-lg">
                                <p className="text-xl font-medium">No tasks found in the "{filterStatus}" category.</p>
                                <p className="mt-2 text-sm">Click "Create New Task" to get started!</p>
                            </div>
                        )}

                        {tasks.map(task => (
                            <TaskItem
                                key={task._id} 
                                task={task}
                                onUpdateStatus={updateTaskStatus}
                                onDelete={deleteTask}
                            />
                        ))}
                    </div>
                </div>
            </main>

            {/* Footer Component */}
            <Footer showNotification={showNotification} />

            {/* Task Creation Modal */}
            <TaskForm
                isModalOpen={isModalOpen}
                closeModal={() => setIsModalOpen(false)}
                onSave={createTask}
            />

            {/* Global Notification Popup */}
            <ToastNotification 
                notification={notification} 
                onClose={() => setNotification(null)} 
            />
        </div>
    );
}
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const multer = require('multer');

const PORT = process.env.PORT || 3000;

// Multer configuration for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 1.5 * 1024 * 1024 } // less than 1.5MB
}).single('file'); // Assuming the file field in the form is named 'file'

// Initialize an empty array to store connected users
let connectedUsers = [];

// Password for accessing the chat room
const PASSWORD = '1234';

// Server setup
http.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});

// Static files
app.use(express.static(__dirname + '/public'));

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Handle file uploads
app.post('/upload', (req, res, next) => {
    // Reset multer middleware for each request
    upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // File size exceeds the limit
            return res.status(400).send('File size exceeds the maximum limit of 1.5MB.');
        } else if (err) {
            // Other errors
            return res.status(500).send('An unexpected error occurred.');
        }

        // File upload successful, process the file
        if (!req.file) {
            // No file uploaded
            return res.status(400).send('No file uploaded.');
        }

        // Here you can access the uploaded file using req.file
        // Example: Log file details
        console.log('File received:', req.file);

        // Example: Respond with a success message
        res.send('File uploaded successfully.');
    });
});

// WebSocket setup
io.on('connection', (socket) => {
    console.log('Connected...');

    let authenticated = false; // Variable to track authentication status

    // Handle password verification
    socket.on('verifyPassword', ({ name, password }) => {
        const valid = (password === PASSWORD);
        socket.emit('passwordResult', { valid });
        authenticated = valid; // Update authentication status
    });

    // Add the new user to the connected users list if authenticated
    socket.on('join', (userName) => {
        if (authenticated) {
            socket.username = userName;
            connectedUsers.push(userName);
            // Emit the updated list of connected users to all clients
            io.emit('connectedUsers', connectedUsers);
        } else {
            // Disconnect the client if not authenticated
            socket.emit('passwordFailure');
            socket.disconnect();
        }
    });

    // Handle incoming messages
    socket.on('message', (msg) => {
        // Broadcast the message to all clients except the sender
        socket.broadcast.emit('message', msg);
    });

    // Handle incoming file data
    socket.on('file', (fileData) => {
        // Broadcast the file data to all clients except the sender
        socket.broadcast.emit('file', fileData);
    });

    // Handle incoming voice recordings
    socket.on('voice', (voiceData) => {
        // Broadcast the voice recording to all clients except the sender
        socket.broadcast.emit('voice', voiceData);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        // Remove the disconnected user from the connected users list
        connectedUsers = connectedUsers.filter(user => user !== socket.username);
        
        // Emit the updated list of connected users to all clients
        io.emit('connectedUsers', connectedUsers);

        if (!authenticated) {
            // Emit an event to indicate password limit exceeded
            socket.broadcast.emit('passwordLimitExceeded', socket.username);
        } else {
            // Emit an alert message to all clients about the disconnected user
            io.emit('userLeft', socket.username);
        }
    });

    // Handle incoming status updates
    socket.on('status', (statusData) => {
        // Broadcast the status to all clients except the sender
        socket.broadcast.emit('status', statusData);
    });
});



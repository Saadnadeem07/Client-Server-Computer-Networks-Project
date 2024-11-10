# Whatsapp Messenger

A simple chat application built using **Node.js** and **Socket.io**. This application allows users to send and receive messages in real-time, share files, and send voice recordings. Users must authenticate using a password to access the chat room.

## Features

- Real-time messaging
- File uploads (up to 1.5 MB)
- Voice recordings
- User authentication (password protected)
- Status updates

## Technologies Used

- **Node.js**: Server-side JavaScript runtime
- **Express.js**: Web framework for Node.js
- **Socket.io**: Real-time communication library
- **Multer**: Middleware for handling file uploads
- **HTML/CSS/JavaScript**: Front-end for the chat application

## Getting Started

Follow these steps to get the project running on your local machine:

### Prerequisites

- Node.js installed on your machine.
- npm (Node Package Manager) for installing dependencies.

### Installing Dependencies

1. Clone this repository:

   ```bash
   git clone https://github.com/your-username/whatsapp-messenger.git
   cd whatsapp-messenger
   ```

2. Install the required dependencies:
   ```bash
   npm install
   ```

### Running the Project

1. Start the server:

   ```bash
   node script.js
   ```

2. Open two browser tabs and go to `http://localhost:3000`. You will be prompted to enter a username and password.

3. Enter any username (e.g., `Saad`) and use the password `1234`.

4. Once authenticated, you can send and receive messages, upload files, and send voice recordings.

### File Uploads

- Files can be uploaded directly in the chat. Supported file types can be images, documents, etc., with a maximum file size of **1.5 MB**.

### Voice Recording

- Hold the "Hold to Record Voice" button to start recording, and release it to stop the recording. The voice message will be broadcasted to all connected clients.

### Status Updates

- Users can set their status and upload it to the status section.

## Folder Structure

const socket = io();
let name;
const MAX_PASSWORD_ATTEMPTS = 3; // Maximum password attempts allowed
let passwordAttempts = 0; // Variable to track password attempts
let authenticated = false; // Variable to track authentication status

// Get a reference to the audio element
const notificationSound = document.getElementById('notificationSound');

// Function to play the notification sound
function playNotificationSound() {
    notificationSound.play();
}


do {
    name = prompt('Please enter your name: ');
} while (!name);

// Function to prompt for password
function askPassword() {
    const password = prompt('Please enter the password: ');
    socket.emit('verifyPassword', { name, password });
}

askPassword(); // Initial password prompt

socket.on('passwordResult', (result) => {
    if (result.valid) {
        // Password is correct, user can connect
        authenticated = true;
        socket.emit('join', name);
    } else {
        // Password is incorrect
        passwordAttempts++;
        if (passwordAttempts < MAX_PASSWORD_ATTEMPTS) {
            // Prompt for password again
            askPassword();
        } else {
            // Maximum attempts reached, notify user and disable further attempts
            alert('Invalid password. You are not able to join the chat room.');
            authenticated = false;
        }
    }
});

socket.on('message', (msg) => {
    if (!authenticated) {
        return; // Ignore messages if not authenticated
    }
    appendMessage(msg, 'incoming');
    scrollToBottom();

    // Play notification sound
    playNotificationSound();

});

socket.on('file', (fileData) => {
    if (!authenticated) {
        return; // Ignore files if not authenticated
    }
    appendFileMessage(fileData, 'incoming');
    scrollToBottom();

    // Play notification sound
    playNotificationSound();
});

socket.on('connectedUsers', (users) => {
    const toolbar = document.querySelector('.brand');
    toolbar.innerHTML = `<img height="50" src="/logo.png" alt=""><h1>Whatsapp Messenger (${users.length} users connected)</h1>`;
});

socket.on('userLeft', (userName) => {
    if (!authenticated) {
        return; // Ignore if not authenticated
    }
    alert(`${userName} has left the chat room.`);
});

socket.on('voice', (voiceData) => {
    if (!authenticated) {
        return; // Ignore voice recordings if not authenticated
    }
    appendFileMessage(voiceData, 'incoming');
    scrollToBottom();
    alert(`${voiceData.user} sent a voice message`);
});

function sendMessage() {
    if (!authenticated) {
        return; // Ignore sending message if not authenticated
    }
    const message = messageInput.value.trim();
    if (message === '') {
        return; // Ignore empty messages
    }
    const msg = {
        user: name,
        message: message
    };
    appendMessage(msg, 'outgoing');
    scrollToBottom();
    socket.emit('message', msg);
    messageInput.value = '';
}

function sendFile() {
    if (!authenticated) {
        return; // Ignore sending files if not authenticated
    }
    const files = fileInput.files;
    for (const file of files) {
        if (file.size > MAX_FILE_SIZE) {
            alert('File size exceeds the maximum limit of 1.5MB. Please choose a smaller file.');
            return; // Stop further processing
        }

        const reader = new FileReader();
        reader.onload = function (event) {
            const fileData = {
                user: name,
                fileType: file.type,
                fileSize: file.size,
                dataUrl: event.target.result
            };
            appendFileMessage(fileData, 'outgoing');
            scrollToBottom();
            socket.emit('file', fileData);
        };
        reader.readAsDataURL(file);
    }
}

const MAX_FILE_SIZE = 1.5 * 1024 * 1024; // 1.5MB
const messageInput = document.getElementById('messageInput');
const messageArea = document.querySelector('.message__area');
const fileInput = document.getElementById('fileInput');
const audioPlayer = document.getElementById('audioPlayer');
const startRecordBtn = document.getElementById('startRecordBtn');
let isRecording = false;

messageInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

document.getElementById('fileInput').addEventListener('change', sendFile);

function appendMessage(msg, type) {
    let mainDiv = document.createElement('div');
    let className = type;
    mainDiv.classList.add(className, 'message');

    let markup = `
        <h4>${msg.user}</h4>
        <p>${msg.message}</p>
    `;
    mainDiv.innerHTML = markup;
    messageArea.appendChild(mainDiv);

    // Show alert if the message is incoming and the tab is not focused
    if (type === 'incoming' && !document.hasFocus()) {
        alert(`New message from ${msg.user}: ${msg.message}`);
    }
}

function appendFileMessage(fileData, type) {
    let mainDiv = document.createElement('div');
    let className = type;
    mainDiv.classList.add(className, 'message');

    let markup = `
        <h4>${fileData.user}</h4>`;

    if (fileData.fileType.startsWith('image')) {
        // Display image preview with download link
        markup += `<a href="${fileData.dataUrl}" download><img src="${fileData.dataUrl}" style="max-width: 200px; max-height: 200px;" alt="Image Preview"></a>`;
    } else if (fileData.fileType.startsWith('application/pdf')) {
        // Display PDF icon with download link
        markup += `<p><a href="${fileData.dataUrl}" download><img src="pdf-icon.png" alt="PDF Icon" style="vertical-align: middle;"> PDF Document (${fileData.fileSize} bytes)</a></p>`;
    } else if (fileData.fileType.startsWith('audio')) {
        // Display audio player for voice recordings
        markup += `<audio controls><source src="${fileData.dataUrl}" type="${fileData.fileType}"></audio>`;
    } else {
        // Display file download link
        markup += `<p><a href="${fileData.dataUrl}" download>${fileData.fileType} (${fileData.fileSize} bytes)</a></p>`;
    }

    mainDiv.innerHTML = markup;
    messageArea.appendChild(mainDiv);
}

function scrollToBottom() {
    messageArea.scrollTop = messageArea.scrollHeight;
}

// Voice recording functionality
let mediaRecorder;
let chunks = [];

function startRecording() {
    if (!authenticated) {
        return; // Ignore starting recording if not authenticated
    }
    if (!isRecording) {
        isRecording = true;
        startRecordBtn.textContent = 'Recording...';
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.start();

                const audioChunks = [];
                mediaRecorder.addEventListener("dataavailable", event => {
                    audioChunks.push(event.data);
                });

                mediaRecorder.addEventListener("stop", () => {
                    isRecording = false;
                    startRecordBtn.textContent = 'Hold to Record Voice';
                    const audioBlob = new Blob(audioChunks);
                    const reader = new FileReader();
                    reader.onload = function () {
                        const voiceData = {
                            user: name,
                            fileType: 'audio/webm',
                            fileSize: audioBlob.size,
                            dataUrl: reader.result
                        };
                        appendFileMessage(voiceData, 'outgoing');
                        scrollToBottom();
                        socket.emit('voice', voiceData);
                    };
                    reader.readAsDataURL(audioBlob);
                });
            })
            .catch(error => {
                isRecording = false;
                startRecordBtn.textContent = 'Hold to Record Voice';
                console.error('Error accessing microphone:', error);
            });
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
    }
}
function uploadStatus() {
    if (!authenticated) {
        return; // Ignore uploading status if not authenticated
    }
    const status = statusInput.value.trim();
    if (status === '') {
        return; // Ignore empty status
    }
    const statusData = {
        user: name,
        status: status
    };
    socket.emit('status', statusData);

    // Clear the input field after sending the status
    statusInput.value = '';
}

// Listen for "Enter" key press on the status input field
statusInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        uploadStatus(); // Call uploadStatus function if "Enter" key is pressed
    }
});


socket.on('status', (statusData) => {
    if (!authenticated) {
        return; // Ignore status updates if not authenticated
    }
    displayStatus(statusData);
});

function displayStatus(statusData) {
    const statusMessage = `${statusData.user}: ${statusData.status}`;
    const statusDiv = document.createElement('div');
    statusDiv.classList.add('status');
    statusDiv.textContent = statusMessage;
    document.getElementById('statusUpdates').appendChild(statusDiv);
}



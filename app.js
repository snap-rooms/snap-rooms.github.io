const peer = new Peer("aurora"+Math.floor(Math.random() * 90 + 10));
let connection = null;

// Elements
const peerIdSpan = document.getElementById('peer-id');
const remoteIdInput = document.getElementById('remote-id');
const connectBtn = document.getElementById('connect-btn');
const chatDiv = document.getElementById('chat');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('message');
const sendBtn = document.getElementById('send-btn');
const callBtn = document.getElementById('call-btn');
const videoSection = document.getElementById('video-section');  // Added reference to video section

let call = null;

// Display local peer ID
peer.on('open', (id) => {
    peerIdSpan.textContent = id;
});

// Handle incoming calls
peer.on('call', (incomingCall) => {
    const accept = confirm('Incoming video call. Do you want to answer?');
    if (accept) {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
            incomingCall.answer(stream);
            playVideoStream(stream, 'local-video'); // Show local video
            setupCall(incomingCall, stream);
        }).catch((err) => {
            console.error('Error accessing media devices:', err);
            alert('Could not access media devices.');
        });
    } else {
        incomingCall.close();
    }
});

// Set up call handlers
function setupCall(incomingCall, stream) {
    call = incomingCall;

    call.on('stream', (remoteStream) => {
        playVideoStream(remoteStream, 'remote-video');
        videoSection.style.display = 'block';  // Show video section when call starts
    });

    call.on('close', () => {
        appendMessage('Call ended.');
        call = null;
        videoSection.style.display = 'none';  // Hide video section when call ends
    });

    call.on('error', (err) => {
        console.error('Call error:', err);
        appendMessage('Call encountered an error.');
        call = null;
        videoSection.style.display = 'none';  // Hide video section on error
    });

    appendMessage('Call in progress...');
}

// Start a call
callBtn.addEventListener('click', () => {
    if (!connection) {
        alert('No peer connected.');
        return;
    }

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
        const remoteId = connection.peer;
        const outgoingCall = peer.call(remoteId, stream);
        playVideoStream(stream, 'local-video'); // Show local video
        setupCall(outgoingCall, stream);
    }).catch((err) => {
        console.error('Error accessing media devices:', err);
        alert('Could not start the call. Please check your camera and microphone.');
    });
});


function playVideoStream(stream, elementId) {
    let video = document.getElementById(elementId);
    if (!video) {
        video = document.createElement('video');
        video.id = elementId;
        video.autoplay = true;
        video.style.width = '30%';
        document.body.appendChild(video);
    }
    video.srcObject = stream;
}

// Update connection setup to enable call button
function setupConnection(conn) {
    connection = conn;
    chatDiv.style.display = 'block';
    remoteIdInput.disabled = false;
    connectBtn.disabled = false;
    sendBtn.disabled = false;
    callBtn.disabled = false;  // Enable call button when connected

    connection.on('data', (data) => {
        appendMessage(`Peer: ${data}`);
    });

    connection.on('open', () => {
        appendMessage('Connected to peer!');
    });

    connection.on('close', () => {
        appendMessage('Connection closed.');
        sendBtn.disabled = true;
        callBtn.disabled = true;  // Disable call button when connection is closed
    });
}

// Handle incoming connection
peer.on('connection', (conn) => {
    setupConnection(conn);
});

// Connect to remote peer
connectBtn.addEventListener('click', () => {
    const remoteId = remoteIdInput.value.trim();
    if (remoteId) {
        const conn = peer.connect(remoteId);
        setupConnection(conn);
    }
});

// Send a message
sendBtn.addEventListener('click', () => {
    const message = messageInput.value.trim();
    if (message && connection) {
        connection.send(message);
        appendMessage(`You: ${message}`);
        messageInput.value = '';
    }
});

// Append message to chat
function appendMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

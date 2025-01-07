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


let call = null;

// Handle incoming calls
peer.on('call', (incomingCall) => {
    const accept = confirm('Incoming call. Do you want to answer?');
    if (accept) {
        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
            incomingCall.answer(stream);
            setupCall(incomingCall, stream);
        }).catch((err) => {
            console.error('Error accessing audio stream:', err);
        });
    } else {
        incomingCall.close();
    }
});

// Set up call handlers
function setupCall(incomingCall, stream) {
    call = incomingCall;

    call.on('stream', (remoteStream) => {
        playAudioStream(remoteStream);
    });

    call.on('close', () => {
        appendMessage('Call ended.');
    });

    call.on('error', (err) => {
        console.error('Call error:', err);
        appendMessage('Call encountered an error.');
    });
}

// Start a call
document.getElementById('call-btn').addEventListener('click', () => {
    if (!connection) return;

    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        const remoteId = connection.peer;
        const outgoingCall = peer.call(remoteId, stream);
        setupCall(outgoingCall, stream);
    }).catch((err) => {
        console.error('Error accessing audio stream:', err);
    });
});

// Play audio stream
function playAudioStream(stream) {
    const audio = document.createElement('audio');
    audio.srcObject = stream;
    audio.play();
}

// Update connection setup to enable call button
function setupConnection(conn) {
    connection = conn;
    chatDiv.style.display = 'block';
    remoteIdInput.disabled = true;
    connectBtn.disabled = true;
    sendBtn.disabled = false;
    document.getElementById('call-btn').disabled = false;

    connection.on('data', (data) => {
        appendMessage(`Peer: ${data}`);
    });

    connection.on('open', () => {
        appendMessage('Connected to peer!');
    });

    connection.on('close', () => {
        appendMessage('Connection closed.');
        sendBtn.disabled = true;
        document.getElementById('call-btn').disabled = true;
    });
}


// Display local peer ID
peer.on('open', (id) => {
    peerIdSpan.textContent = id;
});

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

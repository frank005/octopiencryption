let client;
let localTracks = {
    videoTrack: null,
    audioTrack: null
};

let remoteUsers = {};
let options = {
    appid: null,
    channel: null,
    uid: null,
    token: null
};

let isCameraMuted = false;
let isMicMuted = false;
let isEncryptionEnabled = false;

// Global variables for encryption
let currentEncryptionMode = "none";
let currentEncryptionSecret = "";
let currentEncryptionSalt = null;
let currentEncryptDataStream = false;

// Video profiles
const videoProfiles = [
    { label: "360p_7", detail: "480×360, 15fps, 320Kbps", value: "360p_7" },
    { label: "360p_8", detail: "480×360, 30fps, 490Kbps", value: "360p_8" },
    { label: "480p_1", detail: "640×480, 15fps, 500Kbps", value: "480p_1" },
    { label: "480p_2", detail: "640×480, 30fps, 1000Kbps", value: "480p_2" },
    { label: "720p_1", detail: "1280×720, 15fps, 1130Kbps", value: "720p_1" },
    { label: "720p_2", detail: "1280×720, 30fps, 2000Kbps", value: "720p_2" },
    { label: "1080p_1", detail: "1920×1080, 15fps, 2080Kbps", value: "1080p_1" },
    { label: "1080p_2", detail: "1920×1080, 30fps, 3000Kbps", value: "1080p_2" }
];

// Initialize Agora client
function initClient() {
    client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    
    // Add event listeners for encryption
    client.on("crypt-error", (error) => {
        console.error("Encryption error:", error);
        addEventPopup(`Encryption error: ${error.message}`, "error");
    });
    
    setupClientHandlers();
}

// Set up client event handlers
function setupClientHandlers() {
    client.on("user-published", handleUserPublished);
    client.on("user-unpublished", handleUserUnpublished);
    client.on("user-joined", handleUserJoined);
    client.on("user-left", handleUserLeft);
    client.on("connection-state-change", (curState, prevState) => {
        addEventPopup(`Connection state changed: ${prevState} -> ${curState}`, "info");
    });
    client.on("network-quality", (stats) => {
        addEventPopup(`Network quality: ${stats.downlinkNetworkQuality}`, "info");
    });
}

// Handle user published event
async function handleUserPublished(user, mediaType) {
    await client.subscribe(user, mediaType);
    if (mediaType === "video") {
        const player = document.createElement("div");
        player.id = `player-${user.uid}`;
        player.style.width = "100%";
        player.style.height = "100%";
        document.getElementById("remote-playerlist").appendChild(player);
        user.videoTrack.play(`player-${user.uid}`);
    }
    if (mediaType === "audio") {
        user.audioTrack.play();
    }
}

// Handle user unpublished event
function handleUserUnpublished(user, mediaType) {
    if (mediaType === "video") {
        const player = document.getElementById(`player-${user.uid}`);
        if (player) {
            player.remove();
        }
    }
}

// Handle user joined event
function handleUserJoined(user) {
    console.log("user joined", user);
}

// Handle user left event
function handleUserLeft(user) {
    const player = document.getElementById(`player-${user.uid}`);
    if (player) {
        player.remove();
    }
}

// Initialize devices
async function initDevices() {
    try {
        // Get all devices using Agora
        const devices = await AgoraRTC.getDevices();
        console.log("Available devices:", devices);

        // Filter devices by kind
        const cameras = devices.filter(device => device.kind === "videoinput");
        const microphones = devices.filter(device => device.kind === "audioinput");

        // Populate camera select
        const cameraSelect = document.getElementById("camera");
        cameraSelect.innerHTML = cameras.map(camera => 
            `<option value="${camera.deviceId}">${camera.label || `Camera ${camera.deviceId}`}</option>`
        ).join('');

        // Populate microphone select
        const microphoneSelect = document.getElementById("microphone");
        microphoneSelect.innerHTML = microphones.map(microphone => 
            `<option value="${microphone.deviceId}">${microphone.label || `Microphone ${microphone.deviceId}`}</option>`
        ).join('');

        // Initialize video profiles with 720p_2 as default
        const videoProfileSelect = document.getElementById("video-profile");
        videoProfiles.forEach(profile => {
            const option = document.createElement("option");
            option.value = profile.value;
            option.text = `${profile.label}: ${profile.detail}`;
            option.selected = profile.value === "720p_2"; // Set default
            videoProfileSelect.appendChild(option);
        });

        if (!cameras.length && !microphones.length) {
            addEventPopup("No camera or microphone detected. Please connect a device and refresh.", "error");
        }
    } catch (error) {
        console.error("Error initializing devices:", error);
        addEventPopup("Error accessing media devices. Please ensure you have devices connected and permissions granted.", "error");
    }
}

// Create local tracks
async function createLocalTracks() {
    try {
        // Get selected devices
        const cameraId = document.getElementById("camera").value;
        const microphoneId = document.getElementById("microphone").value;

        // Create tracks with selected devices
        localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
            encoderConfig: "music_standard",
            microphoneId: microphoneId || undefined
        });
        
        localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack({
            encoderConfig: "720p_2",
            cameraId: cameraId || undefined
        });
        
        localTracks.videoTrack.play("local-player");
    } catch (error) {
        console.error("Error creating local tracks:", error);
        addEventPopup(`Error creating tracks: ${error.message}`, "error");
    }
}

// Toggle camera
async function toggleCamera() {
    if (localTracks.videoTrack) {
        isCameraMuted = !isCameraMuted;
        await localTracks.videoTrack.setEnabled(!isCameraMuted);
        document.getElementById("toggle-camera").textContent = isCameraMuted ? "Unmute Camera" : "Mute Camera";
    }
}

// Toggle microphone
async function toggleMicrophone() {
    if (localTracks.audioTrack) {
        isMicMuted = !isMicMuted;
        await localTracks.audioTrack.setEnabled(!isMicMuted);
        document.getElementById("toggle-mic").textContent = isMicMuted ? "Unmute Mic" : "Mute Mic";
    }
}

// Add event popup
function addEventPopup(message, type = 'info') {
    const popup = document.createElement('div');
    popup.className = `event-popup ${type}`;
    popup.textContent = message;
    
    document.body.appendChild(popup);
    
    // Remove popup after 5 seconds
    setTimeout(() => {
        popup.style.opacity = '0';
        setTimeout(() => popup.remove(), 300);
    }, 5000);
}

// Convert base64 string to Uint8Array
async function base64ToUint8Array(string) {
    console.log("Converting base64 to Uint8Array:", string);
    const raw = window.atob(string);
    const result = new Uint8Array(new ArrayBuffer(raw.length));
    for (let i = 0; i < raw.length; i += 1) {
        result[i] = raw.charCodeAt(i);
    }
    console.log("Converted salt to Uint8Array:", result);
    return result;
}

// Convert hex string to ASCII
function hex2ascii(hexx) {
    const hex = hexx.toString(); //force conversion
    let str = '';
    for (let i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}

// Generate invite link
function generateInviteLink() {
    const appid = document.getElementById("appid").value;
    const channel = document.getElementById("channel").value;
    const token = document.getElementById("token").value;
    const uid = document.getElementById("uid").value;
    const mode = document.getElementById("encryption-mode").value;
    const secret = document.getElementById("encryption-secret").value;
    const salt = document.getElementById("encryption-salt").value;
    const encryptDataStream = document.getElementById("encrypt-data-stream").checked;
    const autoJoin = document.getElementById("auto-join").checked;

    const params = new URLSearchParams();
    params.append("appid", appid);
    params.append("channel", channel);
    if (token) params.append("token", token);
    if (uid) params.append("uid", uid);
    params.append("mode", mode);
    if (secret) params.append("secret", secret);
    if (salt) params.append("salt", salt);
    params.append("encryptDataStream", encryptDataStream);
    params.append("autoJoin", autoJoin);

    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(url).then(() => {
        addEventPopup("Invite link copied to clipboard!", "success");
    }).catch(err => {
        console.error("Failed to copy invite link:", err);
        addEventPopup("Failed to copy invite link", "error");
    });
}

// Load parameters from URL
async function loadParametersFromUrl() {
    const params = new URLSearchParams(window.location.search);
    if (params.has("appid")) document.getElementById("appid").value = params.get("appid");
    if (params.has("channel")) document.getElementById("channel").value = params.get("channel");
    if (params.has("token")) document.getElementById("token").value = params.get("token");
    if (params.has("uid")) document.getElementById("uid").value = params.get("uid");
    if (params.has("mode")) {
        const encryptionMode = document.getElementById("encryption-mode");
        encryptionMode.value = params.get("mode");
        // Trigger the change event to show/hide salt input
        encryptionMode.dispatchEvent(new Event('change'));
    }
    if (params.has("secret")) document.getElementById("encryption-secret").value = params.get("secret");
    if (params.has("salt")) document.getElementById("encryption-salt").value = params.get("salt");
    if (params.has("encryptDataStream")) document.getElementById("encrypt-data-stream").checked = params.get("encryptDataStream") === "true";
    
    // If autoJoin is true, trigger join after a short delay
    if (params.get("autoJoin") === "true") {
        // First enable encryption if needed
        const mode = document.getElementById("encryption-mode").value;
        if (mode !== "none") {
            const success = await setEncryption();
            if (!success) {
                addEventPopup("Failed to enable encryption for auto-join", "error");
                return;
            }
        }
        // Then join
        await join();
    }
}

// Set encryption
async function setEncryption() {
    currentEncryptionMode = document.getElementById("encryption-mode").value;
    currentEncryptionSecret = document.getElementById("encryption-secret").value;
    const saltInput = document.getElementById("encryption-salt").value;
    currentEncryptDataStream = document.getElementById("encrypt-data-stream").checked;

    console.log("Setting encryption with values:", {
        mode: currentEncryptionMode,
        secret: currentEncryptionSecret,
        saltInput: saltInput,
        encryptDataStream: currentEncryptDataStream
    });

    try {
        if (currentEncryptionMode === "none") {
            // Clear encryption fields
            document.getElementById("encryption-secret").value = "";
            document.getElementById("encryption-salt").value = "";
            document.getElementById("encrypt-data-stream").checked = false;
            currentEncryptionSecret = "";
            currentEncryptionSalt = null;
            currentEncryptDataStream = false;
            
            console.log("Disabling encryption");
            await client.setEncryptionConfig("none", "");
            isEncryptionEnabled = false;
            addEventPopup("Encryption disabled", "info");
            updateJoinButtonState();
            return true;
        }

        if (!currentEncryptionSecret) {
            addEventPopup("Please enter an encryption secret", "error");
            return false;
        }

        // For GCM2 modes, we need salt
        if ((currentEncryptionMode === "aes-128-gcm2" || currentEncryptionMode === "aes-256-gcm2") && !saltInput) {
            addEventPopup("Please enter a salt value for GCM2 mode", "error");
            return false;
        }

        // Set encryption based on mode
        if (currentEncryptionMode === "aes-128-gcm2" || currentEncryptionMode === "aes-256-gcm2") {
            currentEncryptionSalt = await base64ToUint8Array(saltInput);
            const asciiSecret = hex2ascii(currentEncryptionSecret);
            
            console.log("Setting GCM2 encryption with:", {
                mode: currentEncryptionMode,
                secret: asciiSecret,
                saltLength: currentEncryptionSalt.length,
                encryptDataStream: currentEncryptDataStream
            });

            console.log("Calling setEncryptionConfig with arguments:", [
                currentEncryptionMode,
                asciiSecret,
                currentEncryptionSalt,
                currentEncryptDataStream
            ]);

            await client.setEncryptionConfig(
                currentEncryptionMode,
                asciiSecret,
                currentEncryptionSalt,
                currentEncryptDataStream
            );
        } else {
            const asciiSecret = hex2ascii(currentEncryptionSecret);
            console.log("Setting non-GCM2 encryption with:", {
                mode: currentEncryptionMode,
                secret: asciiSecret
            });
            await client.setEncryptionConfig(currentEncryptionMode, asciiSecret);
        }

        isEncryptionEnabled = true;
        addEventPopup(`Encryption enabled: ${currentEncryptionMode}`, "success");
        updateJoinButtonState();
        return true;
    } catch (error) {
        console.error("Error setting encryption:", error);
        addEventPopup(`Encryption error: ${error.message}`, "error");
        isEncryptionEnabled = false;
        updateJoinButtonState();
        return false;
    }
}

// Toggle encryption
async function toggleEncryption() {
    const mode = document.getElementById("encryption-mode").value;
    if (mode === "none") {
        addEventPopup("Cannot enable encryption when mode is set to none", "error");
        return;
    }

    const success = await setEncryption();
    if (success) {
        document.getElementById("toggle-encryption").textContent = isEncryptionEnabled ? "Disable Encryption" : "Enable Encryption";
    }
}

// Update join button state
function updateJoinButtonState() {
    const mode = document.getElementById("encryption-mode").value;
    const joinButton = document.getElementById("join");
    
    if (mode === "none") {
        joinButton.disabled = false;
    } else {
        joinButton.disabled = !isEncryptionEnabled;
    }
}

// Join channel
async function join() {
    try {
        options.appid = document.getElementById("appid").value;
        options.channel = document.getElementById("channel").value;
        options.token = document.getElementById("token").value || null;
        options.uid = document.getElementById("uid").value || null;

        console.log("Current encryption state:", {
            mode: currentEncryptionMode,
            secret: currentEncryptionSecret,
            salt: currentEncryptionSalt,
            encryptDataStream: currentEncryptDataStream,
            isEnabled: isEncryptionEnabled
        });

        if (!options.appid) {
            addEventPopup("Please enter an App ID", "error");
            return;
        }
        if (!options.channel) {
            addEventPopup("Please enter a channel name", "error");
            return;
        }

        if (currentEncryptionMode !== "none" && !isEncryptionEnabled) {
            addEventPopup("Please enable encryption before joining", "error");
            return;
        }

        console.log("Joining with options:", options);
        addEventPopup("Joining channel...", "info");
        await client.join(options.appid, options.channel, options.token, options.uid);
        await createLocalTracks();
        
        if (localTracks.audioTrack) {
            await client.publish(localTracks.audioTrack);
        }
        if (localTracks.videoTrack) {
            await client.publish(localTracks.videoTrack);
        }

        document.getElementById("join").disabled = true;
        document.getElementById("leave").disabled = false;
        document.getElementById("toggle-camera").disabled = false;
        document.getElementById("toggle-mic").disabled = false;
        document.getElementById("toggle-encryption").disabled = true;
        
        addEventPopup("Successfully joined channel", "success");
    } catch (error) {
        console.error("Error joining channel:", error);
        addEventPopup(`Error joining channel: ${error.message}`, "error");
    }
}

// Leave channel
async function leave() {
    try {
        if (localTracks.audioTrack) {
            localTracks.audioTrack.close();
            localTracks.audioTrack = null;
        }
        if (localTracks.videoTrack) {
            localTracks.videoTrack.close();
            localTracks.videoTrack = null;
        }

        await client.leave();
        
        // Reset encryption state
        isEncryptionEnabled = false;
        document.getElementById("toggle-encryption").textContent = "Enable Encryption";
        document.getElementById("toggle-encryption").disabled = false;
        
        // Reset button states
        document.getElementById("leave").disabled = true;
        document.getElementById("toggle-camera").disabled = true;
        document.getElementById("toggle-mic").disabled = true;
        
        // Update join button state based on encryption mode
        updateJoinButtonState();
        
        // Clear video elements
        document.getElementById("local-player").innerHTML = "";
        document.getElementById("remote-playerlist").innerHTML = "";
        
        // Reset encryption to none when leaving
        console.log("Resetting encryption after leave");
        await client.setEncryptionConfig("none", "");  // Just pass empty string for secret when mode is none
        
        addEventPopup("Left channel", "info");
    } catch (error) {
        console.error("Error leaving channel:", error);
        addEventPopup(`Error leaving channel: ${error.message}`, "error");
    }
}

// Generate hex key
function generateHexKey(bytes = 32) {
    const array = new Uint8Array(bytes);
    window.crypto.getRandomValues(array);
    return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate base64 salt
function generateBase64Salt(bytes = 32) {
    const array = new Uint8Array(bytes);
    window.crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
}

// Event listeners
document.addEventListener("DOMContentLoaded", () => {
    initClient();
    initDevices();

    // Generate key button
    document.getElementById("generate-key").addEventListener("click", () => {
        const key = generateHexKey();
        document.getElementById("encryption-secret").value = key;
        addEventPopup("Generated new encryption key", "success");
    });

    // Generate salt button
    document.getElementById("generate-salt").addEventListener("click", () => {
        const salt = generateBase64Salt();
        document.getElementById("encryption-salt").value = salt;
        addEventPopup("Generated new encryption salt", "success");
    });

    // Join button
    document.getElementById("join").addEventListener("click", join);

    // Leave button
    document.getElementById("leave").addEventListener("click", leave);

    // Toggle camera button
    document.getElementById("toggle-camera").addEventListener("click", toggleCamera);

    // Toggle microphone button
    document.getElementById("toggle-mic").addEventListener("click", toggleMicrophone);

    // Toggle encryption button
    document.getElementById("toggle-encryption").addEventListener("click", toggleEncryption);

    // Camera change
    document.getElementById("camera").addEventListener("change", async (e) => {
        if (localTracks.videoTrack) {
            await localTracks.videoTrack.setDevice(e.target.value);
        }
    });

    // Microphone change
    document.getElementById("microphone").addEventListener("change", async (e) => {
        if (localTracks.audioTrack) {
            await localTracks.audioTrack.setDevice(e.target.value);
        }
    });

    // Video profile change
    document.getElementById("video-profile").addEventListener("change", async (e) => {
        if (localTracks.videoTrack) {
            console.log("Changing video profile to:", e.target.value);
            await localTracks.videoTrack.setEncoderConfiguration(e.target.value);
            addEventPopup(`Video profile changed to ${e.target.value}`, "info");
        }
    });

    // Encryption mode change
    document.getElementById("encryption-mode").addEventListener("change", async (e) => {
        const saltInput = document.querySelector(".salt-input");
        if (e.target.value === "aes-128-gcm2" || e.target.value === "aes-256-gcm2") {
            saltInput.style.display = "flex";
        } else {
            saltInput.style.display = "none";
        }
        
        // Reset encryption state when mode changes
        isEncryptionEnabled = false;
        document.getElementById("toggle-encryption").textContent = "Enable Encryption";
        
        // Update join button state
        updateJoinButtonState();
        
        // If mode is none, set encryption config to none
        if (e.target.value === "none") {
            await setEncryption();
        }
    });

    // Initialize join button state
    updateJoinButtonState();

    // Add invite link button listener
    document.getElementById("generate-invite").addEventListener("click", generateInviteLink);

    // Load parameters from URL and handle auto-join
    loadParametersFromUrl();
}); 
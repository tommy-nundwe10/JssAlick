// Send fan commands
async function sendFan(action) {
    try {
        const res = await fetch('/fan_control', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({action})
        });
        const resp = await res.json();
        logMessage(`Fan Command Sent: ${resp.command || action} | Status: ${resp.status}`);
    } catch (err) {
        logMessage(`Error sending command: ${err}`);
    }
}

// Log messages
function logMessage(msg) {
    const logBox = document.getElementById('logBox');
    const time = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.textContent = `[${time}] ${msg}`;
    logBox.prepend(entry);
}

// Update dashboard 
async function updateData() {
    try {
        const res = await fetch('/data');
        const data = await res.json();

        document.getElementById('time').innerText = new Date().toLocaleTimeString();
        document.getElementById('temp').innerText = data.temp !== null ? data.temp.toFixed(1) : "__";
        document.getElementById('hum').innerText = data.hum !== null ? data.hum.toFixed(1) : "__";
        document.getElementById('setpoint').innerText = data.setpoint;
        document.getElementById('mode').innerText = data.mode;

        document.getElementById('fan1-energy').innerText = data.fan1_energy.toFixed(3);
        document.getElementById('fan2-energy').innerText = data.fan2_energy.toFixed(3);

    } catch (err) {
        console.error("Error fetching data:", err);
    }
}

// Voice command
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    const voiceBtn = document.getElementById('voiceBtn');
    voiceBtn.addEventListener('click', () => {
        recognition.start();
        logMessage("🎤 Listening for command...");
    });

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        logMessage(`🎤 Heard: "${transcript}"`);

        if (transcript.includes('increase') || transcript.includes('up')) sendFan('increase');
        else if (transcript.includes('decrease') || transcript.includes('down')) sendFan('decrease');
        else if (transcript.includes('stop')) sendFan('stop');
        else logMessage("⚠️ Command not recognized");
    };

    recognition.onerror = (event) => logMessage(`⚠️ Voice error: ${event.error}`);
} else {
    const voiceBtn = document.getElementById('voiceBtn');
    voiceBtn.disabled = true;
    voiceBtn.textContent = "Voice Not Supported";
}

// Update every second
setInterval(updateData, 3000); //update made every 3s

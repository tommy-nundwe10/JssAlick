from flask import Flask, jsonify, request, render_template
import threading
import time
import serial

app = Flask(__name__)

# Global Data
latest_data = {
    "temp": None,
    "hum": None,
    "setpoint": 22,
    "mode": "auto",
    "fan1_energy": 0.0,
    "fan2_energy": 0.0
}

# Arduino Serial Setup
COM_PORT = 'COM19'
BAUD_RATE = 9600

try:
    ser = serial.Serial(COM_PORT, BAUD_RATE, timeout=1)
    time.sleep(2)
    print(f"✅ Connected to Arduino on {COM_PORT}")
except serial.SerialException:
    print(f"⚠ Could not connect to Arduino on {COM_PORT}")
    ser = None

# Routes
@app.route('/')
def index():
    return render_template('index.html')


@app.route('/data')
def data():
    """Send live sensor data to frontend."""
    return jsonify(latest_data)


@app.route('/fan_control', methods=['POST'])
def fan_control():
    data = request.get_json()
    action = data.get("action")

    if not ser:
        return {"status": "error", "message": "Arduino not connected"}

    if action == 'increase':
        ser.write(b'I')  # Correct command for fan1Forward
    elif action == 'decrease':
        ser.write(b'D')  # Correct command for fan2Backward
    elif action == 'stop':
        ser.write(b'S')
    else:
        return {"status": "error", "message": "Invalid action"}

    return {"status": "success", "command": action}


# Background Thread 
def read_arduino():
    global latest_data
    while True:
        if ser:
            try:
                line = ser.readline().decode('utf-8').strip()
                if line.startswith("DATA,"):
                    try:
                        # Now we expect 4 values: temp, hum, fan1_energy, fan2_energy
                        parts = line[5:].split(',')
                        if len(parts) != 4:
                            print("Invalid numeric data:", line)
                            continue

                        temp, hum, fan1_energy, fan2_energy = map(float, parts)
                        latest_data['temp'] = temp
                        latest_data['hum'] = hum
                        latest_data['fan1_energy'] = fan1_energy
                        latest_data['fan2_energy'] = fan2_energy

                    except ValueError:
                        print("Invalid numeric data:", line)
                elif line.upper() == "ERROR":
                    print("Sensor error from Arduino")
            except Exception as e:
                print("Error reading Arduino:", e)
        time.sleep(0.1)


# Start Arduino reading thread
threading.Thread(target=read_arduino, daemon=True).start()

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=False)

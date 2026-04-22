# ESP32 Firmware Setup Guide

## Hardware Requirements

- **ESP32 Development Board**
- **RFID Reader Module** (MFRC522 or similar that outputs serial data)
- **Servo Motor** (SG90 or equivalent)
- **Power Supply** (5V recommended)
- **LED** (Optional, for status indication)
- **Buzzer** (Optional, for audio feedback)
- **USB Cable** (for uploading firmware)

## Wiring Diagram

### RFID Reader to ESP32
- RFID RX → GPIO 16 (UART2 RX)
- RFID TX → GPIO 17 (UART2 TX) - optional
- GND → GND
- VCC → 5V

### Servo Motor to ESP32
- Signal Pin → GPIO 13
- VCC → 5V
- GND → GND

### LED to ESP32
- Positive → GPIO 2 (through 220Ω resistor)
- Negative → GND

### Buzzer to ESP32
- Positive → GPIO 4
- Negative → GND

## Software Setup

### 1. Install Arduino IDE
Download from: https://www.arduino.cc/en/software

### 2. Add ESP32 Board Support
1. Open Arduino IDE → File → Preferences
2. Add this URL to "Additional Boards Manager URLs":
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. Go to Tools → Board → Boards Manager
4. Search for "ESP32" and install "esp32 by Espressif Systems"

### 3. Install Required Libraries
1. Sketch → Include Library → Manage Libraries
2. Install these libraries:
   - **Servo** (built-in)
   - **WiFi** (built-in)
   - **ArduinoJson** by Benoit Blanchon
   - **WebServer** (built-in)

### 4. Configuration
1. Open `esp32_rfid_door.ino` in Arduino IDE
2. Edit the following constants:
   ```cpp
   const char* SSID = "YOUR_SSID";
   const char* PASSWORD = "YOUR_PASSWORD";
   const char* FLASK_SERVER = "http://192.168.x.x:5000";
   ```

### 5. Upload Firmware
1. Connect ESP32 via USB
2. Select: Tools → Board → ESP32 Dev Module
3. Select the correct COM port: Tools → Port
4. Click Upload (or Ctrl+U)

## Testing

### 1. Serial Monitor
- Open Tools → Serial Monitor
- Set baud rate to 115200
- You should see startup messages

### 2. WiFi Connection
- Verify WiFi connection message in Serial Monitor
- Note the assigned IP address

### 3. Web Server Test
- From your computer, visit: `http://<ESP32_IP>/api/status`
- You should get a JSON response with door status

### 4. Manual Door Control
- From browser: `http://<ESP32_IP>/api/door/open`
- Servo should move to open position
- From browser: `http://<ESP32_IP>/api/door/close`
- Servo should return to closed position

### 5. RFID Card Reading
- Bring RFID card near the reader
- Serial monitor should show card ID
- System will communicate with Flask server

## Troubleshooting

### No Serial Output
- Check USB cable connection
- Verify correct COM port selected
- Try different USB port

### WiFi Won't Connect
- Double-check SSID and password
- Ensure ESP32 is in range
- Check WiFi network supports 2.4GHz

### RFID Not Reading
- Verify RX pin connection (GPIO 16)
- Check RFID reader power supply
- Test RFID reader with separate serial monitor

### Servo Not Moving
- Verify GPIO 13 connection
- Check servo power supply (5V)
- Ensure servo is not stuck physically

## API Endpoints

### GET /api/status
Returns ESP32 status and door state

### POST /api/door/open
Opens the door (activates servo)

### POST /api/door/close
Closes the door

### GET /api/door/status
Returns current door status

## Notes

- The ESP32 will auto-close the door after DOOR_OPEN_TIME (3 seconds)
- Keep the access control server (Flask) running for card validation
- Use a stable power supply to avoid brownouts
- Consider adding a reset button for troubleshooting

# Setup Guide - IoT Access Control System

## Quick Start

### 1. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your settings
```

### 3. Run Flask Server

```bash
python app.py
```

Server will be available at `http://localhost:5000`

### 4. Open Frontend

Open `frontend/index.html` in a web browser

### 5. Create First User (Admin)

Using a REST client (Postman, curl, etc.):

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "full_name": "System Administrator",
    "password": "admin123",
    "role": "admin"
  }'
```

Then login with the admin account in the web interface.

## System Components

### Backend (Flask)
- **Location**: `backend/`
- **Port**: 5000 (default)
- **Database**: SQLite (auto-created in `backend/instance/`)

### Frontend (Web Interface)
- **Location**: `frontend/`
- **Type**: Pure JavaScript (no build required)
- **Requires**: Active Flask backend

### ESP32 Firmware
- **Location**: `esp32_firmware/`
- **IDE**: Arduino IDE
- **Upload**: Via USB

## Detailed Setup Steps

### Backend Setup

#### Step 1: Python Environment
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

#### Step 2: Install Dependencies
```bash
pip install -r requirements.txt
```

#### Step 3: Configuration
```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your settings
# Important settings to change:
# - JWT_SECRET_KEY: Change to a random secure key
# - ESP32_HOST: Set to your ESP32 IP address
# - FLASK_PORT: Change if port 5000 is already in use
```

#### Step 4: Initialize Database
```bash
# Database is automatically created on first run
python app.py
```

### Frontend Setup

#### Option 1: Direct File Opening
Simply open `frontend/index.html` in a web browser:
```
file:///path/to/IOT Final Project/frontend/index.html
```

#### Option 2: Simple HTTP Server
```bash
cd frontend
python -m http.server 8000
# Then visit: http://localhost:8000
```

#### Option 3: Flask Development Server
Flask serves the frontend at:
```
http://localhost:5000
# (Requires configuring Flask to serve static files)
```

### ESP32 Firmware Setup

#### Step 1: Install Arduino IDE
- Download from https://www.arduino.cc/en/software
- Install and launch

#### Step 2: Add ESP32 Board
1. File → Preferences
2. Add URL to "Additional Boards Manager URLs":
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. Tools → Board → Boards Manager
4. Search "ESP32" and install latest version

#### Step 3: Install Libraries
1. Sketch → Include Library → Manage Libraries
2. Install:
   - ArduinoJson (Benoit Blanchon)
   - Servo (built-in)

#### Step 4: Configure Firmware
Edit `esp32_firmware/esp32_rfid_door.ino`:
```cpp
const char* SSID = "YOUR_WIFI_NETWORK";
const char* PASSWORD = "YOUR_WIFI_PASSWORD";
const char* FLASK_SERVER = "http://192.168.1.X:5000";  // Your Flask server IP
```

#### Step 5: Upload to ESP32
1. Connect ESP32 via USB
2. Tools → Board → ESP32 Dev Module
3. Tools → Port → Select COM port
4. Click Upload (Ctrl+U)

## Network Configuration

### Local Network Setup

For development/testing on same network:

1. **Find your computer's IP**
   ```bash
   # Windows
   ipconfig
   
   # macOS/Linux
   ifconfig
   ```

2. **Update Flask .env**
   ```
   FLASK_PORT=5000
   ```

3. **Update ESP32 config.h**
   ```cpp
   const char* FLASK_SERVER = "http://192.168.1.100:5000";  // Your computer's IP
   ```

### Remote Access

For accessing from different networks:

1. Set up port forwarding on your router
2. Update ESP32 with your public IP/domain name
3. Use HTTPS for security

## First Run Checklist

- [ ] Python and pip installed
- [ ] Virtual environment created and activated
- [ ] Dependencies installed: `pip install -r requirements.txt`
- [ ] .env file configured with secure JWT key
- [ ] Flask server running: `python app.py`
- [ ] Frontend accessible in web browser
- [ ] Created admin account via API or web interface
- [ ] ESP32 configured with WiFi credentials
- [ ] ESP32 firmware uploaded successfully
- [ ] ESP32 connected to same network as Flask server
- [ ] RFID reader connected to ESP32
- [ ] Servo motor connected to ESP32 GPIO 13

## Verification Steps

### 1. Backend Health Check
```bash
curl http://localhost:5000/api/health
# Should return: {"status": "healthy", "version": "1.0.0"}
```

### 2. Database Created
Check that `backend/instance/iot_access_control.db` exists

### 3. User Registration
Visit `http://localhost:5000/frontend/index.html` and register a test user

### 4. ESP32 Status
```bash
curl http://<ESP32_IP>/api/status
# Should return door status and connection info
```

### 5. RFID Test
Bring RFID card near ESP32 reader and check Serial Monitor

## Common Issues and Solutions

### Issue: "ModuleNotFoundError: No module named 'flask'"
**Solution**: Ensure virtual environment is activated and dependencies installed
```bash
source venv/bin/activate  # or: venv\Scripts\activate on Windows
pip install -r requirements.txt
```

### Issue: "Port 5000 already in use"
**Solution**: Change port in .env or kill existing process
```bash
# On Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# On macOS/Linux
lsof -i :5000
kill -9 <PID>
```

### Issue: CORS errors in browser console
**Solution**: Update CORS_ORIGINS in .env
```
CORS_ORIGINS=http://localhost:5000,http://localhost:8000
```

### Issue: ESP32 won't connect to WiFi
**Solution**:
1. Verify SSID and password are correct
2. Ensure 2.4GHz WiFi (5GHz not supported)
3. Check ESP32 antenna
4. Move closer to router

### Issue: RFID card not being read
**Solution**:
1. Check RFID reader is powered (5V)
2. Verify GPIO 16/17 connections
3. Test RFID reader with separate Serial Monitor
4. Try different RFID cards

## Database Backup

### Backup Database
```bash
cp backend/instance/iot_access_control.db backup_iot_access_control.db
```

### Reset Database
```bash
# Delete the database file
rm backend/instance/iot_access_control.db

# Restart Flask server to recreate empty database
python app.py
```

## Performance Tuning

### For Development
Keep default settings in .env:
```
FLASK_DEBUG=True
FLASK_ENV=development
```

### For Production
Update .env:
```
FLASK_DEBUG=False
FLASK_ENV=production
JWT_SECRET_KEY=<very-long-random-key>
```

## Next Steps

1. **Create Users**: Register instructors and students
2. **Set Schedules**: Add teaching times for instructors
3. **Register Cards**: Enroll RFID cards for each user
4. **Test Access**: Scan cards to verify access control
5. **Monitor Logs**: Check access logs for successful/denied attempts

## Maintenance

### Regular Tasks
- Monitor access logs for suspicious activity
- Update teaching schedules before each semester
- Verify ESP32 connectivity weekly
- Backup database monthly

### Troubleshooting Commands
```bash
# Check Flask is running
curl http://localhost:5000/api/health

# List all users
curl http://localhost:5000/api/users/ -H "Authorization: Bearer <token>"

# View access logs
curl http://localhost:5000/api/access/logs

# Test ESP32
curl http://<ESP32_IP>/api/status
```

## Support Resources

- Flask Documentation: https://flask.palletsprojects.com/
- ESP32 Documentation: https://docs.espressif.com/projects/esp-idf/
- SQLAlchemy: https://docs.sqlalchemy.org/
- JWT: https://jwt.io/

# Getting Started - Quick Reference

## 🚀 Start Here

### Step 1: Clone/Open Project
Navigate to: `c:\Users\USER\Desktop\IOT Final Project`

### Step 2: Start Backend
```bash
cd backend
pip install -r requirements.txt
python app.py
```
✅ Backend runs at `http://localhost:5000`

### Step 3: Open Frontend
Open `frontend/index.html` in your web browser

### Step 4: Create Your First Account
- Click "Register"
- Create admin or instructor account
- Login with credentials

## 📱 Dashboard Pages

| Page | Role | Purpose |
|------|------|---------|
| Dashboard | All | Overview and quick actions |
| My Cards | All | View and manage RFID cards |
| Register Card | All | Enroll new RFID card |
| Schedule | Instructor | Set teaching times |
| Access Logs | Admin | View all access attempts |
| Manage Users | Admin | Add/remove/deactivate users |

## 🔧 System Workflow

### For Instructors:
1. **Register Account** → Login
2. **Register RFID Card** (My Cards → Register Card)
3. **Add Teaching Schedule** (Schedule → Add Schedule)
4. **Scan Card at Door** → Door opens during teaching time ✓

### For Admins:
1. **Create Admin Account**
2. **Register Own RFID Card**
3. **Manage Users** (activate/deactivate)
4. **View Access Logs** (audit trail)

### Hardware Setup:
1. Configure WiFi in `esp32_firmware/config.h`
2. Set Flask server IP address
3. Upload firmware to ESP32
4. Power on ESP32 and RFID reader

## 🎯 Key Features at a Glance

```
┌────────────────────────────────────────────┐
│   Web Dashboard (Browser)                  │
│ ├─ User Management                         │
│ ├─ RFID Card Registration                  │
│ ├─ Schedule Management                     │
│ └─ Access Logs Viewer                      │
└────────────────────────────────────────────┘
              ↓ (REST API)
┌────────────────────────────────────────────┐
│   Flask Backend (Python)                   │
│ ├─ User Authentication (JWT)               │
│ ├─ Card Validation                         │
│ ├─ Time-Based Access Logic                 │
│ └─ SQLite Database                         │
└────────────────────────────────────────────┘
              ↓ (HTTP)
┌────────────────────────────────────────────┐
│   ESP32 Microcontroller                    │
│ ├─ RFID Card Reading                       │
│ ├─ Servo Motor Control                     │
│ ├─ LED/Buzzer Feedback                     │
│ └─ WiFi Communication                      │
└────────────────────────────────────────────┘
              ↓ (GPIO/Serial)
┌────────────────────────────────────────────┐
│   Hardware                                 │
│ ├─ RFID Scanner                            │
│ ├─ Door Lock (Servo)                       │
│ ├─ Status Indicator (LED)                  │
│ └─ Audio Feedback (Buzzer)                 │
└────────────────────────────────────────────┘
```

## 💾 Database Tables

| Table | Purpose |
|-------|---------|
| Users | Store user accounts (admin/instructor/student) |
| Cards | Store registered RFID cards |
| Schedules | Store teaching times for instructors |
| AccessLogs | Audit trail of all access attempts |

## 🔐 Default Roles

- **Admin**: Access all doors anytime, manage system
- **Instructor**: Access only during scheduled teaching times
- **Student**: No door access (configurable)

## ⚙️ Configuration Files

| File | Location | Purpose |
|------|----------|---------|
| .env | backend/ | Flask configuration |
| config.h | esp32_firmware/ | ESP32 WiFi & hardware config |
| app.py | backend/ | Main Flask application |
| index.html | frontend/ | Web interface |

## 🧪 Testing the System

### Test Backend
```bash
curl http://localhost:5000/api/health
```

### Register Test User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","full_name":"Test User","password":"test123","role":"instructor"}'
```

### Test ESP32
```bash
curl http://<ESP32_IP>/api/status
```

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Port 5000 in use | Change FLASK_PORT in .env |
| CORS error | Update CORS_ORIGINS in .env |
| Database error | Delete .db file and restart |
| ESP32 not connecting | Check WiFi SSID/password in config.h |
| RFID not reading | Verify GPIO 16 connection and power |

## 📚 Documentation

- **Full Overview**: `documentation/PROJECT_OVERVIEW.md`
- **Setup Guide**: `documentation/SETUP_GUIDE.md`
- **API Reference**: `documentation/API_DOCUMENTATION.md`
- **Database Schema**: `documentation/DATABASE_SCHEMA.md`
- **ESP32 Setup**: `esp32_firmware/README.md`

## 🎓 Learning Path

1. **Read**: PROJECT_OVERVIEW.md (understand architecture)
2. **Setup**: SETUP_GUIDE.md (follow step-by-step)
3. **Use**: Create account and test dashboard
4. **Configure**: Update ESP32 and upload firmware
5. **Integrate**: Connect RFID reader and servo motor
6. **Reference**: Use API_DOCUMENTATION.md for advanced features

## 📊 Access Control Logic

```
Card Scanned
    ↓
Card Registered? → NO → ❌ DENIED
    ↓ YES
Card Blocked? → YES → ❌ DENIED
    ↓ NO
User Active? → NO → ❌ DENIED
    ↓ YES
Is Admin? → YES → ✅ ALLOWED
    ↓ NO
Is Instructor? 
    ├─ Teaching Now? → YES → ✅ ALLOWED
    └─ Teaching Now? → NO → ❌ DENIED
```

## 🔌 Hardware Connections

**ESP32 Pins:**
- GPIO 16 → RFID RX
- GPIO 13 → Servo Signal
- GPIO 2 → Status LED
- GPIO 4 → Buzzer
- GND → Common Ground
- 5V → Power Supply

## 🚦 Status Indicators

| LED | Buzzer | Meaning |
|-----|--------|---------|
| 🟢 ON | 3 beeps | Access Granted |
| 🔴 OFF | 1 beep | Access Denied |
| 🔴 OFF | Error beep | System Error |
| 🟢 ON | 2 beeps | Card Registered |

## 🔄 Typical Day

**Morning (Instructor):**
1. Come to work
2. Scan RFID card at door
3. System checks: Is it teaching time? YES
4. ✅ Door opens, enter classroom

**Outside Teaching Time:**
1. Scan RFID card
2. System checks: Is it teaching time? NO
3. ❌ Door stays locked, access denied

**Admin Anytime:**
1. Scan admin RFID card
2. System recognizes admin role
3. ✅ Door opens regardless of time

## 📞 Support

For help:
1. Check the documentation folder
2. Review the API documentation
3. Check console for error messages
4. Verify hardware connections
5. Test individual components

---

**Ready to Start?**
```bash
cd backend
pip install -r requirements.txt
python app.py
```

Then open `frontend/index.html` in your browser! 🎉

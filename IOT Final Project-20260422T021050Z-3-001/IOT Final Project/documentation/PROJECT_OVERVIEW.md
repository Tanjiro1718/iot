# IoT Access Control System - Documentation

## Project Overview

This is a complete IoT-based access control system using:
- **Frontend**: HTML/CSS/JavaScript web interface
- **Backend**: Flask REST API with SQLite database
- **Hardware**: ESP32 microcontroller with RFID scanner and servo-controlled door

## Features

### 1. User Management
- User registration and authentication (JWT-based)
- Three user roles: Admin, Instructor, Student
- User account activation/deactivation
- Profile management

### 2. RFID Card Management
- Register RFID cards to user accounts
- Card deregistration and blocking
- Unique card identification
- Registration status tracking

### 3. Access Control Logic
- **Admins**: Can open all doors anytime
- **Instructors**: Can only open doors during their teaching schedule
- **Students**: Cannot access doors (or configure as needed)
- Unregistered cards are automatically denied

### 4. Teaching Schedule Management
- Set teaching times per day (day and time range)
- Multiple schedules per instructor
- Location tracking for classes
- Real-time validation during access attempts

### 5. Access Logging
- Complete audit trail of all access attempts
- Tracks successful and denied accesses
- Reason for denial recorded
- Timestamp and user information

### 6. ESP32 Hardware Integration
- WiFi connectivity
- RFID card reading (EM4100/EM4305 format)
- Servo motor control for door locking
- LED and buzzer feedback
- Auto-close door functionality
- HTTP communication with Flask server

## Architecture

```
┌─────────────────────────────────────────┐
│         Web Browser (Frontend)          │
│  HTML/CSS/JavaScript Dashboard          │
└──────────────────┬──────────────────────┘
                   │ HTTP/REST
                   ▼
┌─────────────────────────────────────────┐
│       Flask Backend (Python)            │
│  - Authentication (JWT)                 │
│  - User Management                      │
│  - Card Management                      │
│  - Access Control Logic                 │
│  - Logging & Audit                      │
└──────────────────┬──────────────────────┘
                   │ HTTP/REST
                   ▼
┌─────────────────────────────────────────┐
│  ESP32 Microcontroller                  │
│  - RFID Card Reader                     │
│  - Servo Motor Controller               │
│  - WiFi Communication                   │
│  - Status Indicators (LED/Buzzer)       │
└──────────────────┬──────────────────────┘
                   │ Serial/GPIO
                   ▼
┌─────────────────────────────────────────┐
│       Hardware Components               │
│  - Door Lock (Servo Motor)              │
│  - RFID Scanner                         │
│  - Status LED                           │
│  - Audio Buzzer                         │
└─────────────────────────────────────────┘
```

## Database Schema

### Users Table
- `id`: Primary key
- `username`: Unique username
- `email`: User email
- `password_hash`: Hashed password
- `full_name`: User's name
- `role`: admin/instructor/student
- `is_active`: Account status
- `created_at`, `updated_at`: Timestamps

### Cards Table
- `id`: Primary key
- `card_id`: RFID card UID (unique)
- `user_id`: Foreign key to users
- `card_name`: Display name
- `status`: active/inactive/blocked
- `is_registered`: Registration status
- `registered_at`: Registration timestamp

### Schedules Table
- `id`: Primary key
- `user_id`: Instructor's user ID
- `day_of_week`: 0-6 (Monday-Sunday)
- `start_time`: HH:MM format
- `end_time`: HH:MM format
- `location`: Classroom/Location
- `is_active`: Schedule status

### AccessLogs Table
- `id`: Primary key
- `user_id`: User attempting access
- `card_id`: Card used
- `access_result`: granted/denied
- `reason`: Reason for decision
- `door_location`: Door identifier
- `attempted_at`: Timestamp

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update profile
- `GET /api/auth/check` - Verify authentication

### RFID Cards
- `POST /api/cards/register` - Register new card
- `GET /api/cards/my-cards` - Get user's cards
- `GET /api/cards/<id>` - Get card details
- `POST /api/cards/<id>/deregister` - Deregister card
- `POST /api/cards/<id>/block` - Block card (admin)
- `GET /api/cards/` - Get all cards (admin)

### Access Control
- `POST /api/access/validate-card` - Validate RFID card
- `POST /api/access/open-door` - Open door (after validation)
- `GET /api/access/door/status` - Get door status
- `POST /api/access/door/close` - Close door
- `GET /api/access/logs` - Get access logs (admin)
- `GET /api/access/esp32/test` - Test ESP32 connection

### User Management
- `GET /api/users/` - List all users (admin)
- `GET /api/users/<id>` - Get user details
- `POST /api/users/<id>/deactivate` - Deactivate user (admin)
- `POST /api/users/<id>/activate` - Activate user (admin)
- `PUT /api/users/<id>/role` - Update user role (admin)

### Schedule Management
- `POST /api/schedule/add` - Add teaching schedule
- `GET /api/schedule/my-schedule` - Get user's schedule
- `GET /api/schedule/<id>` - Get schedule details
- `PUT /api/schedule/<id>` - Update schedule
- `DELETE /api/schedule/<id>` - Delete schedule

## Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js/npm (optional, for frontend development)
- ESP32 development board
- RFID reader module
- Servo motor

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Create .env file**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Run Flask application**
   ```bash
   python app.py
   ```

Server will start at `http://localhost:5000`

### Frontend Setup

1. **Open frontend in web browser**
   - Simply open `frontend/index.html` in a web browser
   - Or serve with a simple HTTP server:
   ```bash
   cd frontend
   python -m http.server 8000
   ```

2. **Access the application**
   - Navigate to `http://localhost:5000` (via Flask) or `http://localhost:8000` (via HTTP server)

### ESP32 Setup

See `esp32_firmware/README.md` for detailed firmware installation and configuration

## Access Control Logic

### Decision Flow for Card Validation

```
Card Scanned
    ↓
Is card registered?
    ├─ NO → Deny (Card not registered)
    └─ YES
        ↓
Is card blocked?
        ├─ YES → Deny (Card blocked)
        └─ NO
            ↓
Is user active?
            ├─ NO → Deny (User inactive)
            └─ YES
                ↓
Is user Admin?
                ├─ YES → Allow (Admin access)
                └─ NO
                    ↓
Is user Instructor?
                    ├─ YES → Check Schedule
                    │         ├─ Is teaching now? 
                    │         │   ├─ YES → Allow
                    │         │   └─ NO → Deny
                    │         └─ No schedule found → Deny
                    └─ NO → Deny (Insufficient permissions)
```

## Usage Examples

### Example 1: Register as Instructor

1. Go to `http://localhost:5000`
2. Click "Register"
3. Fill in:
   - Username: `prof_john`
   - Email: `john@university.edu`
   - Full Name: `Prof. John Doe`
   - Password: `secure_password`
4. Click "Register"
5. Login with credentials

### Example 2: Set Teaching Schedule

1. Login as instructor
2. Go to "Schedule"
3. Click "Add Schedule"
4. Select: Monday, 08:00-10:00, Room 101
5. Click "Add Schedule"
6. Now instructor can only access on Monday 08:00-10:00

### Example 3: Register RFID Card

1. Login as user
2. Go to "My Cards"
3. Click "Register New Card"
4. Scan RFID card (or enter card ID manually)
5. Give it a name (e.g., "Main Card")
6. Click "Register Card"

### Example 4: Access Door

1. Bring registered RFID card near scanner
2. ESP32 reads card ID
3. Sends to Flask server for validation
4. If allowed: Door opens, green LED on, 3 beeps
5. If denied: Door stays closed, 1 long beep

## Configuration

### Flask Configuration (.env)

```env
FLASK_ENV=development
FLASK_DEBUG=True
FLASK_PORT=5000

DATABASE_URL=sqlite:///instance/iot_access_control.db
JWT_SECRET_KEY=your-secret-key-change-this

CORS_ORIGINS=http://localhost:5000,http://localhost:3000

ESP32_HOST=esp32.local
ESP32_PORT=80
```

### ESP32 Configuration (config.h)

```cpp
#define WIFI_SSID "YOUR_NETWORK_NAME"
#define WIFI_PASSWORD "YOUR_PASSWORD"
#define FLASK_SERVER "http://192.168.1.100:5000"

#define SERVO_OPEN_ANGLE 90
#define SERVO_CLOSE_ANGLE 0
#define DOOR_OPEN_TIME 3000
```

## Troubleshooting

### Database Issues
- Delete `backend/instance/iot_access_control.db`
- Restart Flask server to recreate database

### CORS Errors
- Update `CORS_ORIGINS` in `.env`
- Ensure Flask server is running

### ESP32 Connection Failed
- Check WiFi SSID and password
- Verify ESP32 IP address
- Test with: `http://<ESP32_IP>/api/status`

### RFID Card Not Reading
- Verify RFID reader power supply
- Check GPIO 16 connection
- Test RFID reader separately

### Door Won't Open
- Check servo power supply
- Verify GPIO 13 connection
- Test servo with: `http://<ESP32_IP>/api/door/open`

## Security Considerations

1. **Change JWT Secret Key** in production
2. **Use HTTPS** instead of HTTP in production
3. **Secure WiFi Network** for ESP32
4. **Password Hashing** is implemented with Werkzeug
5. **Access Logs** are maintained for auditing
6. **Role-Based Access Control** enforces permissions

## Future Enhancements

- [ ] Mobile app for card registration
- [ ] SMS/Email notifications on access attempts
- [ ] Multiple door support
- [ ] Biometric authentication (fingerprint)
- [ ] Cloud backup of access logs
- [ ] Real-time dashboard with live feed
- [ ] Integration with building management systems
- [ ] Machine learning for anomaly detection

## License

This project is provided as-is for educational purposes.

## Support

For issues or questions, please refer to:
- API Documentation: See `API_DOCUMENTATION.md`
- ESP32 Setup: See `esp32_firmware/README.md`
- Database Schema: See `DATABASE_SCHEMA.md`

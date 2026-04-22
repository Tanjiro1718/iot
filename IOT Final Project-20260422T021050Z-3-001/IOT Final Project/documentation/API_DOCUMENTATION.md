# API Documentation - IoT Access Control System

## Base URL
```
http://localhost:5000/api
```

## Authentication
Most endpoints require JWT token in Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Authentication Endpoints

### Register User
**POST** `/auth/register`

**Request Body:**
```json
{
  "username": "prof_john",
  "email": "john@university.edu",
  "full_name": "Prof. John Doe",
  "password": "secure_password",
  "role": "instructor"
}
```

**Response (201 Created):**
```json
{
  "message": "User created successfully",
  "user_id": 1,
  "username": "prof_john"
}
```

---

### Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "username": "prof_john",
  "password": "secure_password"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "prof_john",
    "email": "john@university.edu",
    "full_name": "Prof. John Doe",
    "role": "instructor",
    "is_active": true,
    "created_at": "2024-01-15T10:30:00"
  }
}
```

---

### Get Profile
**GET** `/auth/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "user": {
    "id": 1,
    "username": "prof_john",
    "email": "john@university.edu",
    "full_name": "Prof. John Doe",
    "role": "instructor",
    "is_active": true,
    "created_at": "2024-01-15T10:30:00"
  }
}
```

---

### Update Profile
**PUT** `/auth/profile`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "john.doe@university.edu",
  "full_name": "Dr. John Doe",
  "password": "new_secure_password"
}
```

**Response (200 OK):**
```json
{
  "message": "Profile updated successfully",
  "user": { ... }
}
```

---

## RFID Card Management

### Register New Card
**POST** `/cards/register`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "card_id": "12AB34CD56EF",
  "card_name": "Main Card"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Card registered successfully",
  "card_id": 5
}
```

---

### Get My Cards
**GET** `/cards/my-cards`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "cards": [
    {
      "id": 1,
      "card_id": "12AB34CD56EF",
      "user_id": 1,
      "card_name": "Main Card",
      "status": "active",
      "is_registered": true,
      "registered_at": "2024-01-15T10:35:00",
      "created_at": "2024-01-15T10:35:00"
    }
  ],
  "total": 1
}
```

---

### Get All Cards (Admin Only)
**GET** `/cards/`

**Query Parameters:**
- `limit`: Max results (default: 100)
- `user_id`: Filter by user

**Response:**
```json
{
  "cards": [ ... ],
  "total": 50
}
```

---

### Deregister Card
**POST** `/cards/<card_id>/deregister`

**Response (200 OK):**
```json
{
  "message": "Card deregistered successfully",
  "card": { ... }
}
```

---

### Block Card (Admin Only)
**POST** `/cards/<card_id>/block`

**Response (200 OK):**
```json
{
  "message": "Card blocked successfully",
  "card": { ... }
}
```

---

## Access Control

### Validate RFID Card
**POST** `/access/validate-card`

**Request Body:**
```json
{
  "card_id": "12AB34CD56EF"
}
```

**Response (200 OK):**
```json
{
  "access_granted": true,
  "user_id": 1,
  "reason": "Teaching time - access granted",
  "user_role": "instructor",
  "user_name": "Prof. John Doe"
}
```

**Response for Denied (200 OK):**
```json
{
  "access_granted": false,
  "user_id": 1,
  "reason": "Not teaching time. Teaching: 08:00-10:00",
  "user_role": "instructor",
  "user_name": "Prof. John Doe"
}
```

---

### Open Door
**POST** `/access/open-door`

**Request Body:**
```json
{
  "card_id": "12AB34CD56EF",
  "duration": 3
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Door opened successfully",
  "user_name": "Prof. John Doe"
}
```

**Response for Denied (403 Forbidden):**
```json
{
  "success": false,
  "message": "Not teaching time. Teaching: 08:00-10:00"
}
```

---

### Get Door Status
**GET** `/access/door/status`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "door_open": true,
    "door_status": "open",
    "servo_angle": 90
  }
}
```

---

### Close Door
**POST** `/access/door/close`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Door closed successfully"
}
```

---

### Get Access Logs
**GET** `/access/logs`

**Query Parameters:**
- `limit`: Max results (default: 100)
- `user_id`: Filter by user
- `result`: Filter by result (granted/denied)

**Response (200 OK):**
```json
{
  "logs": [
    {
      "id": 1,
      "user_id": 1,
      "card_id": 1,
      "access_result": "granted",
      "reason": "Teaching time",
      "door_location": "Main Door",
      "attempted_at": "2024-01-15T09:00:00"
    },
    {
      "id": 2,
      "user_id": 2,
      "card_id": null,
      "access_result": "denied",
      "reason": "unknown_card",
      "door_location": "Main Door",
      "attempted_at": "2024-01-15T14:30:00"
    }
  ],
  "total": 2
}
```

---

### Test ESP32 Connection
**GET** `/access/esp32/test`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "ESP32 connected"
}
```

---

## User Management (Admin Only)

### Get All Users
**GET** `/users/`

**Query Parameters:**
- `limit`: Max results (default: 100)
- `role`: Filter by role (admin/instructor/student)

**Response (200 OK):**
```json
{
  "users": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@university.edu",
      "full_name": "System Admin",
      "role": "admin",
      "is_active": true,
      "created_at": "2024-01-15T10:00:00"
    }
  ],
  "total": 1
}
```

---

### Get User Details
**GET** `/users/<user_id>`

**Response (200 OK):**
```json
{
  "user": { ... }
}
```

---

### Deactivate User
**POST** `/users/<user_id>/deactivate`

**Response (200 OK):**
```json
{
  "message": "User deactivated successfully",
  "user": { ... }
}
```

---

### Activate User
**POST** `/users/<user_id>/activate`

**Response (200 OK):**
```json
{
  "message": "User activated successfully",
  "user": { ... }
}
```

---

### Update User Role
**PUT** `/users/<user_id>/role`

**Request Body:**
```json
{
  "role": "instructor"
}
```

**Response (200 OK):**
```json
{
  "message": "User role updated successfully",
  "user": { ... }
}
```

---

## Schedule Management

### Add Teaching Schedule
**POST** `/schedule/add`

**Request Body:**
```json
{
  "day_of_week": 0,
  "start_time": "08:00",
  "end_time": "10:00",
  "location": "Room 101"
}
```

Valid `day_of_week` values:
- 0 = Monday
- 1 = Tuesday
- 2 = Wednesday
- 3 = Thursday
- 4 = Friday
- 5 = Saturday
- 6 = Sunday

**Response (201 Created):**
```json
{
  "message": "Schedule added successfully",
  "schedule": {
    "id": 1,
    "user_id": 1,
    "day_of_week": 0,
    "day_name": "Monday",
    "start_time": "08:00",
    "end_time": "10:00",
    "location": "Room 101",
    "is_active": true,
    "created_at": "2024-01-15T10:40:00"
  }
}
```

---

### Get My Schedule
**GET** `/schedule/my-schedule`

**Response (200 OK):**
```json
{
  "schedules": [ ... ],
  "total": 3
}
```

---

### Get Schedule Details
**GET** `/schedule/<schedule_id>`

**Response (200 OK):**
```json
{
  "schedule": { ... }
}
```

---

### Update Schedule
**PUT** `/schedule/<schedule_id>`

**Request Body:**
```json
{
  "start_time": "09:00",
  "end_time": "11:00"
}
```

**Response (200 OK):**
```json
{
  "message": "Schedule updated successfully",
  "schedule": { ... }
}
```

---

### Delete Schedule
**DELETE** `/schedule/<schedule_id>`

**Response (200 OK):**
```json
{
  "message": "Schedule deleted successfully"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required fields"
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid username or password"
}
```

### 403 Forbidden
```json
{
  "error": "Admin access required"
}
```

### 404 Not Found
```json
{
  "error": "User not found"
}
```

### 409 Conflict
```json
{
  "error": "Username already exists"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Rate Limiting

Currently no rate limiting implemented. Recommended for production:
- Login attempts: 5 per minute
- Card validation: 10 per minute per ESP32

---

## Pagination

Endpoints with large result sets support:
- `limit`: Set max number of results (default: 100, max: 1000)

Example:
```
GET /api/access/logs?limit=50&user_id=1
```

---

## Response Codes Summary

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict (e.g., duplicate) |
| 500 | Server Error |

---

## Testing with cURL

### Login and Get Token
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"prof_john","password":"secure_password"}'
```

### Use Token for Protected Endpoint
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET http://localhost:5000/api/cards/my-cards \
  -H "Authorization: Bearer $TOKEN"
```

### Register New Card
```bash
curl -X POST http://localhost:5000/api/cards/register \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"card_id":"12AB34CD56EF","card_name":"Main Card"}'
```

---

## Webhooks & Events

Future enhancement: Event-based notifications for:
- New user registration
- Card registered/deregistered
- Access granted/denied
- Failed login attempts

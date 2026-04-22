# Database Schema - IoT Access Control System

## Database Type
SQLite (located at `backend/instance/iot_access_control.db`)

## Tables Overview

```
┌─────────────────┐
│     Users       │
├─────────────────┤
│ id (PK)         │
│ username        │
│ email           │
│ password_hash   │
│ full_name       │
│ role            │
│ is_active       │
│ created_at      │
│ updated_at      │
└─────────────────┘
        │
        ├──────────────────┬──────────────────┐
        ▼                  ▼                  ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│     Cards       │ │   Schedules     │ │   AccessLogs    │
├─────────────────┤ ├─────────────────┤ ├─────────────────┤
│ id (PK)         │ │ id (PK)         │ │ id (PK)         │
│ card_id (UK)    │ │ user_id (FK)    │ │ user_id (FK)    │
│ user_id (FK)    │ │ day_of_week     │ │ card_id (FK)    │
│ card_name       │ │ start_time      │ │ access_result   │
│ status          │ │ end_time        │ │ reason          │
│ is_registered   │ │ location        │ │ door_location   │
│ registered_at   │ │ is_active       │ │ attempted_at    │
│ created_at      │ │ created_at      │ │                 │
│ updated_at      │ │ updated_at      │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

## Users Table

**Table Name:** `users`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | Unique user identifier |
| username | VARCHAR(80) | UNIQUE, NOT NULL | Login username |
| email | VARCHAR(120) | UNIQUE, NOT NULL | User email address |
| password_hash | VARCHAR(255) | NOT NULL | Hashed password (Werkzeug) |
| full_name | VARCHAR(120) | NOT NULL | User's full name |
| role | VARCHAR(20) | NOT NULL, DEFAULT 'instructor' | User role (admin/instructor/student) |
| is_active | BOOLEAN | DEFAULT TRUE | Account active status |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- UNIQUE on `username`
- UNIQUE on `email`

**Example:**
```sql
INSERT INTO users (username, email, password_hash, full_name, role)
VALUES ('prof_john', 'john@uni.edu', 'pbkdf2:sha256:...', 'Prof. John', 'instructor');
```

---

## Cards Table

**Table Name:** `cards`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | Unique card identifier |
| card_id | VARCHAR(100) | UNIQUE, NOT NULL, INDEX | RFID card UID |
| user_id | INTEGER | NOT NULL, FOREIGN KEY | Reference to users table |
| card_name | VARCHAR(120) | - | Display name for card |
| status | VARCHAR(20) | DEFAULT 'active' | Card status (active/inactive/blocked) |
| is_registered | BOOLEAN | DEFAULT FALSE | Registration status |
| registered_at | DATETIME | - | When card was registered |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Constraints:**
- FOREIGN KEY: `user_id` → `users.id` (CASCADE DELETE)

**Indexes:**
- UNIQUE on `card_id` (for fast lookups during scanning)
- INDEX on `user_id` (for user's card queries)

**Example:**
```sql
INSERT INTO cards (card_id, user_id, card_name, is_registered)
VALUES ('12AB34CD56EF', 1, 'Main Card', TRUE);
```

**Status Values:**
- `active` - Card is functional and registered
- `inactive` - Card registered but disabled
- `blocked` - Card is blocked (lost/stolen)

---

## Schedules Table

**Table Name:** `schedules`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | Unique schedule identifier |
| user_id | INTEGER | NOT NULL, FOREIGN KEY | Instructor's user ID |
| day_of_week | INTEGER | NOT NULL | Day 0-6 (Mon-Sun) |
| start_time | VARCHAR(5) | NOT NULL | Start time (HH:MM format) |
| end_time | VARCHAR(5) | NOT NULL | End time (HH:MM format) |
| location | VARCHAR(120) | - | Classroom/location |
| is_active | BOOLEAN | DEFAULT TRUE | Schedule is active |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Constraints:**
- FOREIGN KEY: `user_id` → `users.id` (CASCADE DELETE)

**Indexes:**
- INDEX on `user_id` (for instructor's schedule queries)
- INDEX on `day_of_week` (for schedule checking)

**Example:**
```sql
INSERT INTO schedules (user_id, day_of_week, start_time, end_time, location)
VALUES (1, 0, '08:00', '10:00', 'Room 101');
```

**Day of Week Values:**
- 0 = Monday
- 1 = Tuesday
- 2 = Wednesday
- 3 = Thursday
- 4 = Friday
- 5 = Saturday
- 6 = Sunday

**Time Format:**
- 24-hour format (00:00 - 23:59)
- Stored as VARCHAR(5) for simplicity

---

## AccessLogs Table

**Table Name:** `access_logs`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | Unique log entry ID |
| user_id | INTEGER | - , FOREIGN KEY | User attempting access (nullable for unknown cards) |
| card_id | INTEGER | - , FOREIGN KEY | Card used (nullable for manual attempts) |
| access_result | VARCHAR(20) | NOT NULL | Result (granted/denied/error) |
| reason | VARCHAR(100) | - | Reason for decision |
| door_location | VARCHAR(120) | DEFAULT 'Main Door' | Door identifier |
| attempted_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Attempt timestamp |

**Constraints:**
- FOREIGN KEY: `user_id` → `users.id` (SET NULL on delete)
- FOREIGN KEY: `card_id` → `cards.id` (SET NULL on delete)

**Indexes:**
- INDEX on `user_id` (for user access history)
- INDEX on `attempted_at` (for time-based queries)
- INDEX on `access_result` (for filtering logs)

**Example:**
```sql
INSERT INTO access_logs (user_id, card_id, access_result, reason, door_location)
VALUES (1, 1, 'granted', 'Teaching time', 'Main Door');
```

**Access Result Values:**
- `granted` - Access allowed
- `denied` - Access denied
- `error` - System error during validation

**Common Reason Values:**
- `admin_access` - Admin card, always allowed
- `teaching_time` - Instructor during scheduled time
- `not_teaching_time` - Instructor outside schedule
- `card_not_registered` - Card not registered in system
- `card_blocked` - Card is blocked
- `user_inactive` - User account deactivated
- `unknown_card` - Card UID not found
- `insufficient_permissions` - User role doesn't permit access
- `no_schedule` - Instructor has no teaching schedule

---

## Relationships

### User → Cards (One to Many)
- One user can have multiple RFID cards
- When user is deleted, associated cards are deleted (CASCADE)

### User → Schedules (One to Many)
- One instructor can have multiple teaching schedules
- When user is deleted, associated schedules are deleted (CASCADE)

### User → AccessLogs (One to Many)
- One user can have multiple access log entries
- When user is deleted, log entries are set to NULL (SET NULL)

### Card → AccessLogs (One to Many)
- One card can have multiple log entries
- When card is deleted, log entries are set to NULL (SET NULL)

---

## Query Examples

### Find User's Cards
```sql
SELECT * FROM cards WHERE user_id = 1 AND status = 'active';
```

### Check Instructor's Current Schedule
```sql
SELECT * FROM schedules 
WHERE user_id = 1 
AND day_of_week = strftime('%w', 'now') - 1
AND is_active = TRUE;
```

### Get Recent Access Logs
```sql
SELECT * FROM access_logs 
ORDER BY attempted_at DESC 
LIMIT 50;
```

### Count Granted vs Denied Access
```sql
SELECT access_result, COUNT(*) as count 
FROM access_logs 
WHERE DATE(attempted_at) = DATE('now')
GROUP BY access_result;
```

### Find Suspicious Activity
```sql
SELECT user_id, COUNT(*) as denied_count, attempted_at
FROM access_logs 
WHERE access_result = 'denied' 
AND attempted_at > datetime('now', '-1 hour')
GROUP BY user_id 
HAVING COUNT(*) > 5;
```

### Get User's Access History
```sql
SELECT al.*, c.card_name, u.full_name
FROM access_logs al
LEFT JOIN cards c ON al.card_id = c.id
LEFT JOIN users u ON al.user_id = u.id
WHERE al.user_id = 1
ORDER BY al.attempted_at DESC;
```

---

## Data Retention Policy

### Recommended Cleanup
```sql
-- Delete logs older than 1 year
DELETE FROM access_logs 
WHERE attempted_at < datetime('now', '-1 year');

-- Delete inactive cards
DELETE FROM cards 
WHERE status = 'inactive' 
AND updated_at < datetime('now', '-6 months');
```

---

## Backup and Recovery

### Export Database
```bash
sqlite3 backend/instance/iot_access_control.db ".dump" > backup.sql
```

### Restore Database
```bash
sqlite3 backend/instance/iot_access_control.db < backup.sql
```

### Backup with Timestamp
```bash
cp backend/instance/iot_access_control.db backup_$(date +%Y%m%d_%H%M%S).db
```

---

## Performance Optimization

### Key Indexes (Already Created)
1. `cards.card_id` - For RFID card validation (most frequent query)
2. `cards.user_id` - For user's cards listing
3. `schedules.user_id` - For schedule queries
4. `access_logs.user_id` - For user history
5. `access_logs.attempted_at` - For log queries

### Recommended Additional Indexes (for large deployments)
```sql
CREATE INDEX idx_access_logs_result ON access_logs(access_result);
CREATE INDEX idx_access_logs_date ON access_logs(DATE(attempted_at));
CREATE INDEX idx_schedules_day ON schedules(day_of_week);
CREATE INDEX idx_users_role ON users(role);
```

---

## Database Statistics

Estimated storage for different scales:

| Users | Cards | 1-Year Logs | DB Size |
|-------|-------|-------------|---------|
| 100 | 150 | 10,000 | ~2 MB |
| 500 | 750 | 50,000 | ~8 MB |
| 1,000 | 1,500 | 100,000 | ~15 MB |
| 5,000 | 7,500 | 500,000 | ~70 MB |

---

## Migration Instructions

To modify schema (add/remove columns):

```python
# In app.py, use Flask-Migrate or SQLAlchemy Alembic
# Example: Adding a new field to Users

# 1. Update model in models/user.py
# 2. Run: flask db migrate
# 3. Review generated migration
# 4. Run: flask db upgrade
```

For development, simply delete the database and restart Flask:
```bash
rm backend/instance/iot_access_control.db
python app.py
```

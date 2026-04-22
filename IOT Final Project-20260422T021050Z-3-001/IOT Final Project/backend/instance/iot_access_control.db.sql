BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "access_logs" (
	"id"	INTEGER NOT NULL,
	"user_id"	INTEGER,
	"card_id"	INTEGER,
	"access_result"	VARCHAR(20) NOT NULL,
	"reason"	VARCHAR(100),
	"door_location"	VARCHAR(120),
	"attempted_at"	DATETIME,
	PRIMARY KEY("id"),
	FOREIGN KEY("card_id") REFERENCES "cards"("id"),
	FOREIGN KEY("user_id") REFERENCES "users"("id")
);
CREATE TABLE IF NOT EXISTS "cards" (
	"id"	INTEGER NOT NULL,
	"card_id"	VARCHAR(100) NOT NULL,
	"user_id"	INTEGER NOT NULL,
	"card_name"	VARCHAR(120),
	"status"	VARCHAR(20),
	"is_registered"	BOOLEAN,
	"registered_at"	DATETIME,
	"created_at"	DATETIME,
	"updated_at"	DATETIME,
	PRIMARY KEY("id"),
	FOREIGN KEY("user_id") REFERENCES "users"("id")
);
CREATE TABLE IF NOT EXISTS "schedules" (
	"id"	INTEGER NOT NULL,
	"user_id"	INTEGER NOT NULL,
	"day_of_week"	INTEGER NOT NULL,
	"start_time"	VARCHAR(5) NOT NULL,
	"end_time"	VARCHAR(5) NOT NULL,
	"location"	VARCHAR(120),
	"is_active"	BOOLEAN,
	"created_at"	DATETIME,
	"updated_at"	DATETIME,
	PRIMARY KEY("id"),
	FOREIGN KEY("user_id") REFERENCES "users"("id")
);
CREATE TABLE IF NOT EXISTS "users" (
	"id"	INTEGER NOT NULL,
	"username"	VARCHAR(80) NOT NULL,
	"email"	VARCHAR(120) NOT NULL,
	"password_hash"	VARCHAR(255) NOT NULL,
	"full_name"	VARCHAR(120) NOT NULL,
	"role"	VARCHAR(20) NOT NULL,
	"is_active"	BOOLEAN,
	"created_at"	DATETIME,
	"updated_at"	DATETIME,
	UNIQUE("email"),
	PRIMARY KEY("id"),
	UNIQUE("username")
);
INSERT INTO "users" VALUES (1,'von123','von123','pbkdf2:sha256:600000$89povwjD4kSrNQlg$ef935152f9497bcad5615c65d8a79d14763593c13adfc9d1b9f3050a489e15e2','OJT 1','admin',1,'2026-04-18 03:12:24.383800','2026-04-18 03:12:24.383800');
CREATE UNIQUE INDEX IF NOT EXISTS "ix_cards_card_id" ON "cards" (
	"card_id"
);
COMMIT;

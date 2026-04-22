// ============================================
// IoT RFID Door Access Control System
// ESP32 Firmware
// ============================================

#include <WiFi.h>
#include <WebServer.h>
#include <SPIFFS.h>
#include <ArduinoJson.h>
#include <Servo.h>

// ============================================
// CONFIGURATION
// ============================================

#define RFID_RX_PIN 16  // UART2 RX for RFID Reader
#define RFID_TX_PIN 17  // UART2 TX (not used)
#define SERVO_PIN 13    // Servo motor control pin
#define LED_PIN 2       // LED indicator
#define BUZZER_PIN 4    // Buzzer/Beeper

#define SERVO_OPEN_ANGLE 90    // Angle when door is open
#define SERVO_CLOSE_ANGLE 0    // Angle when door is closed
#define DOOR_OPEN_TIME 3000    // How long to keep door open (ms)

// WiFi Configuration
const char* SSID = "YOUR_SSID";
const char* PASSWORD = "YOUR_PASSWORD";
const char* FLASK_SERVER = "http://192.168.x.x:5000";  // Flask server address

// ============================================
// GLOBAL VARIABLES
// ============================================

WebServer server(80);
Servo doorServo;
String lastCardID = "";
unsigned long lastCardTime = 0;
const unsigned long CARD_READ_DEBOUNCE = 500;  // 500ms debounce

bool doorOpen = false;
unsigned long doorOpenTime = 0;

// ============================================
// SETUP
// ============================================

void setup() {
    // Serial communication for debugging
    Serial.begin(115200);
    delay(2000);
    
    Serial.println("\n\n");
    Serial.println("=================================");
    Serial.println("IoT Door Access Control - ESP32");
    Serial.println("=================================");
    
    // Initialize pins
    pinMode(LED_PIN, OUTPUT);
    pinMode(BUZZER_PIN, OUTPUT);
    
    digitalWrite(LED_PIN, LOW);
    digitalWrite(BUZZER_PIN, LOW);
    
    // Initialize servo
    doorServo.attach(SERVO_PIN);
    closeDoor();
    
    // Initialize SPIFFS
    if (!SPIFFS.begin(true)) {
        Serial.println("SPIFFS Mount Failed");
        return;
    }
    Serial.println("SPIFFS Mounted Successfully");
    
    // Initialize RFID Reader (UART2)
    Serial2.begin(9600, SERIAL_8N1, RFID_RX_PIN, RFID_TX_PIN);
    Serial.println("RFID Reader Initialized");
    
    // Connect to WiFi
    connectToWiFi();
    
    // Setup web server routes
    setupWebServer();
    
    Serial.println("Setup Complete!");
}

// ============================================
// MAIN LOOP
// ============================================

void loop() {
    server.handleClient();
    
    // Read from RFID reader
    if (Serial2.available()) {
        readRFIDCard();
    }
    
    // Auto-close door after timeout
    if (doorOpen && (millis() - doorOpenTime) > DOOR_OPEN_TIME) {
        closeDoor();
    }
}

// ============================================
// WiFi CONNECTION
// ============================================

void connectToWiFi() {
    Serial.print("Connecting to WiFi: ");
    Serial.println(SSID);
    
    WiFi.begin(SSID, PASSWORD);
    
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        delay(500);
        Serial.print(".");
        attempts++;
    }
    
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\nWiFi Connected!");
        Serial.print("IP Address: ");
        Serial.println(WiFi.localIP());
        digitalWrite(LED_PIN, HIGH);
    } else {
        Serial.println("\nFailed to connect to WiFi");
        digitalWrite(LED_PIN, LOW);
    }
}

// ============================================
// RFID CARD READING
// ============================================

void readRFIDCard() {
    String cardID = "";
    
    // Read until newline or timeout
    unsigned long timeout = millis() + 100;
    while (Serial2.available() && millis() < timeout) {
        char c = Serial2.read();
        if (c == '\n' || c == '\r') {
            if (cardID.length() > 0) break;
        } else if (c >= '0' && c <= 'F') {  // Valid hex character
            cardID += c;
        }
    }
    
    // Debounce: ignore duplicate reads within 500ms
    if (cardID.length() > 0 && cardID != lastCardID) {
        lastCardID = cardID;
        lastCardTime = millis();
        
        Serial.print("RFID Card Detected: ");
        Serial.println(cardID);
        
        // Beep to indicate card read
        beep(2, 100);
        
        // Send card to Flask server for validation
        validateCardOnServer(cardID);
    }
}

// ============================================
// SERVER COMMUNICATION
// ============================================

void validateCardOnServer(String cardID) {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi not connected");
        beep(1, 200);  // Single long beep for error
        return;
    }
    
    // Create JSON payload
    StaticJsonDocument<256> doc;
    doc["card_id"] = cardID;
    
    String jsonStr;
    serializeJson(doc, jsonStr);
    
    // Send HTTP POST request to Flask server
    HTTPClient http;
    String url = String(FLASK_SERVER) + "/api/access/open-door";
    
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    
    int httpCode = http.POST(jsonStr);
    
    if (httpCode == 200) {
        String response = http.getString();
        
        // Parse response
        StaticJsonDocument<256> responseDoc;
        DeserializationError error = deserializeJson(responseDoc, response);
        
        if (!error && responseDoc["success"] == true) {
            Serial.println("Access Granted!");
            openDoor();
            beep(3, 100);  // Three beeps for success
        } else {
            Serial.println("Access Denied");
            beep(1, 300);  // Long beep for denial
        }
    } else {
        Serial.print("HTTP Error: ");
        Serial.println(httpCode);
        beep(1, 200);  // Beep for error
    }
    
    http.end();
}

// ============================================
// DOOR CONTROL
// ============================================

void openDoor() {
    Serial.println("Opening Door...");
    doorServo.write(SERVO_OPEN_ANGLE);
    doorOpen = true;
    doorOpenTime = millis();
    digitalWrite(LED_PIN, HIGH);
}

void closeDoor() {
    Serial.println("Closing Door...");
    doorServo.write(SERVO_CLOSE_ANGLE);
    doorOpen = false;
    digitalWrite(LED_PIN, LOW);
}

// ============================================
// SOUND (BUZZER)
// ============================================

void beep(int count, int duration) {
    for (int i = 0; i < count; i++) {
        digitalWrite(BUZZER_PIN, HIGH);
        delay(duration);
        digitalWrite(BUZZER_PIN, LOW);
        delay(duration / 2);
    }
}

// ============================================
// WEB SERVER ENDPOINTS
// ============================================

void setupWebServer() {
    // Status endpoint
    server.on("/api/status", HTTP_GET, handleStatus);
    
    // Door control endpoints
    server.on("/api/door/open", HTTP_POST, handleDoorOpen);
    server.on("/api/door/close", HTTP_POST, handleDoorClose);
    server.on("/api/door/status", HTTP_GET, handleDoorStatus);
    
    // Test endpoint
    server.on("/", HTTP_GET, handleRoot);
    
    server.begin();
    Serial.println("Web Server Started");
}

void handleRoot() {
    server.send(200, "text/plain", "ESP32 Door Control System");
}

void handleStatus() {
    StaticJsonDocument<128> doc;
    doc["status"] = "online";
    doc["door_open"] = doorOpen;
    doc["ssid"] = WiFi.SSID();
    doc["ip"] = WiFi.localIP().toString();
    
    String response;
    serializeJson(doc, response);
    server.send(200, "application/json", response);
}

void handleDoorOpen() {
    // Get duration from request if provided
    int duration = 3;  // Default 3 seconds
    
    if (server.hasArg("duration")) {
        duration = server.arg("duration").toInt();
    }
    
    openDoor();
    doorOpenTime = millis();
    
    StaticJsonDocument<128> doc;
    doc["success"] = true;
    doc["message"] = "Door opened";
    doc["duration"] = duration;
    
    String response;
    serializeJson(doc, response);
    server.send(200, "application/json", response);
}

void handleDoorClose() {
    closeDoor();
    
    StaticJsonDocument<128> doc;
    doc["success"] = true;
    doc["message"] = "Door closed";
    
    String response;
    serializeJson(doc, response);
    server.send(200, "application/json", response);
}

void handleDoorStatus() {
    StaticJsonDocument<128> doc;
    doc["door_open"] = doorOpen;
    doc["door_status"] = doorOpen ? "open" : "closed";
    doc["servo_angle"] = doorOpen ? SERVO_OPEN_ANGLE : SERVO_CLOSE_ANGLE;
    
    String response;
    serializeJson(doc, response);
    server.send(200, "application/json", response);
}

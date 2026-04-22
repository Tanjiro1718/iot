// ESP32 Configuration File

#ifndef CONFIG_H
#define CONFIG_H

// WiFi Credentials
#define WIFI_SSID "YOUR_NETWORK_NAME"
#define WIFI_PASSWORD "YOUR_PASSWORD"

// Server Configuration
#define FLASK_SERVER "http://192.168.1.100:5000"  // Change to your Flask server IP

// Hardware Pins
#define RFID_RX_PIN 16        // RX pin for RFID reader (UART2)
#define RFID_TX_PIN 17        // TX pin for RFID reader (not used)
#define SERVO_PIN 13          // Servo motor control pin
#define LED_PIN 2             // Status LED
#define BUZZER_PIN 4          // Buzzer/Speaker

// Servo Configuration
#define SERVO_OPEN_ANGLE 90   // Angle when door opens
#define SERVO_CLOSE_ANGLE 0   // Angle when door closes
#define DOOR_OPEN_TIME 3000   // Time door stays open (milliseconds)

// Communication
#define RFID_BAUD_RATE 9600   // RFID reader baud rate

// Debouncing
#define CARD_READ_DEBOUNCE 500  // Minimum time between card reads

#endif  // CONFIG_H

import os
from datetime import timedelta

class Config:
    """Base configuration"""
    # MySQL Configuration
    MYSQL_USER = os.getenv('MYSQL_USER', 'root')
    MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', '096161')
    MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
    MYSQL_PORT = int(os.getenv('MYSQL_PORT', 3306))
    MYSQL_DB = os.getenv('MYSQL_DB', 'iot_access_control')
    
    # Database configuration
    DB_BACKEND = os.getenv('DB_BACKEND', 'sqlite').lower()
    SQLITE_PATH = os.getenv(
        'SQLITE_PATH',
        os.path.join(os.path.dirname(__file__), 'instance', 'iot_access_control.db')
    )

    if DB_BACKEND == 'mysql':
        SQLALCHEMY_DATABASE_URI = f'mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}'
    else:
        SQLALCHEMY_DATABASE_URI = f'sqlite:///{SQLITE_PATH}'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT Configuration
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-this-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    
    # Flask Configuration
    DEBUG = os.getenv('FLASK_DEBUG', False)
    TESTING = False
    
    # CORS
    CORS_ORIGINS = os.getenv(
        'CORS_ORIGINS',
        'http://127.0.0.1:5000,http://localhost:5000,http://127.0.0.1:3000,http://localhost:3000'
    )
    
    # ESP32 Configuration
    ESP32_HOST = os.getenv('ESP32_HOST', 'esp32.local')
    ESP32_PORT = int(os.getenv('ESP32_PORT', 80))

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False

class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False

config_by_name = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}

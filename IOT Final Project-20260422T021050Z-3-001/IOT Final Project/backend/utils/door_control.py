"""Door control utility for communicating with ESP32"""
import requests
import json
from flask import current_app

class DoorController:
    """Handle communication with ESP32 door lock controller"""
    
    def __init__(self):
        self.esp32_host = current_app.config.get('ESP32_HOST', 'esp32.local')
        self.esp32_port = current_app.config.get('ESP32_PORT', 80)
        self.base_url = f'http://{self.esp32_host}:{self.esp32_port}'
    
    def open_door(self, duration=3):
        """
        Send command to ESP32 to open door
        
        Args:
            duration: How long to keep servo open (in seconds)
            
        Returns:
            {'success': bool, 'message': str}
        """
        try:
            endpoint = f'{self.base_url}/api/door/open'
            payload = {'duration': duration}
            
            response = requests.post(
                endpoint,
                json=payload,
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                return {'success': True, 'message': 'Door opened successfully', 'data': data}
            else:
                return {'success': False, 'message': f'ESP32 error: {response.status_code}'}
        
        except requests.exceptions.Timeout:
            return {'success': False, 'message': 'ESP32 connection timeout'}
        except requests.exceptions.ConnectionError:
            return {'success': False, 'message': 'Cannot connect to ESP32'}
        except Exception as e:
            return {'success': False, 'message': f'Error: {str(e)}'}
    
    def close_door(self):
        """Send command to ESP32 to close door"""
        try:
            endpoint = f'{self.base_url}/api/door/close'
            response = requests.post(endpoint, timeout=5)
            
            if response.status_code == 200:
                return {'success': True, 'message': 'Door closed successfully'}
            else:
                return {'success': False, 'message': f'ESP32 error: {response.status_code}'}
        
        except Exception as e:
            return {'success': False, 'message': f'Error: {str(e)}'}
    
    def get_door_status(self):
        """Get current door status from ESP32"""
        try:
            endpoint = f'{self.base_url}/api/door/status'
            response = requests.get(endpoint, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                return {'success': True, 'data': data}
            else:
                return {'success': False, 'message': f'ESP32 error: {response.status_code}'}
        
        except Exception as e:
            return {'success': False, 'message': f'Error: {str(e)}'}
    
    def test_connection(self):
        """Test ESP32 connection"""
        try:
            endpoint = f'{self.base_url}/api/status'
            response = requests.get(endpoint, timeout=5)
            
            if response.status_code == 200:
                return {'success': True, 'message': 'ESP32 connected'}
            else:
                return {'success': False, 'message': 'ESP32 not responding'}
        
        except Exception as e:
            return {'success': False, 'message': f'Connection failed: {str(e)}'}

def get_door_controller():
    """Factory function to get door controller instance"""
    return DoorController()

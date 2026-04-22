"""Access control routes for RFID card scanning"""
from flask import Blueprint, request, jsonify
from utils.rfid_utils import validate_rfid_card
from utils.door_control import get_door_controller
from models import AccessLog
from database import db

access_bp = Blueprint('access', __name__, url_prefix='/api/access')

@access_bp.route('/validate-card', methods=['POST'])
def validate_card():
    """
    Validate RFID card and return access decision
    Expected JSON: {'card_id': 'XXXXXXXX'}
    """
    try:
        data = request.get_json()
        
        if not data or 'card_id' not in data:
            return jsonify({'error': 'Missing card_id'}), 400
        
        card_id = data['card_id'].strip()
        
        # Validate the card
        result = validate_rfid_card(card_id)
        
        return jsonify(result), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@access_bp.route('/open-door', methods=['POST'])
def open_door():
    """
    Process door opening after successful card validation
    Expected JSON: {'card_id': 'XXXXXXXX', 'duration': 3}
    """
    try:
        data = request.get_json()
        
        if not data or 'card_id' not in data:
            return jsonify({'error': 'Missing card_id'}), 400
        
        card_id = data['card_id'].strip()
        duration = data.get('duration', 3)  # Default 3 seconds
        
        # Validate card first
        validation_result = validate_rfid_card(card_id)
        
        if not validation_result['access_granted']:
            return jsonify({
                'success': False,
                'message': validation_result['reason']
            }), 403
        
        # Send command to ESP32 to open door
        door_controller = get_door_controller()
        door_result = door_controller.open_door(duration)
        
        if door_result['success']:
            return jsonify({
                'success': True,
                'message': 'Door opened successfully',
                'user_name': validation_result['user_name']
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': door_result['message']
            }), 500
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@access_bp.route('/door/status', methods=['GET'])
def get_door_status():
    """Get current door status"""
    try:
        door_controller = get_door_controller()
        result = door_controller.get_door_status()
        
        return jsonify(result), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@access_bp.route('/door/close', methods=['POST'])
def close_door():
    """Close the door (manual command)"""
    try:
        door_controller = get_door_controller()
        result = door_controller.close_door()
        
        return jsonify(result), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@access_bp.route('/logs', methods=['GET'])
def get_access_logs():
    """Get access logs with optional filtering"""
    try:
        limit = request.args.get('limit', 100, type=int)
        user_id = request.args.get('user_id', type=int)
        access_result = request.args.get('result')  # 'granted' or 'denied'
        
        query = AccessLog.query.order_by(AccessLog.attempted_at.desc())
        
        if user_id:
            query = query.filter_by(user_id=user_id)
        
        if access_result:
            query = query.filter_by(access_result=access_result)
        
        logs = query.limit(limit).all()
        
        return jsonify({
            'logs': [log.to_dict() for log in logs],
            'total': len(logs)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@access_bp.route('/esp32/test', methods=['GET'])
def test_esp32_connection():
    """Test connection to ESP32"""
    try:
        door_controller = get_door_controller()
        result = door_controller.test_connection()
        
        return jsonify(result), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

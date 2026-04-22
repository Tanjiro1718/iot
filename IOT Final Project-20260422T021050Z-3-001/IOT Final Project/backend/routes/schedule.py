"""Teaching schedule routes for instructors"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import Schedule, User, Room
from database import db

schedule_bp = Blueprint('schedule', __name__, url_prefix='/api/schedule')


@schedule_bp.route('/rooms', methods=['GET'])
@jwt_required()
def get_rooms():
    """Get all active rooms"""
    try:
        rooms = Room.query.filter_by(is_active=True).order_by(Room.name.asc()).all()

        return jsonify({
            'rooms': [room.to_dict() for room in rooms],
            'total': len(rooms)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@schedule_bp.route('/rooms', methods=['POST'])
@jwt_required()
def add_room():
    """Add a room to the room registry (admin only)"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403

        data = request.get_json() or {}
        name = str(data.get('name', '')).strip()

        if not name:
            return jsonify({'error': 'Room name is required'}), 400

        existing_room = Room.query.filter(db.func.lower(Room.name) == name.lower()).first()
        if existing_room:
            if existing_room.is_active:
                return jsonify({'error': 'Room already exists'}), 409
            existing_room.is_active = True
            existing_room.name = name
            room = existing_room
        else:
            room = Room(name=name)
            db.session.add(room)

        db.session.commit()

        return jsonify({
            'message': 'Room added successfully',
            'room': room.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@schedule_bp.route('', methods=['GET'])
@schedule_bp.route('/', methods=['GET'])
@jwt_required()
def get_all_schedules():
    """Get all schedules (admin only)"""
    try:
        claims = get_jwt()

        if claims.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403

        limit = request.args.get('limit', 200, type=int)
        user_filter = request.args.get('user_id', type=int)

        query = Schedule.query.filter_by(is_active=True)
        if user_filter:
            query = query.filter_by(user_id=user_filter)

        schedules = query.order_by(Schedule.day_of_week.asc(), Schedule.start_time.asc()).limit(limit).all()

        schedule_list = []
        for schedule in schedules:
            row = schedule.to_dict()
            instructor = User.query.get(schedule.user_id)
            row['instructor_name'] = instructor.full_name if instructor else None
            row['instructor_username'] = instructor.username if instructor else None
            schedule_list.append(row)

        return jsonify({
            'schedules': schedule_list,
            'total': len(schedule_list)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@schedule_bp.route('/all', methods=['GET'])
@jwt_required()
def get_all_schedules_explicit():
    """Get all schedules (admin only) using explicit path"""
    return get_all_schedules()

@schedule_bp.route('/add', methods=['POST'])
@jwt_required()
def add_schedule():
    """Add a teaching schedule"""
    try:
        user_id = int(get_jwt_identity())
        claims = get_jwt()
        
        # Only admins can add schedules for other users
        target_user_id = int(request.get_json().get('user_id', user_id))
        
        if target_user_id != user_id and claims.get('role') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 403

        target_user = User.query.get(target_user_id)
        if not target_user:
            return jsonify({'error': 'Target user not found'}), 404

        if target_user.role != 'instructor':
            return jsonify({'error': 'Schedule can only be assigned to instructors'}), 400
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['day_of_week', 'start_time', 'end_time']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Validate day of week (0-6)
        if not 0 <= data['day_of_week'] <= 6:
            return jsonify({'error': 'Invalid day of week (0-6)'}), 400
        
        # Validate time format (HH:MM)
        try:
            start_parts = data['start_time'].split(':')
            end_parts = data['end_time'].split(':')
            
            if len(start_parts) != 2 or len(end_parts) != 2:
                raise ValueError("Invalid time format")
            
            start_hour, start_min = int(start_parts[0]), int(start_parts[1])
            end_hour, end_min = int(end_parts[0]), int(end_parts[1])
            
            if not (0 <= start_hour <= 23 and 0 <= start_min <= 59):
                raise ValueError("Invalid start time")
            if not (0 <= end_hour <= 23 and 0 <= end_min <= 59):
                raise ValueError("Invalid end time")
        
        except (ValueError, IndexError):
            return jsonify({'error': 'Invalid time format. Use HH:MM'}), 400
        
        schedule = Schedule(
            user_id=target_user_id,
            day_of_week=data['day_of_week'],
            start_time=data['start_time'],
            end_time=data['end_time'],
            location=data.get('location')
        )
        
        db.session.add(schedule)
        db.session.commit()
        
        return jsonify({
            'message': 'Schedule added successfully',
            'schedule': schedule.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@schedule_bp.route('/my-schedule', methods=['GET'])
@jwt_required()
def get_my_schedule():
    """Get current user's schedule"""
    try:
        user_id = int(get_jwt_identity())
        schedules = Schedule.query.filter_by(user_id=user_id, is_active=True).all()
        
        return jsonify({
            'schedules': [schedule.to_dict() for schedule in schedules],
            'total': len(schedules)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@schedule_bp.route('/<int:schedule_id>', methods=['GET'])
@jwt_required()
def get_schedule(schedule_id):
    """Get schedule details"""
    try:
        user_id = int(get_jwt_identity())
        claims = get_jwt()
        
        schedule = Schedule.query.get(schedule_id)
        
        if not schedule:
            return jsonify({'error': 'Schedule not found'}), 404
        
        # Users can only see their own schedule, except admins
        if schedule.user_id != user_id and claims.get('role') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 403
        
        return jsonify({'schedule': schedule.to_dict()}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@schedule_bp.route('/<int:schedule_id>', methods=['PUT'])
@jwt_required()
def update_schedule(schedule_id):
    """Update schedule"""
    try:
        user_id = int(get_jwt_identity())
        claims = get_jwt()
        
        schedule = Schedule.query.get(schedule_id)
        
        if not schedule:
            return jsonify({'error': 'Schedule not found'}), 404
        
        # Users can only update their own schedule, except admins
        if schedule.user_id != user_id and claims.get('role') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        
        if 'day_of_week' in data:
            if not 0 <= data['day_of_week'] <= 6:
                return jsonify({'error': 'Invalid day of week'}), 400
            schedule.day_of_week = data['day_of_week']
        
        if 'start_time' in data:
            schedule.start_time = data['start_time']
        
        if 'end_time' in data:
            schedule.end_time = data['end_time']
        
        if 'location' in data:
            schedule.location = data['location']

        if 'user_id' in data:
            if claims.get('role') != 'admin':
                return jsonify({'error': 'Only admins can reassign schedules'}), 403
            new_user_id = int(data['user_id'])
            target_user = User.query.get(new_user_id)
            if not target_user:
                return jsonify({'error': 'Target user not found'}), 404
            if target_user.role != 'instructor':
                return jsonify({'error': 'Schedule can only be assigned to instructors'}), 400
            schedule.user_id = new_user_id
        
        db.session.commit()
        
        return jsonify({
            'message': 'Schedule updated successfully',
            'schedule': schedule.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@schedule_bp.route('/<int:schedule_id>', methods=['DELETE'])
@jwt_required()
def delete_schedule(schedule_id):
    """Delete schedule"""
    try:
        user_id = int(get_jwt_identity())
        claims = get_jwt()
        
        schedule = Schedule.query.get(schedule_id)
        
        if not schedule:
            return jsonify({'error': 'Schedule not found'}), 404
        
        # Users can only delete their own schedule, except admins
        if schedule.user_id != user_id and claims.get('role') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 403
        
        db.session.delete(schedule)
        db.session.commit()
        
        return jsonify({'message': 'Schedule deleted successfully'}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

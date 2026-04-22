"""RFID utility functions for card validation and access control"""
from models import Card, User, AccessLog, Schedule
from database import db
from datetime import datetime

def validate_rfid_card(card_id):
    """
    Validate RFID card and determine access permission
    
    Returns:
        {
            'access_granted': bool,
            'user_id': int or None,
            'reason': str,
            'user_role': str or None,
            'user_name': str or None
        }
    """
    
    # Find the card in database
    card = Card.query.filter_by(card_id=card_id).first()
    
    if not card:
        log_access_attempt(None, None, 'denied', 'unknown_card')
        return {
            'access_granted': False,
            'user_id': None,
            'reason': 'Card not found in system',
            'user_role': None,
            'user_name': None
        }
    
    # Check if card is registered
    if not card.is_registered:
        log_access_attempt(card.user_id, card.id, 'denied', 'card_not_registered')
        return {
            'access_granted': False,
            'user_id': card.user_id,
            'reason': 'Card is not registered',
            'user_role': None,
            'user_name': None
        }
    
    # Check if card is blocked
    if card.status == 'blocked':
        log_access_attempt(card.user_id, card.id, 'denied', 'card_blocked')
        return {
            'access_granted': False,
            'user_id': card.user_id,
            'reason': 'Card is blocked',
            'user_role': None,
            'user_name': None
        }
    
    # Get the user
    user = User.query.get(card.user_id)
    
    if not user:
        log_access_attempt(card.user_id, card.id, 'denied', 'user_not_found')
        return {
            'access_granted': False,
            'user_id': card.user_id,
            'reason': 'User not found',
            'user_role': None,
            'user_name': None
        }
    
    # Check if user is active
    if not user.is_active:
        log_access_attempt(user.id, card.id, 'denied', 'user_inactive')
        return {
            'access_granted': False,
            'user_id': user.id,
            'reason': 'User account is inactive',
            'user_role': user.role,
            'user_name': user.full_name
        }
    
    # Admin can always access
    if user.role == 'admin':
        log_access_attempt(user.id, card.id, 'granted', 'admin_access')
        return {
            'access_granted': True,
            'user_id': user.id,
            'reason': 'Admin access granted',
            'user_role': user.role,
            'user_name': user.full_name
        }
    
    # For instructors, check if they are teaching
    if user.role == 'instructor':
        schedule = Schedule.query.filter_by(user_id=user.id, is_active=True).first()
        
        if not schedule:
            log_access_attempt(user.id, card.id, 'denied', 'no_schedule')
            return {
                'access_granted': False,
                'user_id': user.id,
                'reason': 'No teaching schedule found',
                'user_role': user.role,
                'user_name': user.full_name
            }
        
        if not schedule.is_teaching_now():
            log_access_attempt(user.id, card.id, 'denied', 'not_teaching_time')
            return {
                'access_granted': False,
                'user_id': user.id,
                'reason': f'Not teaching time. Teaching: {schedule.start_time}-{schedule.end_time}',
                'user_role': user.role,
                'user_name': user.full_name
            }
        
        log_access_attempt(user.id, card.id, 'granted', 'teaching_time')
        return {
            'access_granted': True,
            'user_id': user.id,
            'reason': 'Teaching time - access granted',
            'user_role': user.role,
            'user_name': user.full_name
        }
    
    # Default deny for unknown roles or students
    log_access_attempt(user.id, card.id, 'denied', 'insufficient_permissions')
    return {
        'access_granted': False,
        'user_id': user.id,
        'reason': 'Insufficient permissions',
        'user_role': user.role,
        'user_name': user.full_name
    }

def log_access_attempt(user_id, card_id, result, reason, door_location='Main Door'):
    """Log access attempt to database"""
    try:
        log = AccessLog(
            user_id=user_id,
            card_id=card_id,
            access_result=result,
            reason=reason,
            door_location=door_location
        )
        db.session.add(log)
        db.session.commit()
    except Exception as e:
        print(f"Error logging access attempt: {e}")

def register_card(card_id, user_id, card_name=None):
    """Register a new RFID card for a user"""
    # Check if card already exists
    card = Card.query.filter_by(card_id=card_id).first()
    
    if card:
        if card.is_registered:
            return {'success': False, 'message': 'Card already registered'}
        card.user_id = user_id
    else:
        card = Card(card_id=card_id, user_id=user_id)
    
    card.card_name = card_name or f"Card-{user_id}"
    card.register()
    
    try:
        db.session.add(card)
        db.session.commit()
        return {'success': True, 'message': 'Card registered successfully', 'card_id': card.id}
    except Exception as e:
        db.session.rollback()
        return {'success': False, 'message': f'Error registering card: {str(e)}'}

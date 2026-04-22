"""RFID Card management routes"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import Card, User
from database import db
from utils.rfid_utils import register_card

cards_bp = Blueprint('cards', __name__, url_prefix='/api/cards')

@cards_bp.route('/register', methods=['POST'])
@jwt_required()
def register_new_card():
    """Register a new RFID card for a user (admin only)"""
    try:
        user_id = int(get_jwt_identity())
        claims = get_jwt()
        data = request.get_json()
        
        if not data or 'card_id' not in data:
            return jsonify({'error': 'Missing card_id'}), 400

        if claims.get('role') != 'admin':
            return jsonify({'error': 'Admin access required. Card registration is managed in admin dashboard only.'}), 403

        target_user_id = int(data.get('user_id', user_id))

        target_user = User.query.get(target_user_id)
        if not target_user:
            return jsonify({'error': 'Target user not found'}), 404
        
        card_id = data['card_id'].strip()
        card_name = data.get('card_name', f'Card for User {target_user_id}')
        
        result = register_card(card_id, target_user_id, card_name)
        
        if result['success']:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@cards_bp.route('/user/<int:target_user_id>/primary', methods=['PUT'])
@jwt_required()
def upsert_primary_card(target_user_id):
    """Create or update a user's primary card (admin only)"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403

        data = request.get_json() or {}
        card_id = (data.get('card_id') or '').strip()
        card_name = (data.get('card_name') or '').strip()

        if not card_id:
            return jsonify({'error': 'Missing card_id'}), 400

        target_user = User.query.get(target_user_id)
        if not target_user:
            return jsonify({'error': 'Target user not found'}), 404

        existing_same_id = Card.query.filter_by(card_id=card_id).first()
        if existing_same_id and existing_same_id.user_id != target_user_id:
            return jsonify({'error': 'RFID card is already assigned to another user'}), 409

        target_card = Card.query.filter_by(user_id=target_user_id).order_by(Card.id.asc()).first()

        if target_card:
            if existing_same_id and existing_same_id.id != target_card.id:
                db.session.delete(target_card)
                target_card = existing_same_id
            target_card.card_id = card_id
            target_card.card_name = card_name or f'Card for {target_user.full_name}'
            target_card.user_id = target_user_id
            target_card.register()
        elif existing_same_id:
            existing_same_id.user_id = target_user_id
            existing_same_id.card_name = card_name or f'Card for {target_user.full_name}'
            existing_same_id.register()
            target_card = existing_same_id
        else:
            target_card = Card(
                card_id=card_id,
                user_id=target_user_id,
                card_name=card_name or f'Card for {target_user.full_name}'
            )
            target_card.register()
            db.session.add(target_card)

        db.session.commit()

        return jsonify({
            'message': 'RFID card updated successfully',
            'card': target_card.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@cards_bp.route('/my-cards', methods=['GET'])
@jwt_required()
def get_my_cards():
    """Get all cards for the current user"""
    try:
        user_id = int(get_jwt_identity())
        cards = Card.query.filter_by(user_id=user_id).all()
        
        return jsonify({
            'cards': [card.to_dict() for card in cards],
            'total': len(cards)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@cards_bp.route('/<int:card_id>', methods=['GET'])
@jwt_required()
def get_card(card_id):
    """Get card details"""
    try:
        user_id = int(get_jwt_identity())
        claims = get_jwt()
        
        card = Card.query.get(card_id)
        
        if not card:
            return jsonify({'error': 'Card not found'}), 404
        
        # Users can only see their own cards, except admins
        if card.user_id != user_id and claims.get('role') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 403
        
        return jsonify({'card': card.to_dict()}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@cards_bp.route('/<int:card_id>/deregister', methods=['POST'])
@jwt_required()
def deregister_card(card_id):
    """Deregister a card"""
    try:
        user_id = int(get_jwt_identity())
        claims = get_jwt()
        
        card = Card.query.get(card_id)
        
        if not card:
            return jsonify({'error': 'Card not found'}), 404
        
        # Users can only deregister their own cards, except admins
        if card.user_id != user_id and claims.get('role') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 403
        
        card.deregister()
        db.session.commit()
        
        return jsonify({
            'message': 'Card deregistered successfully',
            'card': card.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@cards_bp.route('/<int:card_id>/block', methods=['POST'])
@jwt_required()
def block_card(card_id):
    """Block a card (admin only)"""
    try:
        user_id = get_jwt_identity()
        claims = get_jwt()
        
        if claims.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        card = Card.query.get(card_id)
        
        if not card:
            return jsonify({'error': 'Card not found'}), 404
        
        card.block()
        db.session.commit()
        
        return jsonify({
            'message': 'Card blocked successfully',
            'card': card.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@cards_bp.route('/', methods=['GET'])
@jwt_required()
def get_all_cards():
    """Get all cards in system (admin only)"""
    try:
        user_id = get_jwt_identity()
        claims = get_jwt()
        
        if claims.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        limit = request.args.get('limit', 100, type=int)
        user_filter = request.args.get('user_id', type=int)
        
        query = Card.query
        
        if user_filter:
            query = query.filter_by(user_id=user_filter)
        
        cards = query.limit(limit).all()
        
        return jsonify({
            'cards': [card.to_dict() for card in cards],
            'total': len(cards)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

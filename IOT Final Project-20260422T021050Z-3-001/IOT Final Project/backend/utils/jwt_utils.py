from flask_jwt_extended import create_access_token, get_jwt_identity
from datetime import datetime, timedelta

def create_user_token(user_id, user_role):
    """Create JWT token for user"""
    additional_claims = {
        'role': user_role,
        'user_id': user_id
    }
    return create_access_token(
        identity=str(user_id),  # IMPORTANT: Must be string for JWT
        additional_claims=additional_claims
    )

def get_current_user_id():
    """Get current user ID from JWT token"""
    identity = get_jwt_identity()
    return int(identity) if identity else None

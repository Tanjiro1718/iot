from database import db
from datetime import datetime

class AccessLog(db.Model):
    """Access log for tracking door access attempts"""
    __tablename__ = 'access_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    card_id = db.Column(db.Integer, db.ForeignKey('cards.id'), nullable=True)
    
    # Access result: 'granted', 'denied', 'error'
    access_result = db.Column(db.String(20), nullable=False)
    
    # Reason for denial: 'card_not_registered', 'not_teaching_time', 
    # 'card_blocked', 'user_inactive', 'unknown_card', etc.
    reason = db.Column(db.String(100), nullable=True)
    
    # Door location/identifier
    door_location = db.Column(db.String(120), nullable=True)
    
    attempted_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert log to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'card_id': self.card_id,
            'access_result': self.access_result,
            'reason': self.reason,
            'door_location': self.door_location,
            'attempted_at': self.attempted_at.isoformat()
        }
    
    def __repr__(self):
        return f'<AccessLog {self.access_result} - {self.attempted_at}>'

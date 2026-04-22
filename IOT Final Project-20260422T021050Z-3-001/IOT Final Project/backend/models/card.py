from database import db
from datetime import datetime

class Card(db.Model):
    """RFID Card model"""
    __tablename__ = 'cards'
    
    id = db.Column(db.Integer, primary_key=True)
    card_id = db.Column(db.String(100), unique=True, nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    card_name = db.Column(db.String(120), nullable=True)  # e.g., "Main Card", "Backup Card"
    
    # Status: 'active', 'inactive', 'blocked'
    status = db.Column(db.String(20), default='active')
    
    is_registered = db.Column(db.Boolean, default=False)
    registered_at = db.Column(db.DateTime, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    access_logs = db.relationship('AccessLog', backref='card', lazy=True, cascade='all, delete-orphan')
    
    def register(self):
        """Register the card in the system"""
        self.is_registered = True
        self.registered_at = datetime.utcnow()
        self.status = 'active'
    
    def deregister(self):
        """Deregister the card from the system"""
        self.is_registered = False
        self.status = 'inactive'
    
    def block(self):
        """Block the card (lost/stolen)"""
        self.status = 'blocked'
    
    def to_dict(self):
        """Convert card to dictionary"""
        return {
            'id': self.id,
            'card_id': self.card_id,
            'user_id': self.user_id,
            'card_name': self.card_name,
            'status': self.status,
            'is_registered': self.is_registered,
            'registered_at': self.registered_at.isoformat() if self.registered_at else None,
            'created_at': self.created_at.isoformat()
        }
    
    def __repr__(self):
        return f'<Card {self.card_id}>'

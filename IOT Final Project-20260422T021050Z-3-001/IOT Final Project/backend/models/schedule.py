from database import db
from datetime import datetime

class Schedule(db.Model):
    """Teaching Schedule model for instructors"""
    __tablename__ = 'schedules'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Day of week: 0=Monday, 1=Tuesday, ..., 6=Sunday
    day_of_week = db.Column(db.Integer, nullable=False)
    
    # Time format: HH:MM (24-hour format)
    start_time = db.Column(db.String(5), nullable=False)  # e.g., "08:00"
    end_time = db.Column(db.String(5), nullable=False)    # e.g., "10:00"
    
    # Room/Location
    location = db.Column(db.String(120), nullable=True)
    
    is_active = db.Column(db.Boolean, default=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def is_teaching_now(self):
        """Check if the instructor is teaching right now"""
        from datetime import datetime as dt
        
        current_time = dt.now()
        current_day = current_time.weekday()
        current_time_str = current_time.strftime("%H:%M")
        
        if current_day != self.day_of_week:
            return False
        
        return self.start_time <= current_time_str <= self.end_time
    
    def to_dict(self):
        """Convert schedule to dictionary"""
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        
        return {
            'id': self.id,
            'user_id': self.user_id,
            'day_of_week': self.day_of_week,
            'day_name': days[self.day_of_week],
            'start_time': self.start_time,
            'end_time': self.end_time,
            'location': self.location,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat()
        }
    
    def __repr__(self):
        return f'<Schedule {self.user_id} - {self.day_of_week} {self.start_time}-{self.end_time}>'

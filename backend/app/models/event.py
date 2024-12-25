from app.extensions import db

class Event(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), nullable=False)  
    coordinator = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    startDate = db.Column(db.Date)
    endDate = db.Column(db.Date)
    earliestTime = db.Column(db.Time)
    latestTime = db.Column(db.Time)
    length = db.Column(db.Integer)
    numParticipants = db.Column(db.Integer, nullable=True)
    autocreate = db.Column(db.Boolean, default=False)
    finalized = db.Column(db.Boolean, default=False)

    users = db.relationship('User', secondary=event_user, back_populates='events') #using back_populates instead of backref
    
    freeTimes = db.relationship('FreeBlock', backref='event', lazy=True)
    
    def __init__(self, name, coordinator, start, end, earliest, latest, length, users=None, numParticipants=None):
        self.name = name
        self.coordinator = coordinator
        self.startDate = start
        self.endDate = end
        self.earliestTime = earliest
        self.latestTime = latest
        self.length = length
        self.numParticipants = numParticipants
        if users:
            self.users.extend(users)
    
    def __repr__(self):
        return f'<EVENT {self.name}\n{self.coordinator}>'
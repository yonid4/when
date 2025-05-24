from app.extensions import db

event_user=db.Table('event_user',
                    db.Column('event_id', db.Integer, db.ForeignKey('event.id'), nullable=False),
                    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), nullable=False),
                    )

class Event(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    uid = id = db.Column(db.String, nullable=False)  # needed for unique url id
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

    users = db.relationship('User', secondary=event_user, back_populates='events') # using back_populates instead of backref
    
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
        return f'''<EVENT {self.name}\n{self.coordinator}>'''


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(320), nullable=False, unique=True)
    name = db.Column(db.String(128), nullable=False)
    
    events = db.relationship('Event', secondary=event_user, back_populates='users') #using back_populates instead of backref

    # preferences = Many to Many Relationship???
    calendars = db.relationship('Calendar', backref='owner', lazy=True)
    busyTimes = db.relationship('UserUnavailability', backref='busyUser', lazy=True)

    def __init__(self, email, name):
        self.email = email
        self.name = name

    def __repr__(self):
        return f'<USER {self.id}\n{self.name}\n{self.email}\n>'
    

class UserUnavailability(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    start= db.Column(db.DateTime, nullable=False)
    end= db.Column(db.DateTime, nullable=False)
    userId = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    # Unique constraint on 3 columns
    __table_args__ = (db.UniqueConstraint('start', 'end', 'userId', name='uniqueUserUnavailability'),)

    def __init__(self, start, end, userId):
        self.start = start
        self.end = end
        self.userId = userId


class FreeBlock(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    start = db.Column(db.DateTime, nullable=False)
    end = db.Column(db.DateTime, nullable=False)
    eventId = db.Column(db.Integer, db.ForeignKey('event.id'), nullable=False)
    
    def __init__(self, start, end):
        self.start = start
        self.end = end


class Calendar(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), nullable=False)
    userId = db.Column(db.Integer, db.ForeignKey('user.id'))
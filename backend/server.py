import datetime
import os
from flask import Flask, render_template, request, url_for, redirect
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from tools import generate_uri_from_file
from sqlalchemy.sql import func


import json
import traceback
from sqlalchemy import inspect
from sqlalchemy.exc import IntegrityError


basedir = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__)
CORS(app) 

database_URI = generate_uri_from_file('db_config.yml')
app.config['SQLALCHEMY_DATABASE_URI'] = database_URI
# app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:password@localhost/when'
# app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'when.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

event_user=db.Table('event_user',
                    db.Column('event_id', db.Integer, db.ForeignKey('event.id'), nullable=False),
                    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), nullable=False),
                    )

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

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(320), nullable=False, unique=True)
    name = db.Column(db.String(128), nullable=False)
    coordinator = db.Column(db.Boolean, default=False)
    
    events = db.relationship('Event', secondary=event_user, back_populates='users') #using back_populates instead of backref

    # preferences = Many to Many Relationship???
    calendars = db.relationship('Calendar', backref='owner', lazy=True)
    busyTimes = db.relationship('UserUnavailability', backref='busyUser', lazy=True)

    def __init__(self, email, name, coordinator=False):
        self.email = email
        self.name = name
        self.coordinator = coordinator

    def __repr__(self):
        return f'<USER {self.name}\n{self.email}\n{self.eventId}\n{self.coordinator}>'

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


# Checks if email exists in User table 
def user_exists(email):
    user = db.session.query(User).filter_by(email=email).first()
    return user is not None

# If user exists, get user information by email
def get_user_by_email(email):
    user = db.session.query(User).filter_by(email=email).first()
    return user

# Checks if start, end, and user_id exists in UserUnavailability table
def user_unavailability_exists(start, end, user_id):
    existing_entry = db.session.query(UserUnavailability).filter_by(
        start=start, 
        end=end, 
        userId=user_id
    ).first()
    return existing_entry is not None
    
def create_user(email, name, coordinator):
    # Checks if user exists in databse
    if (user_exists(email)): # If exists, get information from databse and put it in user
        user = get_user_by_email(email)
    else: # If it doesnt exist, add it to database
        user = User(email=email, name=name, coordinator=coordinator)
        db.session.add(user)
        db.session.commit()
    return user

@app.route('/test')
def test_db():
    db.drop_all()
    db.create_all()

    try:
        user1 = create_user("user1@gmail.com", "user1", True)
        user2 = create_user("user2@gmail.com", "user2", False)
        user3 = create_user("user3@gmail.com", "user3", False)
        user4 = create_user("user4@gmail.com", "user4", False)

        db.session.add(user1)
        db.session.add(user2)
        db.session.add(user3)
        db.session.add(user4)
        db.session.commit()

        # Creating an event (need to add a check if this event just got created by the same user)
        event = Event(name="trial",
                      coordinator=user1.id,
                      start=datetime.date(2024, 12, 10),
                      end=datetime.date(2024, 12, 15),
                      earliest=datetime.time(9, 0),
                      latest=datetime.time(17, 0),
                      length=1.5,
                      numParticipants=None,
                      users=[user1, user2, user4] # Add user to users during event creation. Or we can do it manualy later
                      )
        db.session.add(event)
        db.session.commit()

        # Add user to event manualy (automatically updates user.events as well)
        event.users.append(user3)
        db.session.commit()

        startDate = datetime.date(2024, 12, 11)
        endDate = datetime.date(2024, 12, 11)
        startTime = datetime.time(12, 0)
        endTime = datetime.time(14, 0)

        start = datetime.datetime.combine(startDate, startTime)
        end = datetime.datetime.combine(endDate, endTime)
        
        # Creating a new user_unavailability
        user_unavailability1 = UserUnavailability(
                start=start,
                end=end,
                userId=user1.id
            )
        
        # If user_unavailability1 isn't in the database then commit
        if (not user_unavailability_exists(start, end, user1.id)):
            db.session.add(user_unavailability1)
            db.session.commit()
        
        startDate = datetime.date(2024, 12, 13)
        endDate = datetime.date(2024, 12, 13)
        startTime = datetime.time(16, 0)
        endTime = datetime.time(18, 0)

        start = datetime.datetime.combine(startDate, startTime)
        end = datetime.datetime.combine(endDate, endTime)
        
        # Creating a new user_unavailability
        user_unavailability2 = UserUnavailability(
                start=start,
                end=end,
                userId=user2.id
            )

        # If user_unavailability2 isn't in the database then commit
        if (not user_unavailability_exists(start, end, user2.id)):
            db.session.add(user_unavailability2)
            db.session.commit()


        users_in_event = event.users
        for user in users_in_event:
            print(user.id)
            print(user.name)
            print(user.email)
            print(user.coordinator)
    
        return {
            "User id": user1.id,
            "User name":user1.name,
            "User email": user1.email,
            "Coordinator":user1.coordinator,
            "Event id":event.id,
            "Event name":event.name,
            "Event coordinator id": event.coordinator,
            "Event start date": json.dumps(event.startDate.strftime("%Y-%m-%d %H:%M:%S")),
            "Event end date": json.dumps(event.endDate.strftime("%Y-%m-%d %H:%M:%S")),
            "Event start time": json.dumps(event.earliestTime.strftime("%H:%M:%S")),
            "Event end time": json.dumps(event.latestTime.strftime("%H:%M:%S")),
            "Event length": event.length,
            "Event number of participants": event.numParticipants,
            "User unavailability1 start": json.dumps(user_unavailability1.start.strftime("%Y-%m-%d %H:%M:%S")),
            "User unavailability1 end": json.dumps(user_unavailability1.end.strftime("%Y-%m-%d %H:%M:%S")),
            "User unavailability1 userId": user_unavailability1.userId,
            "User unavailability2 start": json.dumps(user_unavailability2.start.strftime("%Y-%m-%d %H:%M:%S")),
            "User unavailability2 end": json.dumps(user_unavailability2.end.strftime("%Y-%m-%d %H:%M:%S")),
            "User unavailability2 userId": user_unavailability2.userId  
        }
    except Exception as e:
            db.session.rollback()
            print(f"Error: {e}")
            traceback.print_exc()
            return {"error": str(e)}, 500

# Test route for seeing a data
@app.route('/data')
def get_time():
    x = datetime.datetime.now()

    # Returning an api for showing in  reactjs
    return {
        'Name':"Merilyn", 
        "Age":"22",
        "Date":x, 
        "programming":"python"
    }

@app.route('/describe_user_unavailability')
def describe_user_unavailability():
    try:
        # Get the table structure using SQLAlchemy's inspector
        inspector = inspect(db.engine)
        columns = inspector.get_columns('user_unavailability')

        # Format and return column details
        column_details = []
        for column in columns:
            column_details.append({
                "name": column['name'],
                "type": str(column['type']),
                "nullable": column['nullable'],
                "default": column.get('default'),
                "primary_key": column.get('primary_key', False)
            })
        return {"columns": column_details}
    except Exception as e:
        return {"error": str(e)}, 500

if __name__ == '__main__':
    print("Done")
    app.run(debug=True, port=5000)
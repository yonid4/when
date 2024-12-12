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
    
    # users = db.relationship('User', backref='eventParticipating', lazy=True)
    users = db.relationship(
        'User', 
        backref='eventParticipating', 
        lazy=True, 
        primaryjoin="Event.id == User.eventId" #Specifieng primaryjoin
    )
    
    freeTimes = db.relationship('FreeBlock', backref='event', lazy=True)
    
    def __init__(self, name, coordinator, start, end, earliest, latest, length, numParticipants=None):
        self.name = name
        self.coordinator = coordinator
        self.startDate = start
        self.endDate = end
        self.earliestTime = earliest
        self.latestTime = latest
        self.length = length
        self.numParticipants = numParticipants
    
    def __repr__(self):
        return f'<EVENT {self.name}\n{self.coordinator}>'

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(320), nullable=False, unique=True)
    name = db.Column(db.String(128), nullable=False)
    eventId = db.Column(db.Integer, db.ForeignKey('event.id'))
    coordinator = db.Column(db.Boolean, default=False)

    event = db.relationship(
        'Event',
        backref='participants',
        lazy=True,
        primaryjoin="User.eventId == Event.id"
    )

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
    

@app.route('/')
def test_db():
    # db.drop_all()
    db.create_all()

    try:
        if (user_exists("random@gmail.com")):
            user = get_user_by_email("random@gmail.com")
        else:
            user = User("random@gmail.com", "Yoni", False)
            db.session.add(user)
            db.session.commit()
    
        new_event = Event(name="trial",
                      coordinator=user.id,
                      start=datetime.date(2024, 12, 10),
                      end=datetime.date(2024, 12, 15),
                      earliest=datetime.time(9, 0),
                      latest=datetime.time(17, 0),
                      length=1.5,
                      numParticipants=None
                      )
        db.session.add(new_event)
        db.session.commit()
        
        user.eventId=new_event.id
        db.session.commit()

        startDate = datetime.date(2024, 12, 11)
        endDate = datetime.date(2024, 12, 11)
        startTime = datetime.time(12, 0)
        endTime = datetime.time(14, 0)

        start = datetime.datetime.combine(startDate, startTime)
        end = datetime.datetime.combine(endDate, endTime)
        
        user_unavailability = UserUnavailability(
                start=start,
                end=end,
                userId=user.id
            )
        if (not user_unavailability_exists(start, end, user.id)):
            db.session.add(user_unavailability)
            db.session.commit()
    
        return {
            "User id": user.id,
            "User name":user.name,
            "User email": user.email,
            "Coordinator":user.coordinator,
            "Event id":new_event.id,
            "Event name":new_event.name,
            "Event coordinator id": new_event.coordinator,
            "Event start date": json.dumps(new_event.startDate.strftime("%Y-%m-%d %H:%M:%S")),
            "Event end date": json.dumps(new_event.endDate.strftime("%Y-%m-%d %H:%M:%S")),
            "Event start time": json.dumps(new_event.earliestTime.strftime("%Y-%m-%d %H:%M:%S")),
            "Event end time": json.dumps(new_event.latestTime.strftime("%Y-%m-%d %H:%M:%S")),
            "Event length": new_event.length,
            "Event number of participants": new_event.numParticipants,
            "User unavailability start": json.dumps(user_unavailability.start.strftime("%Y-%m-%d %H:%M:%S")),
            "User unavailability end": json.dumps(user_unavailability.end.strftime("%Y-%m-%d %H:%M:%S")),
            "User unavailability userId": user_unavailability.userId   
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
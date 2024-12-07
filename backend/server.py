import os
from flask import Flask, render_template, request, url_for, redirect
from flask_sqlalchemy import SQLAlchemy
from tools import generate_uri_from_file

from sqlalchemy.sql import func

basedir = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__)
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
    length = db.Column(db.Float)
    numParticipants = db.Column(db.Integer, nullable=True)
    autocreate = db.Column(db.Boolean, default=False)
    finalized = db.Column(db.Boolean, default=False)
    users = db.relationship('User', backref='eventParticipating', lazy=True)
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
    email = db.Column(db.String(320), nullable=False)
    name = db.Column(db.String(128), nullable=False)
    eventId = db.Column(db.Integer, db.ForeignKey('event.id'))
    coordinator = db.Column(db.Boolean, default=False)
    # preferences = Many to Many Relationship???
    calendars = db.relationship('Calendar', backref='owner', lazy=True)
    busyTimes = db.relationship('UserUnavailability', backref='busyUser', lazy=True)

    def __init__(self, email, name, coordinator=False):
        self.email = email
        self.name = name
        self.coordinator = coordinator

    def __repr__(self):
        return f'<USER {self.name}\n{self.email}>'

class UserUnavailability(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    start =  db.Column(db.Time)
    end = db.Column(db.Time)
    userId = db.Column(db.Integer, db.ForeignKey('user.id'))

class FreeBlock(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    start =  db.Column(db.Time)
    end = db.Column(db.Time)
    eventId = db.Column(db.Integer, db.ForeignKey('event.id'))

class Calendar(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), nullable=False)
    userId = db.Column(db.Integer, db.ForeignKey('user.id'))

if __name__ == '__main__':
    print("Done")
    app.run(debug=True, port=8080)
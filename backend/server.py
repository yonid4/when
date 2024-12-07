import os
from flask import Flask, render_template, request, url_for, redirect
from flask_sqlalchemy import SQLAlchemy

from sqlalchemy.sql import func

basedir = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://username:password@localhost/when.db'
# app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'when.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Columnn(db.String(320), nullable=False)
    name = db.Column(db.String(128), nullable=False)
    coordinator = db.Column(db.Boolean, server_default=False)


class Event(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), nullable=False)  
    coordinator = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    startDate = db.Column(db.DateTime(timezone=True))
    endDate = db.Column(db.DateTime(timezone=True))
    earliestTime = db.Column(db.Time)
    latestTime = db.Column(db.Time)
    length = db.Column(db.Time)
    numParticipants = db.Column(db.Integer)
    autocreate = db.Column(db.Boolean, server_default=False)
    finalized = db.Column(db.Boolean, server_default =False)
    users = db.relationship('User', backref='eventCoordinating', lazy=True)
    busyTimes = db.Coulmns(db.EventTime)
    
    

    
    def __repr__(self):
        return f'<Calendar {self.calendarId}>'
    
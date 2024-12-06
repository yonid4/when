import os
from flask import Flask, render_template, request, url_for, redirect
from flask_sqlalchemy import SQLAlchemy

from sqlalchemy.sql import func

basedir = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] =\
        'sqlite:///' + os.path.join(basedir, 'when.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)


class Calendar(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    calendarId = db.Colunm(db.String(1024), nullable=False)
    
    def __repr__(self):
        return f'<Calendar {self.calendarId}>'
    
class Events(db.Model):
    pass
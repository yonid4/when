import datetime
import os
import os.path
from flask import Flask, jsonify, render_template, request, session, url_for, redirect
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from tools import generate_uri_from_file
from sqlalchemy.sql import func
from zoneinfo import ZoneInfo

import json
import traceback
from sqlalchemy import inspect
from sqlalchemy.exc import IntegrityError

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

basedir = os.path.abspath(os.path.dirname(__file__))

# If modifying these scopes, delete the file token.json.
SCOPES = ["https://www.googleapis.com/auth/calendar", 
          "https://www.googleapis.com/auth/userinfo.email", 
          "https://www.googleapis.com/auth/userinfo.profile",
          "openid"]

# Current Pacific Time time
now = datetime.datetime.now(ZoneInfo("US/Pacific")).isoformat()

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
    calendarId = db.Column(db.String(1024), nullable=False)
    name = db.Column(db.String(128), nullable=False)
    userId = db.Column(db.Integer, db.ForeignKey('user.id'))

    def __init__(self, calendarId, name, userId):
        self.calendarId = calendarId
        self.name = name
        self.userId = userId


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

def calendar_exists(calendar_id):
    calendar = db.session.query(Calendar).filter_by(calendarId=calendar_id)
    return calendar is not None


def print_calendars_for_user(user_id):
    # Query for all calendars that belong to the given userId
    calendars = Calendar.query.filter_by(userId=user_id).all()
    
    if calendars:
        print(f"Calendars for user with userId={user_id}:")
        for calendar in calendars:
            print(f"Calendar ID: {calendar.calendarId}, Name: {calendar.name}")
    else:
        print(f"No calendars found for userId={user_id}")



# # def main():
# #     """Shows basic usage of the Google Calendar API.
# #     Prints the start and name of the next 10 events on the user's calendar.
# #     """
# #     creds = None
# #     # The file token.json stores the user's access and refresh tokens, and is
# #     # created automatically when the authorization flow completes for the first
# #     # time.
# #     if os.path.exists("token.json"):
# #         creds = Credentials.from_authorized_user_file("token.json", SCOPES)
# #     # If there are no (valid) credentials available, let the user log in.
# #     if not creds or not creds.valid:
# #         if creds and creds.expired and creds.refresh_token:
# #             creds.refresh(Request())
# #         else:
# #             flow = InstalledAppFlow.from_client_secrets_file(
# #                 "credentials.json", SCOPES
# #             )
# #             creds = flow.run_local_server(port=0)
# #     # Save the credentials for the next run
# #     with open("token.json", "w") as token:
# #         token.write(creds.to_json())

# #     try:
# #          # Call People API to get user info
# #         people_service = build('people', 'v1', credentials=creds)
        
# #         # Get the user's name and email
# #         user_info = people_service.people().get(resourceName='people/me', personFields='names,emailAddresses').execute()
        
# #         # Extract name and email
# #         name = user_info.get('names', [{}])[0].get('displayName')
# #         email_address = user_info.get('emailAddresses', [{}])[0].get('value')

# #         service = build("calendar", "v3", credentials=creds)
# #         # Get the list of all calendars
# #         calendar_list = service.calendarList().list().execute()

# #         page_token = None

# #         # Print the summary and ID of each calendar
# #         for calendar in calendar_list.get('items', []):
# #             # print(f"Calendar Summary: {calendar['summary']}, ID: {calendar['id']}")
# #             # Call the Calendar API
# #             events = service.events().list(
# #                 calendarId=calendar['id'], 
# #                 timeMin="2024-12-01T00:00:00Z",
# #                 timeMax=now,
# #                 singleEvents=True,
# #                 orderBy="startTime",
# #                 pageToken=page_token,
# #             ).execute()

# #             # if there are no events in those dates, then stop running
# #             if not events:
# #                 print("No upcoming events found.")
# #                 return
            
# #             # Check permissions
# #             if calendar.get('accessRole') not in ['owner', 'reader']:
# #                 print(f"Skipping calendar {calendar['summary']} due to insufficient permissions.")
# #                 continue
            
# #             user = db.session.query(User).filter_by(email=email_address).first()
# #             if not user_exists(email_address):
# #                 create_user(email=email_address, name=name, coordinator=False)
# #             new_calendar = Calendar(calendarId=calendar['id'], name=name, userId=user.id)

# #             if not calendar_exists(new_calendar.id):
# #                 db.session.add(new_calendar)
# #                 db.session.commit()

# #             # print all of the events that were found for this calendar
# #             for event in events.get('items', []):
# #                 start = event.get("start", {}).get("dateTime", event.get("start", {}).get("date"))
# #                 print(f"     {start} - {event.get('summary', '(No Title)')}")
        

# #             calendars2 = Calendar.query.filter_by(userId=user.id).all()
# #             if calendars2:
# #                 print(f"Calendars for user with userId={user.id}:")
# #                 for calendar3 in calendars2:
# #                     result = [{'calendar_id': calendar3.calendarId, 'name': calendar3.name} for calendar3 in calendars2]
# #                     return result
# #                     # return f"Calendar ID: {calendar3.calendarId}, Name: {calendar3.name}"
# #             else:
# #                 return f"No calendars found for userId"
            
            

# #     except HttpError as error:
# #         print(f"An error occurred: {error}")


# # @app.route('/test')
# # def test():
# #     db.create_all()
# #     result = main()
# #     return jsonify(result)

# if __name__ == "__main__":
#   app.run(debug=True)

app.config['SECRET_KEY'] = os.urandom(24)
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

@app.route('/authorize')
def authorize():
    """Start the OAuth2 flow and redirect to Google's login page."""
    flow = Flow.from_client_secrets_file(
        'credentials.json',
        scopes=SCOPES,
        redirect_uri=url_for('oauth2callback', _external=True)
    )
    authorization_url, state = flow.authorization_url()
    session['state'] = state
    return redirect(authorization_url)

@app.route('/oauth2callback')
def oauth2callback():
    """Handles the response from Google's OAuth2 server."""
    flow = Flow.from_client_secrets_file(
        'credentials.json',
        scopes=SCOPES,
        redirect_uri=url_for('oauth2callback', _external=True)
    )
    flow.fetch_token(authorization_response=request.url)
    credentials = flow.credentials
    
    # Save credentials to token.json
    with open('token.json', 'w') as token:
        token.write(credentials.to_json())
    return redirect(url_for('test'))

@app.route('/test')
def test():
    db.create_all()
    """Reads token.json and gets user's calendars."""
    creds = None
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    if not creds or not creds.valid:
        return redirect(url_for('authorize'))

    try:
        service = build("calendar", "v3", credentials=creds)
        calendar_list = service.calendarList().list().execute()

        result = []
        for calendar in calendar_list.get('items', []):
            result.append({
                'calendar_name': calendar.get('summary'),
                'calendar_id': calendar.get('id')
            })
        
        return jsonify(result)

    except HttpError as error:
        return jsonify({'error': f'An error occurred: {error}'})
    
if __name__ == "__main__":
    # db.create_all()
    app.run(debug=True)
import datetime
import json
import traceback

from app.main import bp
from app.extensions import db
from app.models import *
from app.users import utils as users

@bp.route('/')
def index():
    print("When App Running")
    return 'When'

@bp.route('/test_db')
def test_db():
    db.drop_all()
    db.create_all()

    try:
        user1 = users.create_user("user1@gmail.com", "user1")
        user2 = users.create_user("user2@gmail.com", "user2")
        user3 = users.create_user("user3@gmail.com", "user3")
        user4 = users.create_user("user4@gmail.com", "user4")

        # Creating an event (need to add a check if this event just got created by the same user)
        event = Event(name="trial",
                      coordinator=user1.id,
                      start=datetime.date(2024, 12, 1),
                      end=datetime.date(2024, 12, 6),
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
        startTime = datetime.time(12, 0)
        endDate = datetime.date(2024, 12, 11)
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
        if (not users.user_unavailability_exists(start, end, user1.id)):
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
        if (not users.user_unavailability_exists(start, end, user2.id)):
            db.session.add(user_unavailability2)
            db.session.commit()

        users_in_event = event.users
        for user in users_in_event:
            print(user.id)
            print(user.name)
            print(user.email)
    
        return {
            "User id": user1.id,
            "User name":user1.name,
            "User email": user1.email,
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
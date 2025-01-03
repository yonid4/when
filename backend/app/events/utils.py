import random
import string
from app.extensions import db
from app.models import Event
from app.models import User

def get_event_by_uid(uid):
    event = db.session.query(Event).filter_by(uid=uid).first()
    return event

def create_event(name, coordinator, start, end, earliest, latest, length, numParticipants=None, users=None):
    event = Event(name, coordinator, start, end, earliest, latest, length, numParticipants, users[coordinator])
    event.uid = generate_uid()  # some unique id generator
    db.session.add(event)
    db.session.commit()

def add_user_to_event(self: Event, user: User):
    if user not in self.users:
        self.users.append(user)
        db.session.commit()
        return True
    return False

def generate_uid():
    events = Event.query.all()
    uid_list = []
    for event in events:
        uid_list.append(event.uid)

    uid = ""
    while uid in uid_list and uid != "":
        for _ in range(7):
            var = random.randint(0, 2)
            if var == 0:
                uid += random.randint(0, 9)
            else:    
                uid += random.choice(string.ascii_letters)

    return uid



import random
import string
from app.extensions import db
from app.models import Event
from app.models import User

def get_event_by_uid(urlId):
    event = db.session.query(Event).filter_by(urlId=urlId).first()
    return event

def create_event(name, coordinator, start, end, earliest, latest, length, numParticipants=None, users=None):
    event = Event(name, coordinator, start, end, earliest, latest, length, numParticipants, users[coordinator])
    event.urlId = generate_uid()  # some unique id generator
    db.session.add(event)
    db.session.commit()

def add_user_to_event(self: Event, user: User):
    if user not in self.users:
        self.users.append(user)
        db.session.commit()
        return True
    return False

def generate_urlId():
    events = Event.query.all()
    urlId_list = []
    for event in events:
        urlId_list.append(event.uid)

    urlId = ""
    while urlId in urlId_list and urlId != "":
        for _ in range(7):
            var = random.randint(0, 2)
            if var == 0:
                urlId += random.randint(0, 9)
            else:    
                urlId += random.choice(string.ascii_letters)

    return urlId



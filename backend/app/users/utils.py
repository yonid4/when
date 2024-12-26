from app.extensions import db
from app.models import User, UserUnavailability

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
    
def create_user(email, name):
    # Checks if user exists in databse
    if (user_exists(email)): # If exists, get information from databse and put it in user
        user = get_user_by_email(email)
    else: # If it doesnt exist, add it to database
        user = User(email=email, name=name)
        db.session.add(user)
        db.session.commit()
    return user
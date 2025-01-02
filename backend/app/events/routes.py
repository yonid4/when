from flask import jsonify
from app.events import bp
from app.extensions import db
from app.models import Event

@bp.route('/')
def get_all_events():
    try:
        events = Event.query.all()
        return jsonify([event.__repr__() for event in events]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
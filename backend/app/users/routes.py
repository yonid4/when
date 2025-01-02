from flask import jsonify
from app.users import bp
from app.extensions import db
from app.models import User

@bp.route('/')
def get_all_users():
    try:
        users = User.query.all()
        return jsonify([user.__repr__() for user in users]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
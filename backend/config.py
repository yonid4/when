from tools import generate_uri_from_file

class Config:
    SQLALCHEMY_DATABASE_URI = generate_uri_from_file('db_config.yml')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
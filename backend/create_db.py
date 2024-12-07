# Script used to initialze/create your database for the first time.

import mysql.connector
from server import db as whendb, app

mydb = mysql.connector.connect(
    host="localhost",
    user="root",
    passwd="password",
)

cursor = mydb.cursor()  # like a robot that does the commands for you

# When you run this script for the first time, uncomment it
# If you need to run it again, make it a comment
# cursor.execute("CREATE DATABASE `when`")

cursor.execute("SHOW DATABASES")
for db in cursor:
    print(db)

with app.app_context():
    whendb.create_all()

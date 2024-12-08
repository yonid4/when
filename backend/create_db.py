# Script used to initialze/create your database for the first time.

import mysql.connector
from server import db as whendb, app

mydb = mysql.connector.connect(
    host="localhost",
    user="root",
    passwd="password",
)

cursor = mydb.cursor()  # like a robot that does the commands for you

cursor.execute("CREATE DATABASE IF NOT EXISTS `when`")

cursor.execute("SHOW DATABASES")
for db in cursor:
    print(db)



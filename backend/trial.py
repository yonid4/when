# Import flask and datetime module for showing date and time
from flask import Flask
from flask_cors import CORS
import datetime
from zoneinfo import ZoneInfo
import sqlite3

# import datetime
import os.path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# If modifying these scopes, delete the file token.json.
SCOPES = ["https://www.googleapis.com/auth/calendar"]

# Connect to the database (or create it if it doesn't exist)
# conn = sqlite3.connect(os.path.join(os.path.dirname(__file__), 'when.db'))
conn = sqlite3.connect('when.db')

# Create a cursor object
cursor = conn.cursor()

# Current Pacific Time time
now = datetime.datetime.now(ZoneInfo("US/Pacific")).isoformat()

# Initializing flask app
app = Flask(__name__)
CORS(app)


def main():
    """Shows basic usage of the Google Calendar API.
    Prints the start and name of the next 10 events on the user's calendar.
    """
    creds = None
    # The file token.json stores the user's access and refresh tokens, and is
    # created automatically when the authorization flow completes for the first
    # time.
    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json", SCOPES)
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                "credentials.json", SCOPES
            )
            creds = flow.run_local_server(port=0)
    # Save the credentials for the next run
    with open("token.json", "w") as token:
        token.write(creds.to_json())

    try:
        service = build("calendar", "v3", credentials=creds)

        # # Call the Calendar API
        # events = service.events().list(
        #     calendarId=calendar['id'], 
        #     timeMin="2024-12-01T00:00:00Z",
        #     timeMax=now.isformat(),
        #     singleEvents=True,
        #     orderBy="startTime",
        #     pageToken=page_token,
        # ).execute()
        
        # # if there are no events in those dates, then stop running
        # if not events:
        #     print("No upcoming events found.")
        #     return
        
        page_token = None
        try:
            # Get the list of all calendars
            calendar_list = service.calendarList().list().execute()
            
            # Print the summary and ID of each calendar
            for calendar in calendar_list.get('items', []):
                # print(f"Calendar Summary: {calendar['summary']}, ID: {calendar['id']}")
                # Call the Calendar API
                events = service.events().list(
                    calendarId=calendar['id'], 
                    timeMin="2024-12-01T00:00:00Z",
                    timeMax=now,
                    singleEvents=True,
                    orderBy="startTime",
                    pageToken=page_token,
                ).execute()

                # if there are no events in those dates, then stop running
                if not events:
                    print("No upcoming events found.")
                    return
                
                # Check permissions
                if calendar.get('accessRole') not in ['owner', 'reader']:
                    print(f"Skipping calendar {calendar['summary']} due to insufficient permissions.")
                    continue
                
                # try to insert events into data base (calenderId is UNIQUE so if exists nothing happens)
                try:
                    cursor.execute('INSERT INTO calendars (calendarId) VALUES (?)', (calendar['id'],))
                    conn.commit()
                except sqlite3.IntegrityError:
                    print(f"Duplicate calendarId skipped: {calendar['id']}")

                # print all of the events that were found for this calendar
                for event in events.get('items', []):
                    start = event.get("start", {}).get("dateTime", event.get("start", {}).get("date"))
                    print(f"     {start} - {event.get('summary', '(No Title)')}")

        except HttpError as error:
            print(f"An error occurred: {error}")
       
        
        # Verify the table content
        cursor.execute('SELECT id, calendarId FROM calendars')
        rows = cursor.fetchall()

        # Print each row
        print("cycle")
        for row in rows:
            print(f"id: {row[0]}, calendarId: {row[1]}")
            

    except HttpError as error:
        print(f"An error occurred: {error}")


if __name__ == "__main__":
  main()



# # Route for seeing a data
# @app.route('/data')
# def get_time():

#     page_token = None
#     while True:
#         calendar_list = service.calendarList().list(pageToken=page_token).execute()
#         for calendar_list_entry in calendar_list['items']:
#             print calendar_list_entry['summary']
#         page_token = calendar_list.get('nextPageToken')
#         if not page_token:
#             break
#     # Returning an api for showing in  reactjs
#     return {
#         'Name':"Merilyn", 
#         "Age":"22",
#         "Date":x, 
#         "programming":"python"
#     }


# # Running app
# if __name__ == '__main__':
#     app.run(debug=True, port=8080)
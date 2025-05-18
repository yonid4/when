# Project Name

This project consists of a backend and a frontend. Follow the instructions below to set up and run each part.

## Backend

### Prerequisites
- Python 3.9 or higher
- pip (Python package manager)
- MySQL server installed and running
- pkg-config and MySQL development libraries (for macOS, install via Homebrew):
  ```sh
  brew install pkg-config mysql
  ```

### Setup
1. Navigate to the backend directory:
   ```sh
   cd backend
   ```
2. Install the required dependencies:
   ```sh
   pip install -r requirements.txt
   ```
3. Configure your MySQL database settings in the backend configuration file (if necessary).

### Running the Backend
To start the backend server, run:
```sh
python app.py
```
The server will start on `http://localhost:5000`.

## Frontend

### Prerequisites
- Node.js and npm installed

### Setup
1. Navigate to the frontend directory:
   ```sh
   cd frontend
   ```
2. Install the required dependencies:
   ```sh
   npm install
   ```

### Running the Frontend
To start the frontend development server, run:
```sh
npm start
```
The frontend will be available at `http://localhost:3000`.

## Additional Information
- Ensure that the backend server is running before starting the frontend.
- For any issues, check the console logs for both the backend and frontend.

# WHEN

## Frontend:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

## Backend:
### Initialize Database
```bash
python create_db.py
```
### Run Server
```bash
flask run
```
### Backend Libraries Installation
```bash
pip install -r requirements.txt
```

## Activate Virtual Environment
```bash
.venv/Scripts/activate
# or
. .venv/bin/activate
```


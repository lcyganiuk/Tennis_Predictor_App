# Tennis Tournament Predictor

Full-stack web app for creating tennis tournament brackets, submitting winner predictions, and tracking leaderboard results.

## Overview

- Users can register, log in, and submit tournament predictions
- Admins can create tournaments, manage players, and generate brackets
- Results are stored locally with SQLite for easy setup

## Stack

- Frontend: React, Vite, Tailwind CSS
- Backend: FastAPI, SQLAlchemy
- Database: SQLite
- Auth: JWT token authentication

## Features

- User registration and login
- Admin panel for creating tournaments
- Bracket generation and match management
- Prediction submission for logged-in users
- Leaderboards for tournaments and global rankings
- Local SQLite database for quick setup

## Local Setup

### 1. Clone the repo

```powershell
git clone https://github.com/lcyganiuk/Tennis_Predictor_App
cd tennis_predictor
```

### 2. Frontend setup

```powershell
npm install
npm run dev
```

Frontend runs on:

`http://localhost:5173`

### 3. Backend setup

Open a second terminal:

```powershell
cd backend
py -3.12 -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs on:

`http://localhost:8000`

Optional environment variables:

- Copy `backend/.env.example` values into your shell or your local environment
- `JWT_SECRET_KEY` lets you override the default development secret
- `DATABASE_URL` lets you point the backend at another database

## Admin Account

To create the first admin user:

```powershell
cd backend
.\venv\Scripts\Activate.ps1
python create_admin.py
```

Then log in with that account and use the admin panel.

## Database

- The project uses SQLite for local development.
- The database file is created automatically at:
  `backend/tennis_predictor.db`
- Tables are created automatically when the backend starts.

## Project Structure

```text
frontend/   React frontend
backend/    FastAPI backend
```

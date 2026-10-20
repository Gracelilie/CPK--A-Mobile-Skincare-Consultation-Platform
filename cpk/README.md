# CPK demo (React + FastAPI + SQL)

Runnable local demo of the CPK consultation platform. Login: `alex@example.com` / `demo1234`.

## Run
Backend (terminal 1):
    cd backend
    python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000               # API docs: http://localhost:8000/docs

Frontend (terminal 2):
    cd frontend
    npm install
    npm run dev                                         # http://localhost:5173

## Using AWS RDS
    pip install psycopg2-binary
    export DATABASE_URL=postgresql+psycopg2://USER:PASS@YOUR-RDS-HOST:5432/cpk
    export JWT_SECRET=<long random string>

## Implemented vs. not (matches your design doc's "not yet confirmed" list)
Implemented: login (JWT), profile/privacy mode, aestheticians, booking, appointments, chat (stored; auto-reply is a stub), progress notes.
Stubs: video calls, payments/subscriptions, product ordering, photo upload, notifications.
Not included, still yours to add: Alembic migrations, tests, CI/CD, rate limiting, HTTPS/at-rest encryption config, registration.

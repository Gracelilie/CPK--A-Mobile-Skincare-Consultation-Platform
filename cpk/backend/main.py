"""CPK demo backend: FastAPI + SQLAlchemy.
DATABASE_URL defaults to local SQLite. For AWS RDS (PostgreSQL) set e.g.
  DATABASE_URL=postgresql+psycopg2://user:pass@your-rds-host:5432/cpk
"""
import os, hashlib, hmac, secrets, datetime as dt
import jwt
from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Float, Text, ForeignKey
from sqlalchemy.orm import sessionmaker, declarative_base, Session

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./cpk.db")
JWT_SECRET = os.getenv("JWT_SECRET", "dev-only-change-me")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {})
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

# ---------- models ----------
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    name = Column(String(80)); email = Column(String(120), unique=True, index=True)
    password_hash = Column(String(200)); profile_mode = Column(String(10), default="private")
    referral_code = Column(String(40)); plan = Column(String(40), default="Premium")

class Aesthetician(Base):
    __tablename__ = "aestheticians"
    id = Column(Integer, primary_key=True)
    name = Column(String(80)); specialization = Column(String(80))
    rating = Column(Float); availability = Column(String(40)); image = Column(String(8))

class Appointment(Base):
    __tablename__ = "appointments"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    aesthetician_id = Column(Integer, ForeignKey("aestheticians.id"))
    type = Column(String(40)); date = Column(String(40)); time = Column(String(20)); duration = Column(String(20))

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    sender = Column(String(40)); body = Column(Text); created = Column(String(30))

class ProgressEntry(Base):
    __tablename__ = "progress"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    week = Column(Integer); note = Column(Text)

# ---------- auth helpers ----------
def hash_pw(pw, salt=None):
    salt = salt or secrets.token_hex(8)
    return f"{salt}${hashlib.pbkdf2_hmac('sha256', pw.encode(), salt.encode(), 100_000).hex()}"
def check_pw(pw, stored):
    salt, _ = stored.split("$"); return hmac.compare_digest(hash_pw(pw, salt), stored)

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

def current_user(authorization: str = Header(None), db: Session = Depends(get_db)) -> User:
    try:
        uid = jwt.decode((authorization or "").removeprefix("Bearer "), JWT_SECRET, algorithms=["HS256"])["sub"]
    except Exception:
        raise HTTPException(401, "Invalid or missing token")
    user = db.get(User, int(uid))
    if not user: raise HTTPException(401, "Unknown user")
    return user

# ---------- app ----------
app = FastAPI(title="CPK Demo API")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"], allow_methods=["*"], allow_headers=["*"])

@app.on_event("startup")
def seed():
    Base.metadata.create_all(engine)
    db = SessionLocal()
    if not db.query(User).first():
        u = User(name="Alex", email="alex@example.com", password_hash=hash_pw("demo1234"), referral_code="CPK-ALEX-DEMO")
        db.add(u)
        db.add_all([
            Aesthetician(name="Dr. Sarah Johnson", specialization="Acne Treatment", rating=4.9, availability="Available Now", image="👩‍⚕️"),
            Aesthetician(name="Dr. Michael Chen", specialization="Anti-Aging", rating=4.8, availability="15 min", image="👨‍⚕️"),
            Aesthetician(name="Dr. Emily Rodriguez", specialization="Sensitive Skin", rating=4.9, availability="Available Now", image="👩‍⚕️"),
        ])
        db.flush()
        db.add_all([
            Appointment(user_id=u.id, aesthetician_id=1, type="Consultation", date="Tomorrow", time="2:00 PM", duration="30 min"),
            Appointment(user_id=u.id, aesthetician_id=2, type="Follow-up", date="Friday", time="10:00 AM", duration="15 min"),
            Message(user_id=u.id, sender="Dr. Sarah", body="Hello! How can I help you today?", created="2:30 PM"),
            ProgressEntry(user_id=u.id, week=2, note="Initial consultation completed. Custom routine prescribed."),
            ProgressEntry(user_id=u.id, week=4, note="Mild irritation noted. Reduced frequency of exfoliant as recommended."),
            ProgressEntry(user_id=u.id, week=6, note="Significant improvement in skin texture and reduced breakouts."),
        ])
        db.commit()
    db.close()

class Login(BaseModel): email: str; password: str
class ProfilePatch(BaseModel): profile_mode: str
class BookIn(BaseModel): aesthetician_id: int; type: str = "Consultation"
class MsgIn(BaseModel): body: str
class NoteIn(BaseModel): week: int; note: str

@app.get("/health")
def health(): return {"status": "ok"}

@app.post("/auth/login")
def login(p: Login, db: Session = Depends(get_db)):
    u = db.query(User).filter_by(email=p.email).first()
    if not u or not check_pw(p.password, u.password_hash): raise HTTPException(401, "Wrong email or password")
    token = jwt.encode({"sub": str(u.id), "exp": dt.datetime.utcnow() + dt.timedelta(hours=8)}, JWT_SECRET, algorithm="HS256")
    return {"token": token}

@app.get("/me")
def me(u: User = Depends(current_user)):
    return {"name": u.name, "email": u.email, "profile_mode": u.profile_mode, "referral_code": u.referral_code, "plan": u.plan}

@app.patch("/me")
def patch_me(p: ProfilePatch, u: User = Depends(current_user), db: Session = Depends(get_db)):
    if p.profile_mode not in ("private", "public"): raise HTTPException(422, "profile_mode must be private or public")
    u.profile_mode = p.profile_mode; db.commit(); return {"profile_mode": u.profile_mode}

@app.get("/aestheticians")
def aestheticians(_: User = Depends(current_user), db: Session = Depends(get_db)):
    return [{c.name: getattr(a, c.name) for c in Aesthetician.__table__.columns} for a in db.query(Aesthetician)]

@app.get("/appointments")
def appointments(u: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = db.query(Appointment, Aesthetician).join(Aesthetician, Aesthetician.id == Appointment.aesthetician_id).filter(Appointment.user_id == u.id).order_by(Appointment.id).all()
    return [{"id": a.id, "type": a.type, "date": a.date, "time": a.time, "duration": a.duration, "doctor": d.name} for a, d in rows]

@app.post("/appointments")
def book(p: BookIn, u: User = Depends(current_user), db: Session = Depends(get_db)):
    d = db.get(Aesthetician, p.aesthetician_id)
    if not d: raise HTTPException(404, "Aesthetician not found")
    a = Appointment(user_id=u.id, aesthetician_id=d.id, type=p.type, date="Today", time=d.availability, duration="30 min")
    db.add(a); db.commit()
    return {"id": a.id, "doctor": d.name}

@app.get("/messages")
def messages(u: User = Depends(current_user), db: Session = Depends(get_db)):
    return [{"sender": m.sender, "message": m.body, "time": m.created} for m in db.query(Message).filter_by(user_id=u.id).order_by(Message.id)]

@app.post("/messages")
def send(p: MsgIn, u: User = Depends(current_user), db: Session = Depends(get_db)):
    if not p.body.strip(): raise HTTPException(422, "Message is empty")
    now = dt.datetime.now().strftime("%I:%M %p").lstrip("0")
    db.add(Message(user_id=u.id, sender="You", body=p.body.strip(), created=now))
    db.add(Message(user_id=u.id, sender="Dr. Sarah", body="Thanks, I've noted that. I'll review it and reply shortly. (Demo auto-reply)", created=now))
    db.commit(); return {"ok": True}

@app.get("/progress")
def progress(u: User = Depends(current_user), db: Session = Depends(get_db)):
    return [{"week": e.week, "update": e.note} for e in db.query(ProgressEntry).filter_by(user_id=u.id).order_by(ProgressEntry.week.desc())]

@app.post("/progress")
def add_progress(p: NoteIn, u: User = Depends(current_user), db: Session = Depends(get_db)):
    db.add(ProgressEntry(user_id=u.id, week=p.week, note=p.note)); db.commit(); return {"ok": True}

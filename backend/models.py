import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, JSON
from database import Base

def gen_id():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=gen_id)
    email = Column(String, unique=True, nullable=False, index=True)
    full_name = Column(String, default="")
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user")
    created_date = Column(DateTime, default=datetime.utcnow)

class Tournament(Base):
    __tablename__ = "tournaments"
    id = Column(String, primary_key=True, default=gen_id)
    name = Column(String, nullable=False)
    location = Column(String, default="")
    surface = Column(String, default="")
    size = Column(Integer, nullable=False)
    start_date = Column(String, default="")
    end_date = Column(String, default="")
    status = Column(String, default="upcoming")
    prize_money = Column(String, default="")
    category = Column(String, default="")
    created_date = Column(DateTime, default=datetime.utcnow)
    updated_date = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Player(Base):
    __tablename__ = "players"
    id = Column(String, primary_key=True, default=gen_id)
    name = Column(String, nullable=False)
    nationality = Column(String, default="")
    ranking = Column(Integer, nullable=True)
    seed = Column(Integer, nullable=True)
    tournament_id = Column(String, nullable=False, index=True)
    bracket_position = Column(Integer, nullable=True)
    is_bye = Column(Boolean, default=False)
    created_date = Column(DateTime, default=datetime.utcnow)

class Match(Base):
    __tablename__ = "matches"
    id = Column(String, primary_key=True, default=gen_id)
    tournament_id = Column(String, nullable=False, index=True)
    round = Column(Integer, nullable=False)
    round_name = Column(String, default="")
    match_index = Column(Integer, nullable=False)
    player1_id = Column(String, nullable=True)
    player2_id = Column(String, nullable=True)
    player1_name = Column(String, default="TBD")
    player2_name = Column(String, default="TBD")
    winner_id = Column(String, nullable=True)
    winner_name = Column(String, nullable=True)
    status = Column(String, default="scheduled")
    score = Column(String, default="")
    created_date = Column(DateTime, default=datetime.utcnow)
    updated_date = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Prediction(Base):
    __tablename__ = "predictions"
    id = Column(String, primary_key=True, default=gen_id)
    tournament_id = Column(String, nullable=False, index=True)
    user_email = Column(String, nullable=False, index=True)
    predicted_winners = Column(JSON, default=list)
    total_points = Column(Float, default=0)
    is_scored = Column(Boolean, default=False)
    created_date = Column(DateTime, default=datetime.utcnow)
    updated_date = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

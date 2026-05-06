from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel


class UserCreate(BaseModel):
    email: str
    full_name: str = ""
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    created_date: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = None


class TournamentCreate(BaseModel):
    name: str
    location: Optional[str] = ""
    surface: Optional[str] = ""
    size: int
    start_date: Optional[str] = ""
    end_date: Optional[str] = ""
    status: Optional[str] = "upcoming"
    prize_money: Optional[str] = ""
    category: Optional[str] = ""


class TournamentUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    surface: Optional[str] = None
    size: Optional[int] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: Optional[str] = None
    prize_money: Optional[str] = None
    category: Optional[str] = None


class TournamentOut(TournamentCreate):
    id: str
    created_date: datetime
    updated_date: datetime

    class Config:
        from_attributes = True


class PlayerCreate(BaseModel):
    name: str
    nationality: Optional[str] = ""
    ranking: Optional[int] = None
    seed: Optional[int] = None
    tournament_id: str
    bracket_position: Optional[int] = None
    is_bye: Optional[bool] = False


class PlayerOut(PlayerCreate):
    id: str
    created_date: datetime

    class Config:
        from_attributes = True


class MatchCreate(BaseModel):
    tournament_id: str
    round: int
    round_name: Optional[str] = ""
    match_index: int
    player1_id: Optional[str] = None
    player2_id: Optional[str] = None
    player1_name: Optional[str] = "TBD"
    player2_name: Optional[str] = "TBD"
    winner_id: Optional[str] = None
    winner_name: Optional[str] = None
    status: Optional[str] = "scheduled"
    score: Optional[str] = ""


class MatchUpdate(BaseModel):
    player1_id: Optional[str] = None
    player2_id: Optional[str] = None
    player1_name: Optional[str] = None
    player2_name: Optional[str] = None
    winner_id: Optional[str] = None
    winner_name: Optional[str] = None
    status: Optional[str] = None
    score: Optional[str] = None


class MatchOut(MatchCreate):
    id: str
    created_date: datetime
    updated_date: datetime

    class Config:
        from_attributes = True


class PredictionCreate(BaseModel):
    tournament_id: str
    user_email: str
    predicted_winners: Optional[List[Any]] = []
    total_points: Optional[float] = 0
    is_scored: Optional[bool] = False


class PredictionOut(PredictionCreate):
    id: str
    created_date: datetime
    updated_date: datetime

    class Config:
        from_attributes = True

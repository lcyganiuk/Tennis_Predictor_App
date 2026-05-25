import os
from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import auth
import models
import schemas
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Tennis Tournament Predictor API")

cors_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:3000",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in cors_origins if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def apply_sort(query, model, sort: Optional[str]):
    if not sort:
        return query

    desc = sort.startswith("-")
    field_name = sort[1:] if desc else sort
    column = getattr(model, field_name, None)
    if column is None:
        return query

    return query.order_by(column.desc() if desc else column.asc())


@app.post("/api/auth/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    db_user = models.User(
        email=user.email,
        full_name=user.full_name,
        hashed_password=auth.hash_password(user.password),
        role="user",
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@app.post("/api/auth/login", response_model=schemas.Token)
def login(credentials: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not auth.verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = auth.create_access_token({"sub": user.email, "role": user.role})
    return {"access_token": token, "token_type": "bearer"}


@app.get("/api/auth/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


@app.put("/api/auth/me", response_model=schemas.UserOut)
def update_me(
    data: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if data.full_name is not None:
        current_user.full_name = data.full_name
    db.commit()
    db.refresh(current_user)
    return current_user


@app.get("/api/users", response_model=List[schemas.UserOut])
def list_users(sort: Optional[str] = None, db: Session = Depends(get_db)):
    query = apply_sort(db.query(models.User), models.User, sort)
    return query.all()


@app.get("/api/tournaments", response_model=List[schemas.TournamentOut])
def list_tournaments(
    id: Optional[str] = None,
    status: Optional[str] = None,
    sort: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.Tournament)
    if id:
        query = query.filter(models.Tournament.id == id)
    if status:
        query = query.filter(models.Tournament.status == status)
    query = apply_sort(query, models.Tournament, sort)
    return query.all()


@app.get("/api/tournaments/{id}", response_model=schemas.TournamentOut)
def get_tournament(id: str, db: Session = Depends(get_db)):
    tournament = db.query(models.Tournament).filter(models.Tournament.id == id).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    return tournament


@app.post("/api/tournaments", response_model=schemas.TournamentOut)
def create_tournament(
    data: schemas.TournamentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    tournament = models.Tournament(**data.model_dump())
    db.add(tournament)
    db.commit()
    db.refresh(tournament)
    return tournament


@app.put("/api/tournaments/{id}", response_model=schemas.TournamentOut)
def update_tournament(
    id: str,
    data: schemas.TournamentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    tournament = db.query(models.Tournament).filter(models.Tournament.id == id).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(tournament, key, value)

    db.commit()
    db.refresh(tournament)
    return tournament


@app.delete("/api/tournaments/{id}")
def delete_tournament(
    id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    tournament = db.query(models.Tournament).filter(models.Tournament.id == id).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Not found")

    db.query(models.Match).filter(models.Match.tournament_id == id).delete()
    db.query(models.Player).filter(models.Player.tournament_id == id).delete()
    db.query(models.Prediction).filter(models.Prediction.tournament_id == id).delete()
    db.delete(tournament)
    db.commit()
    return {"ok": True}


@app.get("/api/players", response_model=List[schemas.PlayerOut])
def list_players(
    tournament_id: Optional[str] = None,
    sort: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.Player)
    if tournament_id:
        query = query.filter(models.Player.tournament_id == tournament_id)
    query = apply_sort(query, models.Player, sort)
    return query.all()


@app.post("/api/players", response_model=schemas.PlayerOut)
def create_player(
    data: schemas.PlayerCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    player = models.Player(**data.model_dump())
    db.add(player)
    db.commit()
    db.refresh(player)
    return player


@app.delete("/api/players/{id}")
def delete_player(
    id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    player = db.query(models.Player).filter(models.Player.id == id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Not found")

    db.delete(player)
    db.commit()
    return {"ok": True}


@app.get("/api/matches", response_model=List[schemas.MatchOut])
def list_matches(
    tournament_id: Optional[str] = None,
    sort: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.Match)
    if tournament_id:
        query = query.filter(models.Match.tournament_id == tournament_id)
    query = apply_sort(query, models.Match, sort)
    return query.all()


@app.post("/api/matches", response_model=schemas.MatchOut)
def create_match(
    data: schemas.MatchCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    match = models.Match(**data.model_dump())
    db.add(match)
    db.commit()
    db.refresh(match)
    return match


@app.put("/api/matches/{id}", response_model=schemas.MatchOut)
def update_match(
    id: str,
    data: schemas.MatchUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    match = db.query(models.Match).filter(models.Match.id == id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(match, key, value)

    db.commit()
    db.refresh(match)
    return match


@app.delete("/api/matches/{id}")
def delete_match(
    id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    match = db.query(models.Match).filter(models.Match.id == id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Not found")

    db.delete(match)
    db.commit()
    return {"ok": True}


@app.get("/api/predictions", response_model=List[schemas.PredictionOut])
def list_predictions(
    tournament_id: Optional[str] = None,
    user_email: Optional[str] = None,
    sort: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.Prediction)
    if tournament_id:
        query = query.filter(models.Prediction.tournament_id == tournament_id)
    if user_email:
        query = query.filter(models.Prediction.user_email == user_email)
    query = apply_sort(query, models.Prediction, sort)
    return query.all()


@app.post("/api/predictions", response_model=schemas.PredictionOut)
def create_prediction(
    data: schemas.PredictionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if data.user_email != current_user.email:
        raise HTTPException(status_code=403, detail="Can only create predictions for yourself")

    prediction = models.Prediction(**data.model_dump())
    db.add(prediction)
    db.commit()
    db.refresh(prediction)
    return prediction


@app.put("/api/predictions/{id}", response_model=schemas.PredictionOut)
def update_prediction(
    id: str,
    data: schemas.PredictionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    prediction = db.query(models.Prediction).filter(models.Prediction.id == id).first()
    if not prediction:
        raise HTTPException(status_code=404, detail="Not found")

    if prediction.user_email != current_user.email and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(prediction, key, value)

    db.commit()
    db.refresh(prediction)
    return prediction


@app.delete("/api/predictions/{id}")
def delete_prediction(
    id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    prediction = db.query(models.Prediction).filter(models.Prediction.id == id).first()
    if not prediction:
        raise HTTPException(status_code=404, detail="Not found")

    if prediction.user_email != current_user.email and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")

    db.delete(prediction)
    db.commit()
    return {"ok": True}

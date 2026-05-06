from database import SessionLocal, engine
import models, auth

models.Base.metadata.create_all(bind=engine)

db = SessionLocal()

email = input("Admin email: ")
name = input("Full name: ")
password = input("Password: ")

existing = db.query(models.User).filter(models.User.email == email).first()
if existing:
    print("User already exists!")
else:
    admin = models.User(
        email=email,
        full_name=name,
        hashed_password=auth.hash_password(password),
        role="admin",
    )
    db.add(admin)
    db.commit()
    print(f"Admin user '{email}' created successfully!")

db.close()

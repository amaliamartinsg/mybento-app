"""JWT and password utilities for authentication."""

import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
from jose import JWTError, jwt
from sqlmodel import select

from app.backend.database import get_session
from app.backend.models.user import User
from app.backend.schemas.auth import TokenData

_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "changeme-set-a-real-secret-in-production")
_ALGORITHM = "HS256"
_TOKEN_EXPIRE_DAYS = 7


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_access_token(user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=_TOKEN_EXPIRE_DAYS)
    return jwt.encode({"sub": str(user_id), "exp": expire}, _SECRET_KEY, algorithm=_ALGORITHM)


def decode_token(token: str) -> Optional[TokenData]:
    try:
        payload = jwt.decode(token, _SECRET_KEY, algorithms=[_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            return None
        return TokenData(user_id=int(user_id))
    except JWTError:
        return None


def get_user_by_email(email: str) -> Optional[User]:
    with get_session() as session:
        return session.exec(select(User).where(User.email == email)).first()


def get_user_by_id(user_id: int) -> Optional[User]:
    with get_session() as session:
        return session.get(User, user_id)


def authenticate_user(email: str, password: str) -> Optional[User]:
    user = get_user_by_email(email)
    if user and user.is_active and verify_password(password, user.hashed_password):
        return user
    return None


def create_user(email: str, password: str, name: Optional[str] = None) -> User:
    user = User(email=email, hashed_password=hash_password(password), name=name)
    with get_session() as session:
        session.add(user)
        session.commit()
        session.refresh(user)
        return user

"""Authentication endpoints: register, login, me."""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.backend.schemas.auth import Token, UserCreate, UserLogin, UserPublic
from app.backend.services import auth_service

logger = logging.getLogger("mybento.backend")
router = APIRouter(prefix="/auth", tags=["auth"])
_bearer = HTTPBearer()


def _get_current_user(credentials: HTTPAuthorizationCredentials = Depends(_bearer)):
    token_data = auth_service.decode_token(credentials.credentials)
    if token_data is None or token_data.user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido o expirado")
    user = auth_service.get_user_by_id(token_data.user_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no encontrado")
    return user


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(body: UserCreate):
    if auth_service.get_user_by_email(body.email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El email ya está registrado")
    user = auth_service.create_user(email=body.email, password=body.password, name=body.name)
    logger.info("user_registered", extra={"user_id": user.id, "email": user.email})
    return Token(access_token=auth_service.create_access_token(user.id))


@router.post("/login", response_model=Token)
def login(body: UserLogin):
    user = auth_service.authenticate_user(body.email, body.password)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales incorrectas")
    logger.info("user_login", extra={"user_id": user.id})
    return Token(access_token=auth_service.create_access_token(user.id))


@router.get("/me", response_model=UserPublic)
def me(user=Depends(_get_current_user)):
    return UserPublic(id=user.id, email=user.email, name=user.name, is_active=user.is_active)

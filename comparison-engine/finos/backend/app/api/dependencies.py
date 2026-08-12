from collections.abc import Callable
from typing import Set

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User, UserRole


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/auth/login",
)


PERMISSION_ROLES: dict[str, Set[UserRole]] = {
    "client.create": {
        UserRole.OPERATIONS_AGENT,
        UserRole.OPERATIONS_MANAGER,
        UserRole.ADMINISTRATOR,
        UserRole.SUPER_ADMIN,
    },
    "application.create": {
        UserRole.CLIENT,
        UserRole.OPERATIONS_AGENT,
        UserRole.OPERATIONS_MANAGER,
        UserRole.ADMINISTRATOR,
        UserRole.SUPER_ADMIN,
    },
    "application.advance": {
        UserRole.OPERATIONS_AGENT,
        UserRole.OPERATIONS_MANAGER,
        UserRole.ADMINISTRATOR,
        UserRole.SUPER_ADMIN,
    },
    "application.decide": {
        UserRole.OPERATIONS_AGENT,
        UserRole.OPERATIONS_MANAGER,
        UserRole.UNDERWRITER,
        UserRole.ADMINISTRATOR,
        UserRole.SUPER_ADMIN,
    },
    "claim.create": {
        UserRole.CLIENT,
        UserRole.CLAIMS_AGENT,
        UserRole.OPERATIONS_MANAGER,
        UserRole.ADMINISTRATOR,
        UserRole.SUPER_ADMIN,
    },
    "claim.advance": {
        UserRole.CLAIMS_AGENT,
        UserRole.OPERATIONS_MANAGER,
        UserRole.ADMINISTRATOR,
        UserRole.SUPER_ADMIN,
    },
    "claim.resolve": {
        UserRole.CLAIMS_AGENT,
        UserRole.OPERATIONS_MANAGER,
        UserRole.ADMINISTRATOR,
        UserRole.SUPER_ADMIN,
    },
    "document.upload": {
        UserRole.CLIENT,
        UserRole.OPERATIONS_AGENT,
        UserRole.OPERATIONS_MANAGER,
        UserRole.CLAIMS_AGENT,
        UserRole.UNDERWRITER,
        UserRole.COMPLIANCE,
        UserRole.ADMINISTRATOR,
        UserRole.SUPER_ADMIN,
    },
    "activity.read_all": {
        UserRole.OPERATIONS_MANAGER,
        UserRole.COMPLIANCE,
        UserRole.ADMINISTRATOR,
        UserRole.SUPER_ADMIN,
    },
}


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication token",
        headers={
            "WWW-Authenticate": "Bearer",
        },
    )

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )

        user_id = payload.get("sub")

        if not user_id:
            raise credentials_exception

    except JWTError as exc:
        raise credentials_exception from exc

    user = (
        db.query(User)
        .filter(
            User.id == user_id,
            User.is_active.is_(True),
        )
        .first()
    )

    if not user:
        raise credentials_exception

    return user


def require_permission(
    permission: str,
) -> Callable:
    def dependency(
        user: User = Depends(get_current_user),
    ) -> User:
        allowed_roles = PERMISSION_ROLES.get(permission)

        if allowed_roles is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=(
                    "Permission configuration is missing for "
                    f"{permission}"
                ),
            )

        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permission",
            )

        return user

    return dependency

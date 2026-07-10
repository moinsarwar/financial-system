from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from .. import schemas, crud
from ..database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.ApplicationResponse)
async def create_application(
    app_data: schemas.ApplicationCreate,
    db: AsyncSession = Depends(get_db)
):
    try:
        db_app = await crud.create_application(db, app_data)
        return db_app
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LFE error: {str(e)}")

@router.get("/history", response_model=list[schemas.ApplicationResponse])
async def get_application_history(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db)
):
    apps = await crud.get_applications(db, skip, limit)
    return apps

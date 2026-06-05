from fastapi import APIRouter

from app.api.v1.endpoints.channels import router as channels_router
from app.api.v1.endpoints.health import router as health_router
from app.api.v1.endpoints.realtime import router as realtime_router
from app.api.v1.endpoints.users import router as users_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["health"])
api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(channels_router, prefix="/channels", tags=["channels"])
api_router.include_router(realtime_router, prefix="/realtime", tags=["realtime"])

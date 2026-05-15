from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from schemas import (
    CleaningNotificationCreate,
    CleaningNotificationResponse,
    MessageResponse
)
from services import menage_service
from typing import List

router = APIRouter(prefix="/menage", tags=["Ménage"])


@router.post("/notification", response_model=CleaningNotificationResponse, status_code=201)
async def signaler_chambre_nettoyee(
    data: CleaningNotificationCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    La femme de ménage signale qu'une chambre est nettoyée.
    Publie automatiquement sur RabbitMQ → service1 remet la chambre disponible.
    """
    notification = await menage_service.create_notification(db, data)
    # TODO : publier sur RabbitMQ queue service3.room.cleaned
    return notification


@router.get("/notifications", response_model=List[CleaningNotificationResponse])
async def get_all_notifications(db: AsyncSession = Depends(get_db)):
    """Liste toutes les notifications de ménage"""
    return await menage_service.get_all_notifications(db)


@router.get("/notifications/en-attente", response_model=List[CleaningNotificationResponse])
async def get_notifications_en_attente(db: AsyncSession = Depends(get_db)):
    """Liste les notifications pas encore traitées"""
    return await menage_service.get_notifications_en_attente(db)


@router.get("/notifications/{chambre_id}", response_model=List[CleaningNotificationResponse])
async def get_notifications_chambre(
    chambre_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Historique des notifications pour une chambre"""
    return await menage_service.get_notifications_by_chambre(db, chambre_id)


@router.put("/notifications/{notification_id}/traiter", response_model=CleaningNotificationResponse)
async def traiter_notification(
    notification_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Marque une notification comme traitée.
    Appelé après que service1 confirme que la chambre est remise disponible.
    """
    try:
        return await menage_service.traiter_notification(db, notification_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
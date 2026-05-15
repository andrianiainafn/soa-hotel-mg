from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from models import CleaningNotification, NotificationStatus
from schemas import CleaningNotificationCreate
from datetime import datetime
from typing import List


async def create_notification(
    db: AsyncSession,
    data: CleaningNotificationCreate
) -> CleaningNotification:
    """
    La femme de ménage signale qu'une chambre est nettoyée.
    Après ça, on publie sur RabbitMQ → service1 remet la chambre disponible.
    """
    notification = CleaningNotification(
        chambre_id=data.chambre_id,
        chambre_numero=data.chambre_numero,
        femme_menage_id=data.femme_menage_id,
        message=data.message,
        statut=NotificationStatus.EN_ATTENTE
    )
    db.add(notification)
    await db.flush()
    await db.refresh(notification)
    return notification


async def get_all_notifications(db: AsyncSession) -> List[CleaningNotification]:
    result = await db.execute(
        select(CleaningNotification).order_by(CleaningNotification.created_at.desc())
    )
    return result.scalars().all()


async def get_notifications_by_chambre(
    db: AsyncSession,
    chambre_id: str
) -> List[CleaningNotification]:
    result = await db.execute(
        select(CleaningNotification)
        .where(CleaningNotification.chambre_id == chambre_id)
        .order_by(CleaningNotification.created_at.desc())
    )
    return result.scalars().all()


async def traiter_notification(
    db: AsyncSession,
    notification_id: int
) -> CleaningNotification:
    """
    Marque une notification comme traitée.
    Appelé après que service1 confirme que la chambre est remise disponible.
    """
    result = await db.execute(
        select(CleaningNotification)
        .where(CleaningNotification.id == notification_id)
    )
    notification = result.scalar_one_or_none()

    if not notification:
        raise ValueError(f"Notification {notification_id} introuvable")

    if notification.statut == NotificationStatus.TRAITEE:
        raise ValueError(f"Notification {notification_id} déjà traitée")

    notification.statut = NotificationStatus.TRAITEE
    notification.traitee_at = datetime.utcnow()
    await db.flush()
    await db.refresh(notification)
    return notification


async def get_notifications_en_attente(db: AsyncSession) -> List[CleaningNotification]:
    result = await db.execute(
        select(CleaningNotification)
        .where(CleaningNotification.statut == NotificationStatus.EN_ATTENTE)
        .order_by(CleaningNotification.created_at.asc())
    )
    return result.scalars().all()
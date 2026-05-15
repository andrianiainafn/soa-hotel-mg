from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from enum import Enum


class NotificationStatus(str, Enum):
    EN_ATTENTE = "EN_ATTENTE"
    TRAITEE = "TRAITEE"


# ─────────────────────────────────────────
# StockItem
# ─────────────────────────────────────────

class StockItemCreate(BaseModel):
    nom: str = Field(..., example="Gel douche")
    unite: str = Field(..., example="pièce")
    seuil_alerte: int = Field(default=5, example=5)


class StockItemResponse(BaseModel):
    id: int
    nom: str
    unite: str
    seuil_alerte: int
    created_at: datetime

    class Config:
        from_attributes = True


# ─────────────────────────────────────────
# RoomStock
# ─────────────────────────────────────────

class RoomStockResponse(BaseModel):
    id: int
    chambre_id: str
    item_id: int
    quantite: int
    est_bas: bool
    updated_at: datetime
    item: StockItemResponse

    class Config:
        from_attributes = True


class RoomStockDecrementRequest(BaseModel):
    """Reçu depuis RabbitMQ quand une réservation est créée"""
    chambre_id: str = Field(..., example="6849a1c3f2b3d4e5f6a7b8c9")
    chambre_numero: str = Field(..., example="101")


class RoomStockRestockRequest(BaseModel):
    """Réapprovisionner une chambre après ménage"""
    chambre_id: str = Field(..., example="6849a1c3f2b3d4e5f6a7b8c9")
    item_id: int = Field(..., example=1)
    quantite: int = Field(..., example=10)


class StockAlerteResponse(BaseModel):
    """Chambres avec au moins un article sous le seuil d'alerte"""
    chambre_id: str
    stocks_bas: List[RoomStockResponse]


# ─────────────────────────────────────────
# CleaningNotification
# ─────────────────────────────────────────

class CleaningNotificationCreate(BaseModel):
    chambre_id: str = Field(..., example="6849a1c3f2b3d4e5f6a7b8c9")
    chambre_numero: str = Field(..., example="101")
    femme_menage_id: str = Field(..., example="42")
    message: Optional[str] = Field(None, example="Chambre nettoyée, linge changé")


class CleaningNotificationResponse(BaseModel):
    id: int
    chambre_id: str
    chambre_numero: str
    femme_menage_id: str
    statut: NotificationStatus
    message: Optional[str]
    created_at: datetime
    traitee_at: Optional[datetime]

    class Config:
        from_attributes = True


# ─────────────────────────────────────────
# Réponses génériques
# ─────────────────────────────────────────

class MessageResponse(BaseModel):
    message: str
    success: bool = True
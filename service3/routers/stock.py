from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from schemas import (
    StockItemCreate, StockItemResponse,
    RoomStockResponse, RoomStockRestockRequest,
    StockAlerteResponse, MessageResponse
)
from services import stock_service
from typing import List

router = APIRouter(prefix="/stock", tags=["Stock"])


@router.get("/items", response_model=List[StockItemResponse])
async def get_all_items(db: AsyncSession = Depends(get_db)):
    """Liste tous les articles disponibles"""
    return await stock_service.get_all_items(db)


@router.post("/items", response_model=StockItemResponse, status_code=201)
async def create_item(data: StockItemCreate, db: AsyncSession = Depends(get_db)):
    """Créer un nouvel article"""
    existing = await stock_service.get_item_by_nom(db, data.nom)
    if existing:
        raise HTTPException(status_code=400, detail=f"Article '{data.nom}' existe déjà")
    return await stock_service.create_item(db, data)


@router.get("/alertes", response_model=List[StockAlerteResponse])
async def get_alertes(db: AsyncSession = Depends(get_db)):
    """Chambres avec au moins un article sous le seuil d'alerte"""
    alertes = await stock_service.get_alertes(db)
    return [
        StockAlerteResponse(chambre_id=chambre_id, stocks_bas=stocks)
        for chambre_id, stocks in alertes.items()
    ]


@router.get("/{chambre_id}", response_model=List[RoomStockResponse])
async def get_stock_chambre(chambre_id: str, db: AsyncSession = Depends(get_db)):
    """Stock d'une chambre spécifique"""
    stocks = await stock_service.get_stock_by_chambre(db, chambre_id)
    if not stocks:
        raise HTTPException(status_code=404, detail=f"Aucun stock trouvé pour la chambre {chambre_id}")
    return stocks


@router.post("/init/{chambre_id}", response_model=MessageResponse, status_code=201)
async def init_stock(chambre_id: str, db: AsyncSession = Depends(get_db)):
    """
    Initialise le stock d'une chambre avec les articles par défaut.
    Appelé manuellement ou via RabbitMQ à la réservation.
    """
    await stock_service.init_stock_chambre(db, chambre_id)
    return MessageResponse(message=f"Stock initialisé pour la chambre {chambre_id}")


@router.put("/{chambre_id}/decrement", response_model=MessageResponse)
async def decrement_stock(chambre_id: str, db: AsyncSession = Depends(get_db)):
    """
    Décrémente le stock d'une chambre de 1 par article.
    Appelé automatiquement à chaque réservation.
    """
    await stock_service.decrement_stock_chambre(db, chambre_id)
    return MessageResponse(message=f"Stock décrémenté pour la chambre {chambre_id}")


@router.put("/restock", response_model=RoomStockResponse)
async def restock(data: RoomStockRestockRequest, db: AsyncSession = Depends(get_db)):
    """Réapprovisionner un article spécifique d'une chambre après ménage"""
    try:
        stock = await stock_service.restock_chambre(db, data)
        return stock
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
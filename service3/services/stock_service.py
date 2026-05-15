from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from models import StockItem, RoomStock
from schemas import StockItemCreate, RoomStockRestockRequest
from typing import List


# Articles par défaut mis dans chaque chambre à la réservation
ARTICLES_PAR_DEFAUT = [
    {"nom": "Gel douche",        "quantite": 2},
    {"nom": "Pantoufle",         "quantite": 2},
    {"nom": "Brosse à dent",     "quantite": 2},
    {"nom": "Papier hygiénique", "quantite": 4},
]


# ─────────────────────────────────────────
# StockItem — gestion des articles
# ─────────────────────────────────────────

async def get_all_items(db: AsyncSession) -> List[StockItem]:
    result = await db.execute(select(StockItem))
    return result.scalars().all()


async def create_item(db: AsyncSession, data: StockItemCreate) -> StockItem:
    item = StockItem(
        nom=data.nom,
        unite=data.unite,
        seuil_alerte=data.seuil_alerte
    )
    db.add(item)
    await db.flush()
    await db.refresh(item)
    return item


async def get_item_by_nom(db: AsyncSession, nom: str) -> StockItem | None:
    result = await db.execute(select(StockItem).where(StockItem.nom == nom))
    return result.scalar_one_or_none()


# ─────────────────────────────────────────
# RoomStock — stock par chambre
# ─────────────────────────────────────────

async def get_stock_by_chambre(db: AsyncSession, chambre_id: str) -> List[RoomStock]:
    result = await db.execute(
        select(RoomStock)
        .where(RoomStock.chambre_id == chambre_id)
        .options(selectinload(RoomStock.item))
    )
    return result.scalars().all()


async def get_all_stocks(db: AsyncSession) -> List[RoomStock]:
    result = await db.execute(
        select(RoomStock).options(selectinload(RoomStock.item))
    )
    return result.scalars().all()


async def init_stock_chambre(db: AsyncSession, chambre_id: str) -> List[RoomStock]:
    """
    Initialise le stock d'une chambre avec les articles par défaut.
    Appelé automatiquement à la réservation via RabbitMQ.
    """
    stocks_crees = []

    for article in ARTICLES_PAR_DEFAUT:
        # Récupérer ou créer l'article
        item = await get_item_by_nom(db, article["nom"])
        if not item:
            item = StockItem(nom=article["nom"], unite="pièce", seuil_alerte=2)
            db.add(item)
            await db.flush()

        # Vérifier si le stock existe déjà pour cette chambre
        result = await db.execute(
            select(RoomStock).where(
                and_(
                    RoomStock.chambre_id == chambre_id,
                    RoomStock.item_id == item.id
                )
            )
        )
        existing = result.scalar_one_or_none()

        if not existing:
            stock = RoomStock(
                chambre_id=chambre_id,
                item_id=item.id,
                quantite=article["quantite"]
            )
            db.add(stock)
            await db.flush()
            await db.refresh(stock)
            stocks_crees.append(stock)

    return stocks_crees


async def decrement_stock_chambre(db: AsyncSession, chambre_id: str) -> List[RoomStock]:
    """
    Décrémente le stock d'une chambre de 1 par article.
    Appelé automatiquement quand service2 crée une réservation (via RabbitMQ).
    """
    stocks = await get_stock_by_chambre(db, chambre_id)

    if not stocks:
        # Première réservation — initialiser le stock d'abord
        await init_stock_chambre(db, chambre_id)
        stocks = await get_stock_by_chambre(db, chambre_id)

    for stock in stocks:
        if stock.quantite > 0:
            stock.quantite -= 1

    await db.flush()
    return stocks


async def restock_chambre(db: AsyncSession, data: RoomStockRestockRequest) -> RoomStock:
    """
    Réapprovisionne un article spécifique d'une chambre après ménage.
    """
    result = await db.execute(
        select(RoomStock)
        .where(
            and_(
                RoomStock.chambre_id == data.chambre_id,
                RoomStock.item_id == data.item_id
            )
        )
        .options(selectinload(RoomStock.item))
    )
    stock = result.scalar_one_or_none()

    if not stock:
        raise ValueError(f"Stock introuvable pour chambre {data.chambre_id} item {data.item_id}")

    stock.quantite = data.quantite
    await db.flush()
    await db.refresh(stock)
    return stock


async def get_alertes(db: AsyncSession) -> dict:
    """
    Retourne toutes les chambres avec au moins un article sous le seuil d'alerte.
    """
    result = await db.execute(
        select(RoomStock).options(selectinload(RoomStock.item))
    )
    tous_stocks = result.scalars().all()

    alertes = {}
    for stock in tous_stocks:
        if stock.est_bas:
            if stock.chambre_id not in alertes:
                alertes[stock.chambre_id] = []
            alertes[stock.chambre_id].append(stock)

    return alertes
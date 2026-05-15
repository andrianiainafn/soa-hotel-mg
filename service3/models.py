from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime
import enum

Base = declarative_base()


class NotificationStatus(str, enum.Enum):
    EN_ATTENTE = "EN_ATTENTE"
    TRAITEE = "TRAITEE"


class StockItem(Base):
    """Article disponible en stock (gel douche, pantoufle, etc.)"""
    __tablename__ = "stock_items"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), unique=True, nullable=False)    # ex: "Gel douche"
    unite = Column(String(20), nullable=False)                 # ex: "pièce", "rouleau"
    seuil_alerte = Column(Integer, default=5, nullable=False)  # alerte si stock < seuil
    created_at = Column(DateTime, default=datetime.utcnow)

    stocks = relationship("RoomStock", back_populates="item")

    def __repr__(self):
        return f"<StockItem {self.nom}>"


class RoomStock(Base):
    """Stock d'un article pour une chambre donnée"""
    __tablename__ = "room_stocks"

    id = Column(Integer, primary_key=True, index=True)
    chambre_id = Column(String(50), nullable=False)  # id MongoDB venant de service2
    item_id = Column(Integer, ForeignKey("stock_items.id"), nullable=False)
    quantite = Column(Integer, default=0, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    item = relationship("StockItem", back_populates="stocks")

    @property
    def est_bas(self):
        return self.quantite < self.item.seuil_alerte

    def __repr__(self):
        return f"<RoomStock chambre={self.chambre_id} item={self.item_id} qte={self.quantite}>"


class CleaningNotification(Base):
    """Notification envoyée par la femme de ménage après nettoyage"""
    __tablename__ = "cleaning_notifications"

    id = Column(Integer, primary_key=True, index=True)
    chambre_id = Column(String(50), nullable=False)      # id MongoDB venant de service2
    chambre_numero = Column(String(10), nullable=False)  # ex: "101" pour affichage
    femme_menage_id = Column(String(50), nullable=False) # id venant de service1
    statut = Column(Enum(NotificationStatus), default=NotificationStatus.EN_ATTENTE)
    message = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    traitee_at = Column(DateTime, nullable=True)

    def __repr__(self):
        return f"<CleaningNotification chambre={self.chambre_id} statut={self.statut}>"
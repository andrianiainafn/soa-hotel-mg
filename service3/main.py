from fastapi import FastAPI
from contextlib import asynccontextmanager
from database import init_db
from routers import stock, menage
import os


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Exécuté au démarrage et à l'arrêt de l'app"""
    # Démarrage — créer les tables
    await init_db()
    print("✅ Base de données initialisée", flush=True)
    yield
    # Arrêt — rien à faire pour l'instant
    print("🛑 Service3 arrêté", flush=True)


app = FastAPI(
    title="Service3 — Stock & Ménage",
    description="Gestion du stock des articles par chambre et notifications de ménage",
    version="1.0.0",
    lifespan=lifespan
)

# Enregistrement des routers
app.include_router(stock.router)
app.include_router(menage.router)


@app.get("/health")
async def health():
    return {"service": "service3", "status": "ok", "version": "1.0.0"}


@app.get("/test")
async def test():
    """Compatibilité avec l'ancien endpoint"""
    return {"service": "service3", "status": "ok"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8082))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
"""
Point d'entrée de l'application FastAPI
"""
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


from app.config import get_settings
from app.routes import mesures

settings = get_settings()

# Création de l'application FastAPI
app = FastAPI(
    title=settings.app_name,
    description="API REST pour gérer les données de leucocytes sur 25 ans",
    version=settings.app_version,
    debug=settings.debug
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusion des routes
app.include_router(mesures.router, prefix=settings.api_prefix)


@app.get("/", tags=["Root"])
async def root():
    """Route racine de l'API"""
    return {
        "message": settings.app_name,
        "version": settings.app_version,
        "documentation": "/docs"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Vérifie que l'API fonctionne"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }


if __name__ == "__main__":
    import uvicorn

    print("🚀 Démarrage du serveur API...")
    print(f"📚 Documentation disponible sur: http://localhost:8000/docs")
    print(f"🔧 API disponible sur: http://localhost:8000{settings.api_prefix}")

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        log_level="info"
    )

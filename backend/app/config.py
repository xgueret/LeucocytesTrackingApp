"""
Configuration de l'application
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Application
    app_name: str = "API Suivi des Leucocytes"
    app_version: str = "1.0.0"
    debug: bool = True
    
    # Base de données
    database_url: str = "leucocytes.db"
    
    # CORS
    cors_origins: list = ["http://localhost:3000", "http://localhost:5173"]
    
    # API
    api_prefix: str = "/api"
    
    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()
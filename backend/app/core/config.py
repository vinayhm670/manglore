import os
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl, validator

class Settings(BaseSettings):
    PROJECT_NAME: str = "PULSEORA"
    TAGLINE: str = "Every Beat. Every Signal. Every Life."
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    SECRET_KEY: str = "pulseora_super_secret_production_key_2026_build4karnataka_nitte"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database: SQLite default for instant zero-dependency local runs, or PostgreSQL
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./pulseora.db")
    
    # Ingestion & Simulators
    DEMO_MODE: bool = True
    SIMULATOR_UPDATE_INTERVAL_SECONDS: int = 3
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]
    
    # LLM Settings
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "anthropic")  # anthropic, mock
    
    # Emergency numbers
    EMERGENCY_NUMBER_POLICE_FIRE: str = "112"
    EMERGENCY_NUMBER_AMBULANCE: str = "108"
    
    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", extra="allow")

settings = Settings()

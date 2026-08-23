import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings
from typing import Optional

load_dotenv()

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./agent_ci.db"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    GEMINI_API_KEY: Optional[str] = None
    LLM_MODEL: str = "gemini-3.7-flash"
    GEMINI_FALLBACK_MODEL: Optional[str] = "gemini-2.5-flash"
    LLM_PROVIDER: str = "gemini"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()


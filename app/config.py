from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    # LLM
    groq_api_key: str
    groq_model: str = "llama-3.3-70b-versatile"
    openrouter_api_key: str = ""

    # Storage
    chroma_persist_dir: str = "./chroma_db"
    manim_output_dir: str = "./static/animations"
    manim_quality: str = "low"

    # App
    app_env: str = "development"
    log_level: str = "INFO"
    max_paper_cache: int = 50

    class Config:
        env_file = ".env"


settings = Settings()

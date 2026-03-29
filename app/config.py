from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    # LLM - Core
    groq_api_key: str
    groq_model: str = "llama-3.3-70b-versatile"
    openrouter_api_key: str = ""
    deepseek_model: str = "deepseek/deepseek-chat-v3-0324:free"
    gemini_api_key: str = ""

    # LLM - Optional: Scene Planner (defaults to Groq if not set)
    planner_base_url: str = ""  # e.g., "https://integrate.api.nvidia.com/v1"
    planner_api_key: str = ""   # NVIDIA API key
    planner_model: str = ""     # e.g., "nvidia/llama-3.1-nemotron-70b-instruct"

    # LLM - Optional: Code Generator (defaults to DeepSeek if not set)
    codegen_model: str = ""     # e.g., "qwen/qwen-2.5-coder-32b-instruct"
    codegen_api_key: str = ""   # Defaults to openrouter_api_key if not set

    # Storage
    chroma_persist_dir: str = str(Path(__file__).parent.parent / "chroma_db")
    manim_output_dir: str = str(Path(__file__).parent.parent / "static" / "animations")
    manim_quality: str = "low"

    # App
    app_env: str = "development"
    log_level: str = "INFO"
    max_paper_cache: int = 50

    class Config:
        env_file = ".env"


settings = Settings()

import os

class Settings:
    PROJECT_NAME: str = "Smart Campus Lost & Found AI Service"
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    USE_MOCK_MODELS: bool = os.getenv("USE_MOCK_MODELS", "true").lower() in ("true", "1", "yes")

    # Model specifications from build guide
    YOLO_MODEL: str = os.getenv("YOLO_MODEL", "yolo11n.pt")
    CLIP_MODEL: str = os.getenv("CLIP_MODEL", "openai/clip-vit-base-patch32")
    TEXT_MODEL: str = os.getenv("TEXT_MODEL", "sentence-transformers/all-MiniLM-L6-v2")

settings = Settings()

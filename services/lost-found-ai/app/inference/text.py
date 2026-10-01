import math
import logging
from typing import List
from app.config import settings

logger = logging.getLogger(__name__)

class TextEmbedder:
    def __init__(self):
        self.model = None
        self.is_loaded = False
        self._load_model()

    def _load_model(self):
        if settings.USE_MOCK_MODELS:
            logger.info("Text Embedder running in mock mode.")
            return

        try:
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer(settings.TEXT_MODEL)
            self.is_loaded = True
            logger.info("Loaded real SentenceTransformer model: %s", settings.TEXT_MODEL)
        except Exception as e:
            logger.warning("Could not load Text model (%s). Falling back to mock: %s", settings.TEXT_MODEL, e)
            self.is_loaded = False

    def embed_text(self, text: str) -> List[float]:
        if not self.is_loaded or self.model is None:
            # Deterministic 384-dim mock vector normalized to unit length
            vec = [math.sin(len(text) + i) for i in range(384)]
            norm = math.sqrt(sum(x * x for x in vec)) or 1.0
            return [round(x / norm, 4) for x in vec]

        try:
            emb = self.model.encode(text, normalize_embeddings=True)
            return emb.tolist()
        except Exception as e:
            logger.error("Text embedding failed: %s", e)
            return [0.0] * 384

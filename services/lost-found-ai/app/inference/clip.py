import math
import logging
from typing import List, Optional
from app.config import settings

logger = logging.getLogger(__name__)

class CLIPEmbedder:
    def __init__(self):
        self.model = None
        self.processor = None
        self.is_loaded = False
        self._load_model()

    def _load_model(self):
        if settings.USE_MOCK_MODELS:
            logger.info("CLIP Embedder running in mock mode.")
            return

        try:
            from transformers import CLIPProcessor, CLIPModel
            self.model = CLIPModel.from_pretrained(settings.CLIP_MODEL)
            self.processor = CLIPProcessor.from_pretrained(settings.CLIP_MODEL)
            self.is_loaded = True
            logger.info("Loaded real CLIP model: %s", settings.CLIP_MODEL)
        except Exception as e:
            logger.warning("Could not load CLIP model (%s). Falling back to mock: %s", settings.CLIP_MODEL, e)
            self.is_loaded = False

    def embed_image(self, image_url: str) -> Optional[List[float]]:
        if not self.is_loaded or self.model is None:
            # Deterministic 512-dim mock vector normalized to unit length
            vec = [math.cos(len(image_url) + i) for i in range(512)]
            norm = math.sqrt(sum(x * x for x in vec)) or 1.0
            return [round(x / norm, 4) for x in vec]

        # In real execution with transformers and PIL
        try:
            import requests
            from PIL import Image
            import torch
            image = Image.open(requests.get(image_url, stream=True).raw)
            inputs = self.processor(images=image, return_tensors="pt")
            with torch.no_grad():
                features = self.model.get_image_features(**inputs)
                features = features / features.norm(p=2, dim=-1, keepdim=True)
            return features[0].tolist()
        except Exception as e:
            logger.error("CLIP image embedding failed: %s", e)
            return None

import logging
from typing import List
from app.models import DetectedObject
from app.config import settings

logger = logging.getLogger(__name__)

class YOLODetector:
    def __init__(self):
        self.model = None
        self.is_loaded = False
        self._load_model()

    def _load_model(self):
        if settings.USE_MOCK_MODELS:
            logger.info("YOLO Detector running in mock mode.")
            return

        try:
            from ultralytics import YOLO
            self.model = YOLO(settings.YOLO_MODEL)
            self.is_loaded = True
            logger.info("Loaded real YOLO model: %s", settings.YOLO_MODEL)
        except Exception as e:
            logger.warning("Could not load YOLO model (%s). Falling back to mock: %s", settings.YOLO_MODEL, e)
            self.is_loaded = False

    def detect(self, image_url: str) -> List[DetectedObject]:
        if not self.is_loaded or self.model is None:
            # Deterministic mock detection
            return [
                DetectedObject(label="object", confidence=0.88, box=[0.1, 0.1, 0.9, 0.9])
            ]

        try:
            results = self.model(image_url)
            detections = []
            for r in results:
                for box in r.boxes:
                    cls_id = int(box.cls[0].item())
                    label = self.model.names.get(cls_id, "unknown")
                    conf = float(box.conf[0].item())
                    coords = [float(x) for x in box.xyxy[0].tolist()]
                    detections.append(DetectedObject(label=label, confidence=conf, box=coords))
            return detections
        except Exception as e:
            logger.error("YOLO inference failed: %s", e)
            return []

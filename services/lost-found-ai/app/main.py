from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
import logging
from app.config import settings
from app.models import AnalyzeItemRequest, AnalyzeItemResponse
from app.inference.yolo import YOLODetector
from app.inference.clip import CLIPEmbedder
from app.inference.text import TextEmbedder
from app.inference.category import guess_category

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# State containers for models loaded once at startup
models = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing models at service startup...")
    models["yolo"] = YOLODetector()
    models["clip"] = CLIPEmbedder()
    models["text"] = TextEmbedder()
    logger.info("Models initialized. Service ready.")
    yield
    logger.info("Shutting down AI service.")
    models.clear()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Stateless multimodal AI service for Smart Campus Lost & Found",
    version="0.1.0",
    lifespan=lifespan,
)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "lost-found-ai",
        "mock_mode": settings.USE_MOCK_MODELS,
    }

@app.post("/analyze", response_model=AnalyzeItemResponse)
def analyze_item(request: AnalyzeItemRequest):
    try:
        combined_text = f"{request.title}. {request.description}"

        # 1. Text Embedding (384-dim)
        text_embedder: TextEmbedder = models.get("text") or TextEmbedder()
        text_emb = text_embedder.embed_text(combined_text)

        # 2. Image Embedding (512-dim) & Object Detection
        image_emb = None
        detections = []
        if request.imageUrls and len(request.imageUrls) > 0:
            first_image = request.imageUrls[0]
            clip_embedder: CLIPEmbedder = models.get("clip") or CLIPEmbedder()
            image_emb = clip_embedder.embed_image(first_image)

            yolo_detector: YOLODetector = models.get("yolo") or YOLODetector()
            detections = yolo_detector.detect(first_image)

        # 3. Category Inference
        suggested_category = guess_category(combined_text)

        is_mock = not (
            models.get("yolo", YOLODetector()).is_loaded and
            models.get("clip", CLIPEmbedder()).is_loaded and
            models.get("text", TextEmbedder()).is_loaded
        )

        return AnalyzeItemResponse(
            itemId=request.itemId,
            textEmbedding=text_emb,
            imageEmbedding=image_emb,
            detectedObjects=detections,
            suggestedCategory=suggested_category,
            isMock=is_mock,
        )
    except Exception as e:
        logger.error("Analysis failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))

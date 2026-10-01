from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
import logging
from app.config import settings
from app.models import AnalyzeItemRequest, AnalyzeItemResponse
from app.inference.yolo import YOLODetector
from app.inference.clip import CLIPEmbedder
from app.inference.text import TextEmbedder
from app.inference.category import guess_category
import requests
from io import BytesIO
from PIL import Image

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

        # 2. Image Embedding & Object Detection with Cropping
        image_emb = None
        detections = []
        if request.imageUrls and len(request.imageUrls) > 0:
            first_image = request.imageUrls[0]
            
            yolo_detector: YOLODetector = models.get("yolo") or YOLODetector()
            detections = yolo_detector.detect(first_image)

            clip_embedder: CLIPEmbedder = models.get("clip") or CLIPEmbedder()
            
            # Phase 4: Crop with YOLO before CLIP embedding if we have detections and not in mock mode
            # If in mock mode, PIL image open might fail on fake URLs, so check if real YOLO
            if yolo_detector.is_loaded and len(detections) > 0:
                try:
                    response = requests.get(first_image, stream=True)
                    response.raise_for_status()
                    img = Image.open(BytesIO(response.content))
                    
                    # Get the most confident detection box [xmin, ymin, xmax, ymax]
                    best_det = max(detections, key=lambda d: d.confidence)
                    if best_det.box and len(best_det.box) == 4:
                        logger.info(f"Cropping image using YOLO detection: {best_det.label} ({best_det.confidence:.2f})")
                        cropped_img = img.crop((best_det.box[0], best_det.box[1], best_det.box[2], best_det.box[3]))
                        
                        # Assuming clip_embedder can handle PIL Image if we pass it via a modified method or save to temp
                        import tempfile
                        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
                            cropped_img.convert('RGB').save(tmp.name)
                            image_emb = clip_embedder.embed_image(tmp.name)
                except Exception as e:
                    logger.warning(f"Failed to crop image before CLIP: {e}")
                    image_emb = clip_embedder.embed_image(first_image)
            else:
                image_emb = clip_embedder.embed_image(first_image)

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

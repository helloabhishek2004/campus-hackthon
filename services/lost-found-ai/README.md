# Lost & Found Stateless AI Service

## Overview

A lightweight, stateless Python FastAPI microservice dedicated to multimodal image and text embedding extraction for the Smart Campus Lost & Found system.

## Endpoints

- `GET /health`: Health status and mock mode indicator.
- `POST /analyze`: Accepts `{ itemId, title, description, imageUrls }` and returns 384-dim text embedding, 512-dim image embedding, and detected objects.

## Architecture

- **Object Detection & Cropping**: YOLO11n (`ultralytics`)
- **Visual Embedding**: OpenAI CLIP (`openai/clip-vit-base-patch32`)
- **Semantic Text Embedding**: MiniLM (`sentence-transformers/all-MiniLM-L6-v2`)
- **Stateless Lifecycle**: Models load into memory during FastAPI startup (`lifespan`), avoiding per-request initialization.
- **Deterministic Mock Fallback**: When ML libraries are omitted or `USE_MOCK_MODELS=true`, the service generates deterministic normalized vectors so downstream workers and tests can operate without multi-gigabyte PyTorch downloads.

## Local Execution

```bash
cd services/lost-found-ai
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

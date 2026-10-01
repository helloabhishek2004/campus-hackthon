from typing import List, Optional
from pydantic import BaseModel, Field

class AnalyzeItemRequest(BaseModel):
    itemId: str = Field(..., description="Unique item ID")
    title: str = Field(..., description="Item title")
    description: str = Field(..., description="Item description")
    imageUrls: Optional[List[str]] = Field(default=[], description="List of image URLs to analyze")

class DetectedObject(BaseModel):
    label: str
    confidence: float
    box: Optional[List[float]] = None

class AnalyzeItemResponse(BaseModel):
    itemId: str
    textEmbedding: List[float] = Field(..., description="384-dimensional text embedding")
    imageEmbedding: Optional[List[float]] = Field(default=None, description="512-dimensional CLIP embedding")
    detectedObjects: List[DetectedObject] = Field(default_factory=list)
    suggestedCategory: Optional[str] = None
    isMock: bool = False

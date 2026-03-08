from pydantic import BaseModel
from typing import Optional
import time


class Scene(BaseModel):
    index: int
    script: str
    timing_seconds: int
    image_base64: Optional[str] = None  # base64-encoded PNG


class Storyboard(BaseModel):
    id: str
    title: str
    input_text: str
    scenes: list[Scene]
    created_at: float
    total_duration_seconds: int


class GenerateRequest(BaseModel):
    text: str
    title: Optional[str] = None


class GenerateResponse(BaseModel):
    storyboard_id: str
    message: str


class StoryboardSummary(BaseModel):
    id: str
    title: str
    scene_count: int
    total_duration_seconds: int
    created_at: float

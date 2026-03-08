import logging
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from database import init_db, save_storyboard, list_storyboards, get_storyboard
from models import GenerateRequest, GenerateResponse, StoryboardSummary, Storyboard, Scene
from storyboard_generator import generate_storyboard

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    logger.info("Database initialized")
    yield


app = FastAPI(
    title="Reelcraft API",
    description="Blog-to-video storyboard generator powered by Gemini",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/generate", response_model=GenerateResponse)
async def generate(req: GenerateRequest):
    if not req.text or len(req.text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Input text must be at least 50 characters.")
    if len(req.text) > 20_000:
        raise HTTPException(status_code=400, detail="Input text must be under 20,000 characters.")

    storyboard_id = str(uuid.uuid4())
    title = req.title or (req.text[:60].strip() + "...") if len(req.text) > 60 else req.text.strip()

    logger.info(f"Generating storyboard {storyboard_id} for title: {title[:50]}")

    scenes = await generate_storyboard(req.text)

    if not scenes:
        raise HTTPException(status_code=500, detail="Storyboard generation returned no scenes.")

    total_duration = sum(s["timing_seconds"] for s in scenes)

    storyboard_data = {
        "id": storyboard_id,
        "title": title,
        "input_text": req.text,
        "scenes": scenes,
        "created_at": time.time(),
        "total_duration_seconds": total_duration,
    }

    await save_storyboard(storyboard_data)

    logger.info(f"Storyboard {storyboard_id} saved: {len(scenes)} scenes, {total_duration}s total")

    return GenerateResponse(storyboard_id=storyboard_id, message="Storyboard generated successfully.")


@app.get("/api/storyboards", response_model=list[StoryboardSummary])
async def list_all_storyboards():
    rows = await list_storyboards()
    return [StoryboardSummary(**row) for row in rows]


@app.get("/api/storyboards/{storyboard_id}", response_model=Storyboard)
async def get_storyboard_by_id(storyboard_id: str):
    data = await get_storyboard(storyboard_id)
    if data is None:
        raise HTTPException(status_code=404, detail="Storyboard not found.")

    scenes = [Scene(**s) for s in data["scenes"]]
    return Storyboard(
        id=data["id"],
        title=data["title"],
        input_text=data["input_text"],
        scenes=scenes,
        created_at=data["created_at"],
        total_duration_seconds=data["total_duration_seconds"],
    )

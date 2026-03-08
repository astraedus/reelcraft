import aiosqlite
import json
import os
from pathlib import Path

DB_PATH = os.getenv("DB_PATH", str(Path(__file__).parent / "reelcraft.db"))


async def get_db() -> aiosqlite.Connection:
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    return db


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS storyboards (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                input_text TEXT NOT NULL,
                scenes_json TEXT NOT NULL,
                created_at REAL NOT NULL,
                total_duration_seconds INTEGER NOT NULL
            )
        """)
        await db.commit()


async def save_storyboard(storyboard: dict):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """
            INSERT INTO storyboards (id, title, input_text, scenes_json, created_at, total_duration_seconds)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                storyboard["id"],
                storyboard["title"],
                storyboard["input_text"],
                json.dumps(storyboard["scenes"]),
                storyboard["created_at"],
                storyboard["total_duration_seconds"],
            ),
        )
        await db.commit()


async def list_storyboards() -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT id, title, scenes_json, created_at, total_duration_seconds FROM storyboards ORDER BY created_at DESC"
        ) as cursor:
            rows = await cursor.fetchall()
    result = []
    for row in rows:
        scenes = json.loads(row["scenes_json"])
        result.append(
            {
                "id": row["id"],
                "title": row["title"],
                "scene_count": len(scenes),
                "total_duration_seconds": row["total_duration_seconds"],
                "created_at": row["created_at"],
            }
        )
    return result


async def get_storyboard(storyboard_id: str) -> dict | None:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM storyboards WHERE id = ?", (storyboard_id,)
        ) as cursor:
            row = await cursor.fetchone()
    if row is None:
        return None
    scenes = json.loads(row["scenes_json"])
    return {
        "id": row["id"],
        "title": row["title"],
        "input_text": row["input_text"],
        "scenes": scenes,
        "created_at": row["created_at"],
        "total_duration_seconds": row["total_duration_seconds"],
    }

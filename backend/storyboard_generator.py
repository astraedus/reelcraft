"""
Storyboard generation pipeline using Google Gemini interleaved text+image output.
Falls back to mock data when GOOGLE_API_KEY is not set or the API call fails.
"""

import base64
import io
import logging
import os
import re
import time
from dataclasses import dataclass

logger = logging.getLogger(__name__)

MOCK_MODE = not bool(os.getenv("GOOGLE_API_KEY"))

SYSTEM_PROMPT = """You are a creative director and storyboard artist. Convert the given text into a compelling video storyboard.

For each scene, you MUST:
1. Write a short narration script (2-3 sentences, clear and punchy)
2. Generate a cinematic illustration for the scene
3. Suggest timing in seconds (typically 5-15 seconds per scene)

Format each scene EXACTLY like this:
SCENE [number]
SCRIPT: [narration text]
TIMING: [seconds]
[Generate the illustration here]

Generate 5-8 scenes with illustrations. Make the visuals vivid and story-driven."""


@dataclass
class RawScene:
    index: int
    script: str
    timing_seconds: int
    image_bytes: bytes | None


def _parse_scenes_from_parts(parts) -> list[RawScene]:
    """Parse Gemini response parts (alternating text/image) into scenes."""
    scenes: list[RawScene] = []
    current_text = ""
    current_index = 0

    for part in parts:
        if hasattr(part, "text") and part.text:
            current_text += part.text
        elif hasattr(part, "inline_data") and part.inline_data:
            # We have an image — flush current text as a scene
            script, timing = _extract_scene_metadata(current_text)
            image_bytes = part.inline_data.data  # already bytes
            scenes.append(
                RawScene(
                    index=current_index,
                    script=script,
                    timing_seconds=timing,
                    image_bytes=image_bytes,
                )
            )
            current_index += 1
            current_text = ""

    # Handle trailing text with no final image
    if current_text.strip() and not scenes:
        # Fallback: parse all text blocks into scenes without images
        raw_scenes = _parse_text_only_scenes(current_text)
        for i, (script, timing) in enumerate(raw_scenes):
            scenes.append(RawScene(index=i, script=script, timing_seconds=timing, image_bytes=None))

    return scenes


def _extract_scene_metadata(text: str) -> tuple[str, int]:
    """Extract script and timing from a scene text block."""
    script = ""
    timing = 8  # default

    # Try to find SCRIPT: marker
    script_match = re.search(r"SCRIPT:\s*(.+?)(?=TIMING:|$)", text, re.DOTALL | re.IGNORECASE)
    if script_match:
        script = script_match.group(1).strip()
    else:
        # Fall back to anything after SCENE N header
        clean = re.sub(r"SCENE\s+\d+", "", text, flags=re.IGNORECASE).strip()
        script = clean[:300].strip() if clean else text.strip()[:200]

    # Try to find TIMING: marker
    timing_match = re.search(r"TIMING:\s*(\d+)", text, re.IGNORECASE)
    if timing_match:
        timing = int(timing_match.group(1))
        timing = max(3, min(30, timing))  # clamp 3-30s

    return script, timing


def _parse_text_only_scenes(text: str) -> list[tuple[str, int]]:
    """Fallback: split text into scenes when no images are present."""
    scenes = []
    blocks = re.split(r"SCENE\s+\d+", text, flags=re.IGNORECASE)
    for block in blocks:
        block = block.strip()
        if len(block) < 20:
            continue
        script, timing = _extract_scene_metadata(block)
        if script:
            scenes.append((script, timing))
    return scenes[:8]


def _image_bytes_to_base64(image_bytes: bytes) -> str:
    return base64.b64encode(image_bytes).decode("utf-8")


def _generate_mock_scenes(input_text: str) -> list[RawScene]:
    """Generate deterministic mock scenes for dev/demo purposes."""
    # Create a simple placeholder image (gray gradient PNG via Pillow)
    try:
        from PIL import Image, ImageDraw, ImageFont
        import random

        mock_scenes = []
        snippet = input_text[:80].strip()
        scene_templates = [
            ("Opening shot establishing the main theme.", 8),
            ("The narrative unfolds with key context and setting.", 10),
            ("Conflict or challenge is introduced.", 9),
            ("Rising tension — the stakes become clear.", 8),
            ("A turning point shifts the direction of the story.", 10),
            ("Resolution begins — path forward revealed.", 8),
            ("Climax: the central message lands powerfully.", 12),
            ("Closing call to action and emotional resonance.", 7),
        ]

        for i, (script_template, timing) in enumerate(scene_templates[:6]):
            img = Image.new("RGB", (640, 360), color=(30 + i * 10, 40 + i * 8, 80 + i * 12))
            draw = ImageDraw.Draw(img)
            draw.rectangle([0, 0, 639, 359], outline=(200, 200, 200), width=2)
            draw.text((20, 160), f"Scene {i + 1}", fill=(255, 255, 255))
            draw.text((20, 185), script_template[:60], fill=(180, 180, 180))

            buf = io.BytesIO()
            img.save(buf, format="PNG")
            image_bytes = buf.getvalue()

            mock_scenes.append(
                RawScene(
                    index=i,
                    script=script_template,
                    timing_seconds=timing,
                    image_bytes=image_bytes,
                )
            )
        return mock_scenes

    except ImportError:
        # Pillow not available — return scenes without images
        scene_scripts = [
            ("Opening shot establishing the main theme.", 8),
            ("The narrative unfolds with key context and setting.", 10),
            ("Conflict or challenge is introduced.", 9),
            ("A turning point shifts the direction of the story.", 10),
            ("Resolution begins — path forward revealed.", 8),
            ("Closing call to action and emotional resonance.", 7),
        ]
        return [
            RawScene(index=i, script=s, timing_seconds=t, image_bytes=None)
            for i, (s, t) in enumerate(scene_scripts)
        ]


async def generate_storyboard(input_text: str) -> list[dict]:
    """
    Generate a storyboard from input text.
    Returns a list of scene dicts compatible with the Scene Pydantic model.
    """
    raw_scenes: list[RawScene] = []

    if MOCK_MODE:
        logger.info("GOOGLE_API_KEY not set — using mock storyboard generator")
        raw_scenes = _generate_mock_scenes(input_text)
    else:
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

            prompt = f"""{SYSTEM_PROMPT}

Text to convert:
{input_text}"""

            response = client.models.generate_content(
                model="gemini-2.5-flash-image",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_modalities=["TEXT", "IMAGE"],
                ),
            )

            raw_scenes = _parse_scenes_from_parts(response.parts)

            if not raw_scenes:
                logger.warning("Gemini returned no parseable scenes — falling back to mock")
                raw_scenes = _generate_mock_scenes(input_text)

        except Exception as exc:
            logger.error(f"Gemini API error: {exc} — falling back to mock")
            raw_scenes = _generate_mock_scenes(input_text)

    # Convert to serialisable dicts
    scenes = []
    for scene in raw_scenes:
        image_b64 = _image_bytes_to_base64(scene.image_bytes) if scene.image_bytes else None
        scenes.append(
            {
                "index": scene.index,
                "script": scene.script,
                "timing_seconds": scene.timing_seconds,
                "image_base64": image_b64,
            }
        )

    return scenes

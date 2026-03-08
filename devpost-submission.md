# DevPost Submission — Reelcraft

## Project Name
Reelcraft — Blog-to-Video Storyboard Generator

## Category
Best Creative Storyteller

## Tagline
Transform any blog post into a cinematic video storyboard with AI-generated illustrations in seconds

## Description

### Inspiration
Content marketers spend 4+ hours turning each blog post into a social video: writing scripts, hunting stock photos, designing in Canva, timing everything. That's 15-20 hours per week for a team publishing 3-5 videos. We wanted to collapse that into a single paste-and-generate workflow.

### What it does
Paste any article or blog post, and Reelcraft generates a complete video storyboard:

- **Scene-by-scene narration scripts** with duration estimates
- **AI-generated illustrations** per scene (custom visuals, not stock photos)
- **Interactive timeline** with proportional scene durations
- **Image gallery** with individual scene image downloads
- **PDF export** for sharing with video editors
- **Storyboard history** with SQLite persistence

### How we built it
The key technical innovation is Gemini's **interleaved text+image output**. Instead of generating text and images in separate API calls, we use `gemini-2.5-flash-image` with `response_modalities=['TEXT', 'IMAGE']` to produce alternating text and image blocks in a single response:

```
Response Part 1: Text  → Scene 1 script + timing
Response Part 2: Image → Scene 1 illustration (PNG)
Response Part 3: Text  → Scene 2 script + timing
Response Part 4: Image → Scene 2 illustration (PNG)
...
```

This means each illustration is contextually coherent with its scene script — Gemini generates them together, maintaining visual and narrative consistency across the entire storyboard.

**Backend**: Python FastAPI on Cloud Run. The storyboard generator parses `response.candidates[0].content.parts`, separating text parts (scene metadata) from image parts (inline PNG data).

**Frontend**: Next.js with an interactive timeline component, scene cards with illustrations, and PDF export.

### Challenges we ran into
- The Gemini SDK response structure for interleaved output uses `response.candidates[0].content.parts`, not `response.parts` — discovering this required careful debugging
- Parsing alternating text/image parts requires robust state tracking to match illustrations to their scenes
- Image generation produces ~2MB PNGs per scene, requiring careful memory management

### Accomplishments that we're proud of
- A single API call generates both the narrative script AND matching illustrations
- The visual consistency across scenes is remarkable — characters, settings, and style remain coherent
- The interactive timeline makes it easy to visualize the final video flow

### What we learned
- Gemini's interleaved output is genuinely useful for creative workflows where text and visuals need to be co-generated
- Setting `temperature=1.0` produces more varied and interesting illustrations
- The interleaved approach eliminates the "stock photo" problem — every image is custom-generated for its scene

### What's next for Reelcraft
- Audio narration generation per scene
- Music suggestion engine
- Direct export to video editing tools (Premiere, DaVinci)
- Collaborative editing with multiple storyboard versions

## Built With
- Google Gemini 2.5 Flash (gemini-2.5-flash-image) with interleaved TEXT+IMAGE output
- Google GenAI SDK
- FastAPI + Uvicorn
- Next.js 14 + React 18 + TypeScript
- Tailwind CSS
- Google Cloud Run
- Google Cloud Build
- Google Secret Manager
- SQLite + aiosqlite
- Pillow (mock mode image generation)
- Python 3.12

## Try it out
- GitHub: https://github.com/astraedus/reelcraft
- Live Demo: https://reelcraft-api-93135657352.us-central1.run.app

#GeminiLiveAgentChallenge

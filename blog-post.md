# Building Reelcraft: AI-Powered Blog-to-Video Storyboards with Gemini Interleaved Output

**TL;DR**: I built Reelcraft, a tool that transforms any blog post into a cinematic video storyboard with AI-generated scene illustrations — all in a single Gemini API call using interleaved text+image output, deployed on Cloud Run.

## The Problem

Content marketers repurpose 3-5 blog posts into social videos every week. Each takes 4+ hours: write a script, hunt stock photos, design in Canva, time everything. That's 15-20 hours per week on a task that should take minutes.

## What Reelcraft Does

Paste any article or blog post, and Reelcraft generates a complete video storyboard:

- **Scene-by-scene narration scripts** with timing estimates
- **AI-generated illustrations** for each scene (not stock photos — custom visuals)
- **Interactive timeline** showing scene durations proportionally
- **PDF export** for sharing with video editors
- **Storyboard history** saved to SQLite

The magic: everything generates in a single API call using Gemini's interleaved text+image output.

## The Gemini Interleaved Output Pipeline

This is what makes Reelcraft technically interesting. Instead of generating text and images separately, Gemini 2.5 Flash can produce **alternating text and image blocks** in one response:

```python
response = client.models.generate_content(
    model="gemini-2.5-flash-image",
    contents=prompt,
    config=types.GenerateContentConfig(
        response_modalities=["TEXT", "IMAGE"],
        temperature=1.0,
    ),
)
```

The response contains interleaved parts:

```
Part 1: Text  → "Scene 1: Opening hook. Duration: 5s. Script: ..."
Part 2: Image → [PNG illustration for Scene 1]
Part 3: Text  → "Scene 2: Problem statement. Duration: 8s. Script: ..."
Part 4: Image → [PNG illustration for Scene 2]
...
```

Parsing this requires walking through `response.candidates[0].content.parts` and checking each part's type:

```python
for part in response.candidates[0].content.parts:
    if part.text:
        # Parse scene metadata (title, script, duration)
        current_scene = parse_scene_text(part.text)
    elif part.inline_data:
        # Save the PNG illustration
        image_data = part.inline_data.data
        save_scene_image(current_scene, image_data)
```

The result is a coherent visual narrative where each illustration matches its scene script — because Gemini generates them together, maintaining context across the entire storyboard.

## Architecture

```
Browser (Next.js)                    Google Cloud
  │                                  ┌──────────────────┐
  ├─ Paste article text              │  Cloud Run       │
  │   → POST /api/generate ────►    │  (FastAPI)       │
  │                                  │       │          │
  │                                  │  Gemini 2.5 Flash│
  │                                  │  (interleaved    │
  │                                  │   TEXT + IMAGE)  │
  │                                  │       │          │
  │   ◄── storyboard_id ◄──────    │  Parse parts     │
  │                                  │  Save to SQLite  │
  ├─ GET /api/storyboards/{id}      │  Serve images    │
  │   → Render timeline + scenes     └──────────────────┘
  └─ Export to PDF
```

## Frontend: Interactive Timeline

The storyboard viewer features:

- **Proportional timeline** — each scene's width reflects its duration
- **Scene cards** with narration script, timing, and generated illustration
- **Image gallery** with download buttons for individual scene images
- **PDF export** combining all scenes into a shareable document

## Google Cloud Services

| Service | Purpose |
|---------|---------|
| **Cloud Run** | Backend hosting with auto-scaling (0-3 instances, 1Gi memory for image generation) |
| **Cloud Build** | Container image building |
| **Secret Manager** | API key storage |
| **Generative Language API** | Gemini interleaved text+image generation |

## Infrastructure as Code

Deployment is fully automated:

```bash
export GOOGLE_API_KEY="your-key"
export GOOGLE_CLOUD_PROJECT="your-project-id"
./deploy.sh
```

## Mock Mode

Without a Gemini API key, Reelcraft generates placeholder scenes with Pillow-generated images — the full UI works end-to-end for development and testing.

## Try It

- **GitHub**: https://github.com/astraedus/reelcraft
- **Live Demo**: https://reelcraft-api-93135657352.us-central1.run.app

Built for the Gemini Live Agent Challenge. #GeminiLiveAgentChallenge

---

*Built with Gemini 2.5 Flash interleaved output, FastAPI, Next.js, and Cloud Run.*

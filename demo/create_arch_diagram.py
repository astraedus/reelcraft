#!/usr/bin/env python3
"""Create a clean architecture diagram for Reelcraft demo + DevPost."""

from PIL import Image, ImageDraw, ImageFont
import os, math

DIR = "/home/astraedus/projects/reelcraft/demo"
DOCS_DIR = "/home/astraedus/projects/reelcraft/docs"
W, H = 1920, 1080

BG = (255, 255, 255)
TITLE_COLOR = (30, 30, 30)
ARROW_COLOR = (120, 120, 120)

BOXES = [
    {
        "label": "Next.js Frontend",
        "sub": ["Text Input", "Storyboard Viewer", "PDF/Image Export"],
        "fill": (219, 234, 254),
        "border": (59, 130, 246),
        "text": (30, 64, 175),
    },
    {
        "label": "Cloud Run API",
        "sub": ["FastAPI", "Content Parser", "Scene Generator"],
        "fill": (220, 252, 231),
        "border": (34, 197, 94),
        "text": (22, 101, 52),
    },
    {
        "label": "Gemini 2.5 Flash",
        "sub": ["Interleaved Output", "TEXT + IMAGE mode", "Scenes + Illustrations"],
        "fill": (254, 243, 199),
        "border": (245, 158, 11),
        "text": (146, 64, 14),
    },
    {
        "label": "Response",
        "sub": ["Scene Scripts", "AI Illustrations", "Timing Metadata"],
        "fill": (243, 232, 255),
        "border": (168, 85, 247),
        "text": (88, 28, 135),
    },
]


def get_font(size, bold=True):
    paths = ([
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    ] if bold else [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    ])
    for p in paths:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def draw_arrow(draw, x1, y1, x2, y2):
    draw.line([(x1, y1), (x2, y2)], fill=ARROW_COLOR, width=3)
    angle = math.atan2(y2 - y1, x2 - x1)
    al = 12
    for da in [-0.4, 0.4]:
        ax = x2 - al * math.cos(angle + da)
        ay = y2 - al * math.sin(angle + da)
        draw.polygon([(x2, y2), (int(ax), int(ay)), (x2, y2)], fill=ARROW_COLOR)
    # Proper arrowhead
    ax1 = x2 - al * math.cos(angle - 0.4)
    ay1 = y2 - al * math.sin(angle - 0.4)
    ax2 = x2 - al * math.cos(angle + 0.4)
    ay2 = y2 - al * math.sin(angle + 0.4)
    draw.polygon([(x2, y2), (int(ax1), int(ay1)), (int(ax2), int(ay2))], fill=ARROW_COLOR)


def create_diagram():
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)

    # Title
    tf = get_font(48)
    title = "Reelcraft Architecture"
    bbox = draw.textbbox((0, 0), title, font=tf)
    draw.text(((W - (bbox[2] - bbox[0])) // 2, 50), title, font=tf, fill=TITLE_COLOR)

    sf = get_font(24, bold=False)
    sub = "Blog Post -> Interleaved Gemini TEXT+IMAGE -> Visual Storyboard"
    bbox2 = draw.textbbox((0, 0), sub, font=sf)
    draw.text(((W - (bbox2[2] - bbox2[0])) // 2, 110), sub, font=sf, fill=(100, 100, 100))

    # Key differentiator callout
    cf = get_font(18, bold=False)
    callout = "Key Innovation: Single API call generates BOTH scene scripts AND matching illustrations (interleaved output)"
    bbox3 = draw.textbbox((0, 0), callout, font=cf)
    cw = bbox3[2] - bbox3[0]
    cx = (W - cw) // 2 - 15
    cy = 155
    draw.rounded_rectangle([(cx, cy), (cx + cw + 30, cy + 32)], radius=8,
                           fill=(254, 243, 199), outline=(245, 158, 11), width=1)
    draw.text((cx + 15, cy + 6), callout, font=cf, fill=(146, 64, 14))

    num_boxes = len(BOXES)
    box_w = 340
    box_h = 260
    total_w = num_boxes * box_w + (num_boxes - 1) * 60
    start_x = (W - total_w) // 2
    box_y = (H - box_h) // 2 + 50

    lf = get_font(26)
    slbf = get_font(18, bold=False)

    box_centers = []
    for i, box in enumerate(BOXES):
        x = start_x + i * (box_w + 60)
        draw.rounded_rectangle([(x, box_y), (x + box_w, box_y + box_h)],
                               radius=16, fill=box["fill"], outline=box["border"], width=3)
        bbox = draw.textbbox((0, 0), box["label"], font=lf)
        lw = bbox[2] - bbox[0]
        lh = bbox[3] - bbox[1]
        draw.text((x + (box_w - lw) // 2, box_y + 25), box["label"], font=lf, fill=box["text"])
        div_y = box_y + 25 + lh + 15
        draw.line([(x + 20, div_y), (x + box_w - 20, div_y)], fill=box["border"], width=1)
        sub_y = div_y + 15
        for st in box["sub"]:
            bbox = draw.textbbox((0, 0), st, font=slbf)
            sth = bbox[3] - bbox[1]
            bx = x + 30
            draw.ellipse([(bx, sub_y + sth // 2 - 3), (bx + 6, sub_y + sth // 2 + 3)], fill=box["border"])
            draw.text((bx + 14, sub_y), st, font=slbf, fill=box["text"])
            sub_y += sth + 12
        box_centers.append((x + box_w, box_y + box_h // 2))

    for i in range(num_boxes - 1):
        x1 = box_centers[i][0] + 4
        y1 = box_centers[i][1]
        x2 = start_x + (i + 1) * (box_w + 60) - 4
        draw_arrow(draw, x1, y1, x2, y1)

    ff = get_font(18, bold=False)
    footer = "Gemini Live Agent Challenge 2026 - Creative Storyteller Track"
    bbox = draw.textbbox((0, 0), footer, font=ff)
    draw.text(((W - (bbox[2] - bbox[0])) // 2, H - 60), footer, font=ff, fill=(150, 150, 150))

    # Save
    for path in [os.path.join(DIR, "99_architecture_clean.png"),
                 os.path.join(DOCS_DIR, "architecture-clean.png")]:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        img.save(path)
        print(f"Saved: {path}")


if __name__ == "__main__":
    create_diagram()

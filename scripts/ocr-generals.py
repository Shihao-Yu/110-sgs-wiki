#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import cv2
import numpy as np
from PIL import Image, ImageFilter, ImageOps
from rapidocr_onnxruntime import RapidOCR


@dataclass(frozen=True)
class CropBox:
    left: float
    top: float
    right: float
    bottom: float

    def to_pixels(self, width: int, height: int) -> tuple[int, int, int, int]:
        return (
            int(width * self.left),
            int(height * self.top),
            int(width * self.right),
            int(height * self.bottom),
        )


# Crop boxes calibrated against 国战 cards (1098×1542 typical).
# Card vertical layout: top-bar (HP icons) → faction icon + 称号 → 武将名
# Empirically:
#   - 称号 (small vertical chars) spans ~10–45% of card height on left strip
#   - 武将名 (large vertical chars) spans ~42–72% on left strip
#   - 技能区 (red name + black description) spans ~73–92%
#   - 顶部 HP 链 lives in the top ~10%, horizontally centered-left
TITLE_BOX = CropBox(0.03, 0.10, 0.14, 0.45)
NAME_BOX = CropBox(0.03, 0.42, 0.18, 0.72)
SKILLS_BOX = CropBox(0.04, 0.73, 0.96, 0.92)
HP_BOX = CropBox(0.10, 0.020, 0.55, 0.075)


# Common OCR noise we strip from outputs.
WATERMARK_PATTERNS = [
    re.compile(r"^TM$"),
    re.compile(r"^™$"),
    re.compile(r"^TM&.*"),
    re.compile(r".*©.*\d{4}.*"),
    re.compile(r"^WEI\s*\d+$", re.IGNORECASE),
    re.compile(r"^SHU\s*\d+$", re.IGNORECASE),
    re.compile(r"^WU\s*\d+$", re.IGNORECASE),
    re.compile(r"^QUN\s*\d+$", re.IGNORECASE),
    re.compile(r"^JIN\s*\d+$", re.IGNORECASE),
    re.compile(r"Illustration", re.IGNORECASE),
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run OCR over SGS general card images and dump raw extracted text.",
    )
    parser.add_argument(
        "--input-dir",
        type=Path,
        default=Path("assets/generals"),
        help="Directory containing general card PNG files.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("packages/data/src/ocr-generals.json"),
        help="JSON file to write OCR results to.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Only process the first N images for quick tests.",
    )
    parser.add_argument(
        "--match",
        type=str,
        default="",
        help="Only process image paths containing this substring.",
    )
    parser.add_argument(
        "--shard-count",
        type=int,
        default=1,
        help="Split the work into N deterministic shards.",
    )
    parser.add_argument(
        "--shard-index",
        type=int,
        default=0,
        help="Zero-based shard index to process.",
    )
    return parser.parse_args()


def load_images(
    input_dir: Path,
    limit: int,
    match: str,
    shard_count: int,
    shard_index: int,
) -> list[Path]:
    paths = sorted(input_dir.glob("*.png"))
    if match:
        paths = [path for path in paths if match in path.name]
    if shard_count < 1:
        raise ValueError("shard-count must be >= 1")
    if shard_index < 0 or shard_index >= shard_count:
        raise ValueError("shard-index must be within [0, shard-count)")
    if shard_count > 1:
        paths = [
            path for idx, path in enumerate(paths) if idx % shard_count == shard_index
        ]
    if limit > 0:
        paths = paths[:limit]
    return paths


def preprocess_crop(image: Image.Image, crop_box: CropBox) -> Image.Image:
    cropped = image.crop(crop_box.to_pixels(*image.size)).convert("L")
    cropped = ImageOps.autocontrast(cropped)
    cropped = cropped.resize((cropped.width * 2, cropped.height * 2))
    return cropped.filter(ImageFilter.SHARPEN)


def normalize_text(text: str) -> str:
    return "".join(text.split())


def is_watermark(text: str) -> bool:
    if not text:
        return True
    for pat in WATERMARK_PATTERNS:
        if pat.search(text):
            return True
    return False


def clean_skill_lines(lines: list[str]) -> list[str]:
    cleaned: list[str] = []
    for raw in lines:
        line = raw.strip()
        if not line:
            continue
        if is_watermark(line):
            continue
        cleaned.append(line)
    return cleaned


def sort_ocr_lines(result: Iterable[list[object]]) -> list[dict[str, object]]:
    normalized: list[dict[str, object]] = []
    for item in result:
        points = item[0]
        text = str(item[1]).strip()
        score = float(item[2])
        top = min(point[1] for point in points)
        normalized.append(
            {
                "text": text,
                "score": score,
                "top": top,
            }
        )
    normalized.sort(key=lambda entry: float(entry["top"]))
    return normalized


def ocr_single_line(
    engine: RapidOCR,
    image: Image.Image,
    rotations: tuple[int, ...] = (-90, 90),
) -> dict[str, object]:
    best_text = ""
    best_score = -1.0
    best_rotation = 0

    for rotation in rotations:
        rotated = image.rotate(rotation, expand=True)
        result, _ = engine(rotated)
        lines = sort_ocr_lines(result or [])
        text = normalize_text("".join(str(line["text"]) for line in lines))
        score = sum(float(line["score"]) for line in lines) / len(lines) if lines else 0.0
        if len(text) > len(best_text) or (len(text) == len(best_text) and score > best_score):
            best_text = text
            best_score = score
            best_rotation = rotation

    return {
        "text": best_text,
        "score": round(best_score, 4) if best_score >= 0 else 0.0,
        "rotation": best_rotation,
    }


def ocr_multiline(engine: RapidOCR, image: Image.Image) -> dict[str, object]:
    result, _ = engine(image)
    lines = sort_ocr_lines(result or [])
    raw_texts = [str(line["text"]) for line in lines if str(line["text"]).strip()]
    cleaned = clean_skill_lines(raw_texts)
    avg_score = round(
        sum(float(line["score"]) for line in lines) / len(lines), 4
    ) if lines else 0.0
    return {
        "lines": cleaned,
        "text": "\n".join(cleaned),
        "avg_score": avg_score,
    }


def detect_hp(image: Image.Image) -> dict[str, object]:
    """Count yin-yang HP indicators in the top bar of the card.

    Each ☯ contributes 2 HP. Approach: crop the HP strip, find circles via
    HoughCircles, then for each circle test whether it's a real ☯ (high
    bright+dark contrast inside) vs an empty hexagon/decoration.
    """
    crop = image.crop(HP_BOX.to_pixels(*image.size)).convert("RGB")
    cv = cv2.cvtColor(np.array(crop), cv2.COLOR_RGB2GRAY)
    h, w = cv.shape

    blurred = cv2.medianBlur(cv, 5)
    # Yin-yang icons are roughly the height of the crop band (cropped band is
    # about as tall as one icon).  Allow some range around that.
    expected_radius = h // 2
    circles = cv2.HoughCircles(
        blurred,
        cv2.HOUGH_GRADIENT,
        dp=1.2,
        minDist=int(expected_radius * 1.6),
        param1=80,
        param2=30,
        minRadius=int(expected_radius * 0.55),
        maxRadius=int(expected_radius * 1.25),
    )

    yinyang_count = 0
    candidates: list[dict[str, object]] = []
    if circles is not None:
        for cx, cy, r in np.round(circles[0]).astype(int):
            # Read the small sub-image inside this circle, tightened a bit.
            r2 = max(int(r * 0.75), 4)
            x0, x1 = max(cx - r2, 0), min(cx + r2, w)
            y0, y1 = max(cy - r2, 0), min(cy + r2, h)
            sub = cv[y0:y1, x0:x1]
            if sub.size == 0:
                continue
            # A real ☯ has BOTH a very bright region (>200) and a very dark
            # region (<60). Empty hex / connector usually skews to one extreme.
            bright_frac = float((sub > 200).mean())
            dark_frac = float((sub < 60).mean())
            is_yinyang = bright_frac > 0.06 and dark_frac > 0.06
            candidates.append(
                {
                    "x": int(cx),
                    "y": int(cy),
                    "r": int(r),
                    "bright": round(bright_frac, 3),
                    "dark": round(dark_frac, 3),
                    "yinyang": is_yinyang,
                }
            )
            if is_yinyang:
                yinyang_count += 1

    return {
        "iconCount": yinyang_count,
        "hp": yinyang_count * 2 if yinyang_count > 0 else None,
        "candidates": candidates,
    }


def extract_card(engine: RapidOCR, path: Path) -> dict[str, object]:
    image = Image.open(path)
    title = ocr_single_line(engine, preprocess_crop(image, TITLE_BOX))
    name = ocr_single_line(engine, preprocess_crop(image, NAME_BOX))
    skills = ocr_multiline(engine, preprocess_crop(image, SKILLS_BOX))
    hp_info = detect_hp(image)

    return {
        "image": path.as_posix(),
        "title": title["text"],
        "titleScore": title["score"],
        "name": name["text"],
        "nameScore": name["score"],
        "hp": hp_info["hp"],
        "hpIconCount": hp_info["iconCount"],
        "skillsText": skills["text"],
        "skillLines": skills["lines"],
        "skillsScore": skills["avg_score"],
    }


def main() -> None:
    args = parse_args()
    images = load_images(
        args.input_dir,
        args.limit,
        args.match,
        args.shard_count,
        args.shard_index,
    )
    if not images:
        raise SystemExit("no images matched")

    args.output.parent.mkdir(parents=True, exist_ok=True)
    engine = RapidOCR()
    extracted = []
    for i, path in enumerate(images, 1):
        print(f"[{i}/{len(images)}] {path.name}")
        extracted.append(extract_card(engine, path))

    payload = {
        "sourceDir": args.input_dir.as_posix(),
        "count": len(extracted),
        "shardCount": args.shard_count,
        "shardIndex": args.shard_index,
        "items": extracted,
    }
    args.output.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"wrote {len(extracted)} OCR records to {args.output}")


if __name__ == "__main__":
    main()
